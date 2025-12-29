import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly ignoredPaths;
    catch(exception: unknown, host: ArgumentsHost): void;
}
