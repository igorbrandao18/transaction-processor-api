import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  httpRequestDuration,
  httpRequestTotal,
  httpRequestErrors,
} from '@config/metrics.config';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/api/metrics') {
      return next();
    }

    const start = Date.now();
    const route = req.route?.path || req.path;
    const method = req.method;

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const status = res.statusCode.toString();

      httpRequestDuration.observe(
        {
          method,
          route,
          status,
        },
        duration,
      );

      httpRequestTotal.inc({
        method,
        route,
        status,
      });

      if (res.statusCode >= 400) {
        httpRequestErrors.inc({
          method,
          route,
          status,
        });
      }
    });

    next();
  }
}
