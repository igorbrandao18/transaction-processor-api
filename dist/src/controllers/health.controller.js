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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const database_config_1 = require("../config/database.config");
const logger_config_1 = require("../config/logger.config");
const health_response_dto_1 = require("../dto/health-response.dto");
let HealthController = class HealthController {
    async check(res) {
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
            return res.status(common_1.HttpStatus.OK).json(health);
        }
        catch (error) {
            health.status = 'DOWN';
            health.checks.database = 'DOWN';
            logger_config_1.logger.error('Health check failed', {
                error: error.message,
                health,
            });
            return res.status(common_1.HttpStatus.SERVICE_UNAVAILABLE).json(health);
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Health check endpoint',
        description: `
      Checks the health status of the service and its dependencies.
      
      Use Cases:
      - Monitoring and alerting systems can use this endpoint to check service availability
      - Load balancers can use this endpoint to determine if the service should receive traffic
      - CI/CD pipelines can use this endpoint to verify successful deployments
      
      Response Codes:
      - 200 OK: Service is healthy and all dependencies are operational
      - 503 Service Unavailable: Service is unhealthy (database connection failed or other critical issue)
      
      Health Checks:
      - Database connectivity: Verifies that the service can connect to the PostgreSQL database
      
      Response Format:
      The response includes:
      - status: Overall service status (UP or DOWN)
      - timestamp: ISO 8601 timestamp of the health check
      - service: Service name
      - version: Service version
      - checks: Individual dependency health checks
    `,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Service is healthy and all dependencies are operational',
        type: health_response_dto_1.HealthCheckDto,
        examples: {
            'Healthy Service': {
                value: {
                    status: 'UP',
                    timestamp: '2024-01-15T10:30:00.000Z',
                    service: 'transaction-processor-api',
                    version: '1.0.0',
                    checks: {
                        database: 'UP',
                    },
                },
                summary: 'Service is healthy and database is connected',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'Service is unhealthy. One or more dependencies are not operational.',
        type: health_response_dto_1.HealthCheckDto,
        examples: {
            'Database Down': {
                value: {
                    status: 'DOWN',
                    timestamp: '2024-01-15T10:30:00.000Z',
                    service: 'transaction-processor-api',
                    version: '1.0.0',
                    checks: {
                        database: 'DOWN',
                    },
                },
                summary: 'Database connection failed',
            },
        },
    }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('health')
], HealthController);
//# sourceMappingURL=health.controller.js.map