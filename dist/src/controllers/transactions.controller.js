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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const transactions_service_1 = require("@services/transactions.service");
const create_transaction_dto_1 = require("@dto/create-transaction.dto");
const query_transactions_dto_1 = require("@dto/query-transactions.dto");
const pagination_response_dto_1 = require("@dto/pagination-response.dto");
const transaction_entity_1 = require("@entities/transaction.entity");
let TransactionsController = class TransactionsController {
    transactionsService;
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    async create(createTransactionDto) {
        return await this.transactionsService.create(createTransactionDto);
    }
    async findAll(query) {
        return await this.transactionsService.findAll(query);
    }
    async getMetadata() {
        return await this.transactionsService.getMetadata();
    }
    async findOne(id) {
        return await this.transactionsService.findById(id);
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new transaction',
        description: 'Creates a new financial transaction. If a transaction with the same transactionId already exists, returns the existing transaction (idempotency).',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Transaction created successfully',
        type: transaction_entity_1.Transaction,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid input data',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Transaction with this ID already exists',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_transaction_dto_1.CreateTransactionDto !== "undefined" && create_transaction_dto_1.CreateTransactionDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List transactions',
        description: 'Retrieves a paginated list of transactions with optional filtering by status, type, and date range.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of transactions retrieved successfully',
        type: pagination_response_dto_1.PaginatedTransactionsResponseDto,
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof query_transactions_dto_1.QueryTransactionsDto !== "undefined" && query_transactions_dto_1.QueryTransactionsDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('metadata'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get transaction metadata',
        description: 'Retrieves available transaction types, statuses, and currencies for form dropdowns.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Metadata retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                types: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['credit', 'debit'],
                },
                statuses: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['pending', 'completed', 'failed'],
                },
                currencies: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['BRL', 'USD', 'EUR', 'GBP', 'JPY'],
                },
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getMetadata", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get transaction by ID',
        description: 'Retrieves a single transaction by its unique identifier (UUID).',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Transaction UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transaction retrieved successfully',
        type: transaction_entity_1.Transaction,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Transaction not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "findOne", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, swagger_1.ApiTags)('transactions'),
    (0, common_1.Controller)('transactions'),
    __metadata("design:paramtypes", [typeof (_a = typeof transactions_service_1.TransactionsService !== "undefined" && transactions_service_1.TransactionsService) === "function" ? _a : Object])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map