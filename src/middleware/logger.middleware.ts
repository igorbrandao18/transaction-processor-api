import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@config/logger.config';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    });

    next();
  }
}
