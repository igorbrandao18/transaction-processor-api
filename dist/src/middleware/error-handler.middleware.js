"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandlerMiddleware = void 0;
const common_1 = require("@nestjs/common");
const logger_config_1 = require("../config/logger.config");
let ErrorHandlerMiddleware = class ErrorHandlerMiddleware {
    ignoredPaths = [
        '/favicon.ico',
        '/service-worker.js',
        '/robots.txt',
        '/manifest.json',
    ];
    logError(statusCode, path, method) {
        if (statusCode >= 500) {
            logger_config_1.logger.error('HTTP Error Response', {
                statusCode,
                path,
                method,
            });
        }
        else {
            logger_config_1.logger.warn('HTTP Client Error Response', {
                statusCode,
                path,
                method,
            });
        }
    }
    use(req, res, next) {
        const originalSend = res.send;
        const ignoredPaths = this.ignoredPaths;
        const logError = this.logError.bind(this);
        res.send = function (body) {
            const pathStr = String(req.path);
            const shouldIgnore = ignoredPaths.some((path) => pathStr.includes(path));
            if (shouldIgnore) {
                return originalSend.call(this, body);
            }
            if (res.statusCode >= 400) {
                if (res.statusCode === 404) {
                    return originalSend.call(this, body);
                }
                else {
                    logError(res.statusCode, req.path, req.method);
                }
            }
            return originalSend.call(this, body);
        };
        next();
    }
};
exports.ErrorHandlerMiddleware = ErrorHandlerMiddleware;
exports.ErrorHandlerMiddleware = ErrorHandlerMiddleware = __decorate([
    (0, common_1.Injectable)()
], ErrorHandlerMiddleware);
//# sourceMappingURL=error-handler.middleware.js.map