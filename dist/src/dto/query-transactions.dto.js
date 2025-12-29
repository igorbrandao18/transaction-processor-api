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
exports.QueryTransactionsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const transaction_entity_1 = require("../entities/transaction.entity");
class QueryTransactionsDto {
    page = 1;
    limit = 20;
    status;
    type;
    startDate;
    endDate;
}
exports.QueryTransactionsDto = QueryTransactionsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Page number for pagination. Starts from 1.',
        example: 1,
        minimum: 1,
        default: 1,
        examples: {
            'First Page': {
                value: 1,
                summary: 'First page of results',
            },
            'Second Page': {
                value: 2,
                summary: 'Second page of results',
            },
            'Last Page': {
                value: 5,
                summary: 'Fifth page of results',
            },
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryTransactionsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Number of items per page. Maximum value is 100.',
        example: 20,
        minimum: 1,
        maximum: 100,
        default: 20,
        examples: {
            'Small Page': {
                value: 10,
                summary: '10 items per page',
            },
            'Default Page': {
                value: 20,
                summary: '20 items per page (default)',
            },
            'Large Page': {
                value: 50,
                summary: '50 items per page',
            },
            'Maximum Page': {
                value: 100,
                summary: '100 items per page (maximum)',
            },
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QueryTransactionsDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter transactions by status. Returns only transactions with the specified status.',
        enum: transaction_entity_1.TransactionStatus,
        example: transaction_entity_1.TransactionStatus.PENDING,
        examples: {
            Pending: {
                value: transaction_entity_1.TransactionStatus.PENDING,
                summary: 'Transactions that are pending processing',
            },
            Completed: {
                value: transaction_entity_1.TransactionStatus.COMPLETED,
                summary: 'Transactions that have been completed successfully',
            },
            Failed: {
                value: transaction_entity_1.TransactionStatus.FAILED,
                summary: 'Transactions that have failed',
            },
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(transaction_entity_1.TransactionStatus),
    __metadata("design:type", String)
], QueryTransactionsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter transactions by type. Returns only transactions of the specified type.',
        enum: transaction_entity_1.TransactionType,
        example: transaction_entity_1.TransactionType.CREDIT,
        examples: {
            Credit: {
                value: transaction_entity_1.TransactionType.CREDIT,
                summary: 'Credit transactions (money received)',
            },
            Debit: {
                value: transaction_entity_1.TransactionType.DEBIT,
                summary: 'Debit transactions (money sent)',
            },
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(transaction_entity_1.TransactionType),
    __metadata("design:type", String)
], QueryTransactionsDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Start date for filtering transactions. Returns transactions created on or after this date. Must be in ISO 8601 format.',
        example: '2024-01-01T00:00:00Z',
        examples: {
            'Start of Year': {
                value: '2024-01-01T00:00:00Z',
                summary: 'Start of the year 2024',
            },
            'Start of Month': {
                value: '2024-01-15T00:00:00Z',
                summary: 'Start of January 15, 2024',
            },
            'Specific Date': {
                value: '2024-12-25T00:00:00Z',
                summary: 'Christmas Day 2024',
            },
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryTransactionsDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'End date for filtering transactions. Returns transactions created on or before this date. Must be in ISO 8601 format.',
        example: '2024-12-31T23:59:59Z',
        examples: {
            'End of Year': {
                value: '2024-12-31T23:59:59Z',
                summary: 'End of the year 2024',
            },
            'End of Month': {
                value: '2024-01-31T23:59:59Z',
                summary: 'End of January 2024',
            },
            'Specific Date': {
                value: '2024-12-25T23:59:59Z',
                summary: 'End of Christmas Day 2024',
            },
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryTransactionsDto.prototype, "endDate", void 0);
//# sourceMappingURL=query-transactions.dto.js.map