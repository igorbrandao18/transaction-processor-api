"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsMiddleware = void 0;
const common_1 = require("@nestjs/common");
const metrics_config_1 = require("../config/metrics.config");
let MetricsMiddleware = class MetricsMiddleware {
    use(req, res, next) {
        if (req.path === '/api/metrics') {
            return next();
        }
        const start = Date.now();
        const route = req.route?.path || req.path;
        const method = req.method;
        res.on('finish', () => {
            const duration = (Date.now() - start) / 1000;
            const status = res.statusCode.toString();
            metrics_config_1.httpRequestDuration.observe({
                method,
                route,
                status,
            }, duration);
            metrics_config_1.httpRequestTotal.inc({
                method,
                route,
                status,
            });
            if (res.statusCode >= 400) {
                metrics_config_1.httpRequestErrors.inc({
                    method,
                    route,
                    status,
                });
            }
        });
        next();
    }
};
exports.MetricsMiddleware = MetricsMiddleware;
exports.MetricsMiddleware = MetricsMiddleware = __decorate([
    (0, common_1.Injectable)()
], MetricsMiddleware);
//# sourceMappingURL=metrics.middleware.js.map