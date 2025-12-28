import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@config/logger.config';
import { httpRequestDuration, httpRequestTotal } from '@config/metrics.config';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const route = req.route?.path || req.path;

    // Skip metrics endpoint to avoid infinite loops
    if (route === '/metrics') {
      return next();
    }

    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000; // Convert to seconds
      const statusCode = res.statusCode.toString();

      // Record metrics
      httpRequestDuration
        .labels(req.method, route, statusCode)
        .observe(duration);
      httpRequestTotal.labels(req.method, route, statusCode).inc();

      logger.info('Request completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration * 1000}ms`,
      });
    });

    next();
  }
}
