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

  use(req: Request, res: Response, next: NextFunction) {
    const originalSend = res.send;
    const ignoredPaths = this.ignoredPaths;

    res.send = function (body: any) {
      const shouldIgnore = ignoredPaths.some((path: string) =>
        req.path.includes(path),
      );

      if (shouldIgnore) {
        return originalSend.call(this, body);
      }

      if (res.statusCode >= 400) {
        if (res.statusCode === 404) {
          return originalSend.call(this, body);
        } else if (res.statusCode >= 500) {
          logger.error('HTTP Error Response', {
            statusCode: res.statusCode,
            path: req.path,
            method: req.method,
          });
        } else {
          logger.warn('HTTP Client Error Response', {
            statusCode: res.statusCode,
            path: req.path,
            method: req.method,
          });
        }
      }

      return originalSend.call(this, body);
    };

    next();
  }
}
