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
exports.CreateTransactionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const transaction_entity_1 = require("../entities/transaction.entity");
const validators_1 = require("../utils/validators");
class CreateTransactionDto {
    transactionId;
    amount;
    currency;
    type;
    metadata;
}
exports.CreateTransactionDto = CreateTransactionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Unique transaction identifier (for idempotency). If not provided, a UUID will be generated automatically by the backend. This ID must be unique across all transactions. If a transaction with this ID already exists, the existing transaction will be returned instead of creating a new one.',
        example: 'txn-2024-01-15-abc123def456',
        maxLength: 255,
        pattern: '^[a-zA-Z0-9-_]+$',
        examples: {
            'Payment Gateway': {
                value: 'pg-payment-12345-20240115',
                summary: 'Payment gateway transaction ID (for idempotency)',
            },
            'E-commerce Order': {
                value: 'order-789456-2024-01-15',
                summary: 'E-commerce order transaction ID (for idempotency)',
            },
            'Auto-generated': {
                value: undefined,
                summary: 'If not provided, backend will generate UUID automatically',
            },
        },
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transaction amount in the specified currency. Must be a positive number with maximum 2 decimal places.',
        example: 100.5,
        minimum: 0,
        maximum: 999999999.99,
        examples: {
            'Small Amount': {
                value: 10.99,
                summary: 'Small transaction amount',
            },
            'Medium Amount': {
                value: 1000.5,
                summary: 'Medium transaction amount',
            },
            'Large Amount': {
                value: 50000.0,
                summary: 'Large transaction amount',
            },
        },
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, validators_1.IsAmountPrecision)(),
    __metadata("design:type", Number)
], CreateTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Currency code following ISO 4217 standard. Supported currencies include major world currencies.',
        example: 'BRL',
        enum: [
            'USD',
            'EUR',
            'GBP',
            'BRL',
            'JPY',
            'AUD',
            'CAD',
            'CHF',
            'CNY',
            'SEK',
            'NZD',
            'MXN',
            'SGD',
            'HKD',
            'NOK',
            'TRY',
            'RUB',
            'INR',
            'ZAR',
            'DKK',
            'PLN',
            'TWD',
            'THB',
            'MYR',
            'CZK',
            'HUF',
            'ILS',
            'CLP',
            'PHP',
            'AED',
            'COP',
            'SAR',
            'IDR',
            'KRW',
            'EGP',
            'IQD',
            'ARS',
            'VND',
            'PKR',
            'BGN',
        ],
        examples: {
            'Brazilian Real': {
                value: 'BRL',
                summary: 'Brazilian Real',
            },
            'US Dollar': {
                value: 'USD',
                summary: 'US Dollar',
            },
            Euro: {
                value: 'EUR',
                summary: 'Euro',
            },
        },
    }),
    (0, class_validator_1.IsString)(),
    (0, validators_1.IsCurrencyCode)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type of transaction. CREDIT represents money coming in, DEBIT represents money going out.',
        enum: transaction_entity_1.TransactionType,
        example: transaction_entity_1.TransactionType.CREDIT,
        examples: {
            'Credit Transaction': {
                value: transaction_entity_1.TransactionType.CREDIT,
                summary: 'Money received (deposit, payment received, etc.)',
            },
            'Debit Transaction': {
                value: transaction_entity_1.TransactionType.DEBIT,
                summary: 'Money sent (withdrawal, payment made, etc.)',
            },
        },
    }),
    (0, class_validator_1.IsEnum)(transaction_entity_1.TransactionType),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional metadata as a JSON object. Can include any custom fields relevant to the transaction (e.g., source, reference, customer info, etc.).',
        example: {
            source: 'payment-gateway',
            reference: 'order-123',
            customerId: 'cust-456',
            paymentMethod: 'credit-card',
            merchantId: 'merchant-789',
        },
        examples: {
            'Payment Gateway': {
                value: {
                    source: 'stripe',
                    paymentIntentId: 'pi_1234567890',
                    customerEmail: 'customer@example.com',
                },
                summary: 'Payment gateway metadata',
            },
            'E-commerce': {
                value: {
                    source: 'ecommerce-platform',
                    orderId: 'ORD-12345',
                    customerId: 'CUST-67890',
                    items: ['item1', 'item2'],
                },
                summary: 'E-commerce order metadata',
            },
            'Bank Transfer': {
                value: {
                    source: 'bank-api',
                    transferId: 'TRF-987654',
                    accountFrom: 'ACC-111',
                    accountTo: 'ACC-222',
                },
                summary: 'Bank transfer metadata',
            },
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateTransactionDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-transaction.dto.js.map