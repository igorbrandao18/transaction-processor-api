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
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const transactions_service_1 = require("../services/transactions.service");
const transactions_queue_1 = require("../queues/transactions.queue");
const create_transaction_dto_1 = require("../dto/create-transaction.dto");
const query_transactions_dto_1 = require("../dto/query-transactions.dto");
const pagination_response_dto_1 = require("../dto/pagination-response.dto");
const transaction_entity_1 = require("../entities/transaction.entity");
let TransactionsController = class TransactionsController {
    transactionsService;
    transactionsQueue;
    constructor(transactionsService, transactionsQueue) {
        this.transactionsService = transactionsService;
        this.transactionsQueue = transactionsQueue;
    }
    async create(createTransactionDto) {
        const { jobId, transactionId } = await this.transactionsQueue.addTransactionJob(createTransactionDto);
        return {
            message: 'Transaction queued for processing',
            jobId,
            transactionId,
        };
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
    async getQueueStatus(transactionId) {
        const status = await this.transactionsQueue.getJobStatus(transactionId);
        if (!status) {
            throw new Error(`Job with transactionId "${transactionId}" not found`);
        }
        return status;
    }
    async getQueueStats() {
        return await this.transactionsQueue.getQueueStats();
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new transaction',
        description: 'Queues a new financial transaction for processing. Returns immediately with job information. The transaction will be processed asynchronously. If a transaction with the same transactionId already exists, the existing transaction is returned (idempotency).',
    }),
    (0, swagger_1.ApiResponse)({
        status: 202,
        description: 'Transaction queued for processing',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Transaction queued for processing',
                },
                jobId: {
                    type: 'string',
                    example: 'txn-2024-01-15-abc123',
                },
                transactionId: {
                    type: 'string',
                    example: 'txn-2024-01-15-abc123',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid input data',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_transaction_dto_1.CreateTransactionDto]),
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
    __metadata("design:paramtypes", [query_transactions_dto_1.QueryTransactionsDto]),
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
__decorate([
    (0, common_1.Get)('queue/:transactionId/status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Get transaction queue status',
        description: 'Retrieves the status of a transaction job in the queue by transactionId.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'transactionId',
        description: 'Transaction ID used as job ID',
        example: 'txn-2024-01-15-abc123',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Job status retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                transactionId: { type: 'string' },
                state: {
                    type: 'string',
                    enum: ['waiting', 'active', 'completed', 'failed'],
                },
                progress: { type: 'number' },
                data: { type: 'object' },
                result: { type: 'object' },
                failedReason: { type: 'string', nullable: true },
                processedOn: { type: 'number', nullable: true },
                finishedOn: { type: 'number', nullable: true },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Job not found',
    }),
    __param(0, (0, common_1.Param)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getQueueStatus", null);
__decorate([
    (0, common_1.Get)('queue/stats'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Get queue statistics',
        description: 'Retrieves statistics about the transactions queue.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Queue statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                waiting: { type: 'number' },
                active: { type: 'number' },
                completed: { type: 'number' },
                failed: { type: 'number' },
                total: { type: 'number' },
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getQueueStats", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, swagger_1.ApiTags)('transactions'),
    (0, common_1.Controller)('transactions'),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService,
        transactions_queue_1.TransactionsQueue])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map