"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const database_config_1 = require("../config/database.config");
const logger_config_1 = require("../config/logger.config");
let HealthController = class HealthController {
    async check() {
        const health = {
            status: 'UP',
            timestamp: new Date().toISOString(),
            service: 'transaction-processor-api',
            version: process.env.npm_package_version || '1.0.0',
            checks: {
                database: 'UNKNOWN',
            },
        };
        try {
            const client = await database_config_1.dbPool.connect();
            await client.query('SELECT 1');
            client.release();
            health.checks.database = 'UP';
            logger_config_1.logger.info('Health check passed', { health });
            return health;
        }
        catch (error) {
            health.status = 'DOWN';
            health.checks.database = 'DOWN';
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger_config_1.logger.error('Health check failed', {
                error: errorMessage,
                health,
            });
            return health;
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health')
], HealthController);
//# sourceMappingURL=health.controller.js.map