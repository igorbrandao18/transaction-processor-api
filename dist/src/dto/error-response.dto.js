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
exports.InternalServerErrorDto = exports.NotFoundErrorDto = exports.ConflictErrorDto = exports.BadRequestErrorDto = exports.ValidationErrorDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ValidationErrorDto {
    property;
    constraints;
}
exports.ValidationErrorDto = ValidationErrorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Field name',
        example: 'amount',
    }),
    __metadata("design:type", String)
], ValidationErrorDto.prototype, "property", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Validation constraints',
        example: {
            isNumber: 'amount must be a number',
            min: 'amount must not be less than 0',
        },
    }),
    __metadata("design:type", Object)
], ValidationErrorDto.prototype, "constraints", void 0);
class BadRequestErrorDto {
    statusCode;
    message;
    errors;
}
exports.BadRequestErrorDto = BadRequestErrorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'HTTP status code',
        example: 400,
    }),
    __metadata("design:type", Number)
], BadRequestErrorDto.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error message',
        example: 'Validation failed',
    }),
    __metadata("design:type", String)
], BadRequestErrorDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Validation errors',
        type: [ValidationErrorDto],
        example: [
            {
                property: 'amount',
                constraints: {
                    isNumber: 'amount must be a number',
                },
            },
        ],
    }),
    __metadata("design:type", Array)
], BadRequestErrorDto.prototype, "errors", void 0);
class ConflictErrorDto {
    statusCode;
    error;
    transactionId;
    existingTransaction;
}
exports.ConflictErrorDto = ConflictErrorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'HTTP status code',
        example: 409,
    }),
    __metadata("design:type", Number)
], ConflictErrorDto.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error message',
        example: 'Transaction already exists',
    }),
    __metadata("design:type", String)
], ConflictErrorDto.prototype, "error", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transaction ID that already exists',
        example: 'unique-transaction-id-123',
    }),
    __metadata("design:type", String)
], ConflictErrorDto.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Existing transaction data',
        example: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            transactionId: 'unique-transaction-id-123',
            amount: 100.5,
            currency: 'BRL',
            type: 'credit',
            status: 'pending',
        },
    }),
    __metadata("design:type", Object)
], ConflictErrorDto.prototype, "existingTransaction", void 0);
class NotFoundErrorDto {
    statusCode;
    message;
    path;
    timestamp;
}
exports.NotFoundErrorDto = NotFoundErrorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'HTTP status code',
        example: 404,
    }),
    __metadata("design:type", Number)
], NotFoundErrorDto.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error message',
        example: 'Transaction not found',
    }),
    __metadata("design:type", String)
], NotFoundErrorDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Request path',
        example: '/transactions/123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], NotFoundErrorDto.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp of the error',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", String)
], NotFoundErrorDto.prototype, "timestamp", void 0);
class InternalServerErrorDto {
    statusCode;
    message;
    path;
    timestamp;
}
exports.InternalServerErrorDto = InternalServerErrorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'HTTP status code',
        example: 500,
    }),
    __metadata("design:type", Number)
], InternalServerErrorDto.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error message',
        example: 'Internal server error',
    }),
    __metadata("design:type", String)
], InternalServerErrorDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Request path',
        example: '/transactions',
    }),
    __metadata("design:type", String)
], InternalServerErrorDto.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp of the error',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", String)
], InternalServerErrorDto.prototype, "timestamp", void 0);
//# sourceMappingURL=error-response.dto.js.map