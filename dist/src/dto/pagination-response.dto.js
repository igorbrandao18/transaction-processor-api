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
exports.PaginatedTransactionsResponseDto = exports.PaginationMetaDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const transaction_entity_1 = require("@entities/transaction.entity");
class PaginationMetaDto {
    page;
    limit;
    total;
    totalPages;
}
exports.PaginationMetaDto = PaginationMetaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Current page number (1-indexed)',
        example: 1,
        minimum: 1,
    }),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of items per page',
        example: 20,
        minimum: 1,
        maximum: 100,
    }),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of items matching the query (across all pages)',
        example: 100,
        minimum: 0,
    }),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of pages available (calculated as Math.ceil(total / limit))',
        example: 5,
        minimum: 0,
    }),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "totalPages", void 0);
class PaginatedTransactionsResponseDto {
    data;
    pagination;
}
exports.PaginatedTransactionsResponseDto = PaginatedTransactionsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of transaction objects matching the query criteria',
        type: transaction_entity_1.Transaction,
        isArray: true,
        example: [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                transactionId: 'txn-2024-01-15-abc123',
                amount: 100.5,
                currency: 'BRL',
                type: 'credit',
                status: 'completed',
                metadata: { source: 'payment-gateway' },
                createdAt: '2024-01-15T10:30:00.000Z',
                updatedAt: '2024-01-15T10:35:00.000Z',
            },
        ],
    }),
    __metadata("design:type", Array)
], PaginatedTransactionsResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Pagination metadata including page, limit, total, and totalPages',
        type: PaginationMetaDto,
        example: {
            page: 1,
            limit: 20,
            total: 100,
            totalPages: 5,
        },
    }),
    __metadata("design:type", PaginationMetaDto)
], PaginatedTransactionsResponseDto.prototype, "pagination", void 0);
//# sourceMappingURL=pagination-response.dto.js.map