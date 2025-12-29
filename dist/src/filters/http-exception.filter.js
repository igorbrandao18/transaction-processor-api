"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const logger_config_1 = require("../config/logger.config");
let HttpExceptionFilter = class HttpExceptionFilter {
    ignoredPaths = [
        '/favicon.ico',
        '/service-worker.js',
        '/robots.txt',
        '/manifest.json',
    ];
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const errorResponse = exception instanceof common_1.HttpException
            ? exception.getResponse()
            : { message: 'Internal server error' };
        const shouldIgnore = this.ignoredPaths.some((path) => request.path.includes(path));
        if (shouldIgnore && status === common_1.HttpStatus.NOT_FOUND) {
            response.status(status).json({
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
                ...(typeof errorResponse === 'string'
                    ? { message: errorResponse }
                    : errorResponse),
            });
            return;
        }
        if (status === common_1.HttpStatus.NOT_FOUND) {
            logger_config_1.logger.warn('Resource not found', {
                status,
                error: exception instanceof Error ? exception.message : String(exception),
                path: request.url,
                method: request.method,
            });
        }
        else if (status >= 500) {
            logger_config_1.logger.error('Exception caught', {
                status,
                error: exception instanceof Error ? exception.message : String(exception),
                stack: exception instanceof Error ? exception.stack : undefined,
                path: request.url,
                method: request.method,
            });
        }
        else {
            logger_config_1.logger.warn('Client error', {
                status,
                error: exception instanceof Error ? exception.message : String(exception),
                path: request.url,
                method: request.method,
            });
        }
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            ...(typeof errorResponse === 'string'
                ? { message: errorResponse }
                : errorResponse),
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map