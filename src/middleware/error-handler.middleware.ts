import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@config/logger.config';

@Injectable()
export class ErrorHandlerMiddleware implements NestMiddleware {
  private readonly ignoredPaths = [
    '/favicon.ico',
    '/service-worker.js',
    '/robots.txt',
    '/manifest.json',
  ];

  private logError(statusCode: number, path: string, method: string): void {
    if (statusCode >= 500) {
      logger.error('HTTP Error Response', {
        statusCode,
        path,
        method,
      });
    } else {
      logger.warn('HTTP Client Error Response', {
        statusCode,
        path,
        method,
      });
    }
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const originalSend = res.send;
    const ignoredPaths = this.ignoredPaths;
    const logError = this.logError.bind(this);

    res.send = function (body: any) {
      const pathStr = String(req.path);
      const shouldIgnore = ignoredPaths.some((path: string) =>
        pathStr.includes(path),
      );

      if (shouldIgnore) {
        return originalSend.call(this, body);
      }

      if (res.statusCode >= 400) {
        if (res.statusCode === 404) {
          return originalSend.call(this, body);
        } else {
          logError(res.statusCode, req.path, req.method);
        }
      }

      return originalSend.call(this, body);
    };

    next();
  }
}
