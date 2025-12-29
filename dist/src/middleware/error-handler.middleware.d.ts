import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class ErrorHandlerMiddleware implements NestMiddleware {
    private readonly ignoredPaths;
    private logError;
    use(req: Request, res: Response, next: NextFunction): void;
}
