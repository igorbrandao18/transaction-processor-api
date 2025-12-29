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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTransactionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const transaction_entity_1 = require("@entities/transaction.entity");
class CreateTransactionDto {
    transactionId;
    amount;
    currency;
    type;
    status;
    metadata;
}
exports.CreateTransactionDto = CreateTransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique transaction identifier (must be unique across the system)',
        example: 'txn-2024-01-15-abc123',
        minLength: 1,
        maxLength: 255,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transaction amount (must be positive)',
        example: 100.5,
        minimum: 0.01,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Currency code (ISO 4217 format, e.g., BRL, USD, EUR)',
        example: 'BRL',
        minLength: 3,
        maxLength: 3,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transaction type',
        enum: transaction_entity_1.TransactionType,
        example: transaction_entity_1.TransactionType.CREDIT,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(transaction_entity_1.TransactionType),
    __metadata("design:type", typeof (_a = typeof transaction_entity_1.TransactionType !== "undefined" && transaction_entity_1.TransactionType) === "function" ? _a : Object)
], CreateTransactionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Transaction status (defaults to "pending" if not provided)',
        enum: transaction_entity_1.TransactionStatus,
        example: transaction_entity_1.TransactionStatus.PENDING,
        default: transaction_entity_1.TransactionStatus.PENDING,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(transaction_entity_1.TransactionStatus),
    __metadata("design:type", typeof (_b = typeof transaction_entity_1.TransactionStatus !== "undefined" && transaction_entity_1.TransactionStatus) === "function" ? _b : Object)
], CreateTransactionDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional metadata associated with the transaction',
        example: {
            source: 'payment-gateway',
            reference: 'order-123',
        },
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateTransactionDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-transaction.dto.js.map