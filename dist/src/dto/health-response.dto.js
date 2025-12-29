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
exports.HealthCheckDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class HealthCheckDto {
    status;
    timestamp;
    service;
    version;
    checks;
}
exports.HealthCheckDto = HealthCheckDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Service health status',
        example: 'UP',
        enum: ['UP', 'DOWN'],
    }),
    __metadata("design:type", String)
], HealthCheckDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Health check timestamp',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", String)
], HealthCheckDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Service name',
        example: 'transaction-processor-api',
    }),
    __metadata("design:type", String)
], HealthCheckDto.prototype, "service", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Service version',
        example: '1.0.0',
    }),
    __metadata("design:type", String)
], HealthCheckDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Health checks for dependencies',
        example: {
            database: 'UP',
        },
    }),
    __metadata("design:type", Object)
], HealthCheckDto.prototype, "checks", void 0);
//# sourceMappingURL=health-response.dto.js.map