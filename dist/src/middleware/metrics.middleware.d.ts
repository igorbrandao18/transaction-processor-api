import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class MetricsMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
}
