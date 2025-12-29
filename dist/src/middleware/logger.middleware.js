"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerMiddleware = void 0;
const common_1 = require("@nestjs/common");
const logger_config_1 = require("../config/logger.config");
const metrics_config_1 = require("../config/metrics.config");
let LoggerMiddleware = class LoggerMiddleware {
    use(req, res, next) {
        const startTime = Date.now();
        const route = req.route?.path || req.path;
        if (route === '/metrics') {
            return next();
        }
        logger_config_1.logger.info('Incoming request', {
            method: req.method,
            path: req.path,
            query: req.query,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
        res.on('finish', () => {
            const duration = (Date.now() - startTime) / 1000;
            const statusCode = res.statusCode.toString();
            metrics_config_1.httpRequestDuration
                .labels(req.method, route, statusCode)
                .observe(duration);
            metrics_config_1.httpRequestTotal.labels(req.method, route, statusCode).inc();
            logger_config_1.logger.info('Request completed', {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration: `${duration * 1000}ms`,
            });
        });
        next();
    }
};
exports.LoggerMiddleware = LoggerMiddleware;
exports.LoggerMiddleware = LoggerMiddleware = __decorate([
    (0, common_1.Injectable)()
], LoggerMiddleware);
//# sourceMappingURL=logger.middleware.js.map