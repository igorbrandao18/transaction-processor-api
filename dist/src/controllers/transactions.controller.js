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
const transaction_entity_1 = require("../entities/transaction.entity");
const pagination_response_dto_1 = require("../dto/pagination-response.dto");
const error_response_dto_1 = require("../dto/error-response.dto");
const validators_1 = require("../utils/validators");
const logger_config_1 = require("../config/logger.config");
let TransactionsController = class TransactionsController {
    transactionsService;
    transactionsQueue;
    constructor(transactionsService, transactionsQueue) {
        this.transactionsService = transactionsService;
        this.transactionsQueue = transactionsQueue;
    }
    async create(createTransactionDto) {
        logger_config_1.logger.info('POST /transactions - Adding transaction to queue', {
            transactionId: createTransactionDto.transactionId,
        });
        await this.transactionsQueue.addTransaction(createTransactionDto);
        return {
            message: 'Transaction queued for processing',
            transactionId: createTransactionDto.transactionId,
            status: 'queued',
        };
    }
    async findAll(queryDto) {
        logger_config_1.logger.info('GET /transactions - Listing transactions', {
            query: queryDto,
        });
        return this.transactionsService.findAll(queryDto);
    }
    async getMetadata() {
        logger_config_1.logger.info('GET /transactions/metadata - Getting transaction metadata');
        return {
            types: Object.values(transaction_entity_1.TransactionType),
            statuses: Object.values(transaction_entity_1.TransactionStatus),
            currencies: validators_1.VALID_CURRENCIES,
        };
    }
    async findOne(id) {
        logger_config_1.logger.info('GET /transactions/:id - Finding transaction', { id });
        return this.transactionsService.findOne(id);
    }
    async getQueueStatus(transactionId) {
        logger_config_1.logger.info('GET /transactions/queue/:transactionId/status - Checking queue status', {
            transactionId,
        });
        const status = await this.transactionsQueue.getJobStatus(transactionId);
        if (!status) {
            throw new common_1.NotFoundException(`Transaction job with ID "${transactionId}" not found in queue`);
        }
        return status;
    }
    async getQueueStats() {
        logger_config_1.logger.info('GET /transactions/queue/stats - Getting queue statistics');
        return this.transactionsQueue.getQueueStats();
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new transaction',
        description: `
      Creates a new financial transaction. The transaction is idempotent - if a transaction with the same transactionId already exists, 
      the existing transaction will be returned instead of creating a duplicate.
      
      Idempotency: This endpoint ensures that sending the same request multiple times will not create duplicate transactions. 
      The transactionId field is used as the unique identifier for idempotency checks.
      
      Validation: All fields are validated according to business rules:
      - transactionId: Required, max 255 characters, must be unique
      - amount: Required, must be >= 0, max 2 decimal places
      - currency: Required, must be a valid ISO 4217 currency code
      - type: Required, must be either 'credit' or 'debit'
      - metadata: Optional, must be a valid JSON object
    `,
    }),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'Transaction created successfully',
        type: transaction_entity_1.Transaction,
        examples: {
            'Credit Transaction': {
                value: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    transactionId: 'txn-2024-01-15-abc123def456',
                    amount: 100.5,
                    currency: 'BRL',
                    type: 'credit',
                    status: 'pending',
                    metadata: {
                        source: 'payment-gateway',
                        reference: 'order-123',
                    },
                    createdAt: '2024-01-15T10:30:00.000Z',
                    updatedAt: '2024-01-15T10:30:00.000Z',
                },
                summary: 'Successfully created a credit transaction',
            },
            'Debit Transaction': {
                value: {
                    id: '987fcdeb-51a2-43f7-8b9c-123456789abc',
                    transactionId: 'txn-2024-01-15-xyz789ghi012',
                    amount: 250.75,
                    currency: 'USD',
                    type: 'debit',
                    status: 'pending',
                    metadata: {
                        source: 'bank-transfer',
                        accountTo: 'ACC-456',
                    },
                    createdAt: '2024-01-15T10:35:00.000Z',
                    updatedAt: '2024-01-15T10:35:00.000Z',
                },
                summary: 'Successfully created a debit transaction',
            },
        },
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Validation failed. The request body contains invalid data.',
        type: error_response_dto_1.BadRequestErrorDto,
        examples: {
            'Invalid Amount': {
                value: {
                    statusCode: 400,
                    message: 'Validation failed',
                    errors: [
                        {
                            property: 'amount',
                            constraints: {
                                isNumber: 'amount must be a number',
                                min: 'amount must not be less than 0',
                            },
                        },
                    ],
                },
                summary: 'Amount validation failed',
            },
            'Invalid Currency': {
                value: {
                    statusCode: 400,
                    message: 'Validation failed',
                    errors: [
                        {
                            property: 'currency',
                            constraints: {
                                isCurrencyCode: 'currency must be a valid ISO 4217 currency code (e.g., USD, EUR, BRL)',
                            },
                        },
                    ],
                },
                summary: 'Currency validation failed',
            },
            'Missing Required Fields': {
                value: {
                    statusCode: 400,
                    message: 'Validation failed',
                    errors: [
                        {
                            property: 'transactionId',
                            constraints: {
                                isString: 'transactionId must be a string',
                            },
                        },
                        {
                            property: 'amount',
                            constraints: {
                                isNumber: 'amount must be a number',
                            },
                        },
                    ],
                },
                summary: 'Required fields are missing',
            },
        },
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'Transaction already exists. The transactionId provided already exists in the system. The existing transaction is returned.',
        type: error_response_dto_1.ConflictErrorDto,
        examples: {
            'Duplicate Transaction': {
                value: {
                    statusCode: 409,
                    error: 'Transaction already exists',
                    transactionId: 'txn-2024-01-15-abc123def456',
                    existingTransaction: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        transactionId: 'txn-2024-01-15-abc123def456',
                        amount: 100.5,
                        currency: 'BRL',
                        type: 'credit',
                        status: 'pending',
                        createdAt: '2024-01-15T10:30:00.000Z',
                        updatedAt: '2024-01-15T10:30:00.000Z',
                    },
                },
                summary: 'Transaction with this ID already exists',
            },
        },
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Internal server error occurred while processing the request',
        type: error_response_dto_1.InternalServerErrorDto,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_transaction_dto_1.CreateTransactionDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true })),
    (0, swagger_1.ApiOperation)({
        summary: 'List transactions with pagination and filters',
        description: `
      Retrieves a paginated list of transactions with optional filtering capabilities.
      
      Pagination: Use page and limit parameters to control pagination. Default is page 1 with 20 items per page.
      
      Filtering: You can filter transactions by:
      - status: Filter by transaction status (pending, completed, failed)
      - type: Filter by transaction type (credit, debit)
      - startDate: Filter transactions created on or after this date (ISO 8601 format)
      - endDate: Filter transactions created on or before this date (ISO 8601 format)
      
      Combining Filters: You can combine multiple filters. For example, get all completed credit transactions in January 2024.
      
      Response: Returns a paginated response with transaction data and pagination metadata.
    `,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of transactions retrieved successfully',
        type: pagination_response_dto_1.PaginatedTransactionsResponseDto,
        examples: {
            'Empty List': {
                value: {
                    data: [],
                    pagination: {
                        page: 1,
                        limit: 20,
                        total: 0,
                        totalPages: 0,
                    },
                },
                summary: 'No transactions found',
            },
            'With Transactions': {
                value: {
                    data: [
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
                        {
                            id: '987fcdeb-51a2-43f7-8b9c-123456789abc',
                            transactionId: 'txn-2024-01-15-xyz789',
                            amount: 250.75,
                            currency: 'USD',
                            type: 'debit',
                            status: 'pending',
                            metadata: { source: 'bank-transfer' },
                            createdAt: '2024-01-15T11:00:00.000Z',
                            updatedAt: '2024-01-15T11:00:00.000Z',
                        },
                    ],
                    pagination: {
                        page: 1,
                        limit: 20,
                        total: 2,
                        totalPages: 1,
                    },
                },
                summary: 'List of transactions with pagination',
            },
            'Filtered Results': {
                value: {
                    data: [
                        {
                            id: '123e4567-e89b-12d3-a456-426614174000',
                            transactionId: 'txn-2024-01-15-abc123',
                            amount: 100.5,
                            currency: 'BRL',
                            type: 'credit',
                            status: 'pending',
                            createdAt: '2024-01-15T10:30:00.000Z',
                            updatedAt: '2024-01-15T10:30:00.000Z',
                        },
                    ],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 1,
                        totalPages: 1,
                    },
                },
                summary: 'Filtered transactions (pending credit transactions)',
            },
            'Last Page': {
                value: {
                    data: [
                        {
                            id: '999e4567-e89b-12d3-a456-426614174999',
                            transactionId: 'txn-2024-01-15-last',
                            amount: 50.0,
                            currency: 'EUR',
                            type: 'credit',
                            status: 'completed',
                            createdAt: '2024-01-15T23:59:00.000Z',
                            updatedAt: '2024-01-15T23:59:00.000Z',
                        },
                    ],
                    pagination: {
                        page: 5,
                        limit: 20,
                        total: 100,
                        totalPages: 5,
                    },
                },
                summary: 'Last page of results',
            },
        },
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid query parameters provided',
        type: error_response_dto_1.BadRequestErrorDto,
        examples: {
            'Invalid Page': {
                value: {
                    statusCode: 400,
                    message: 'Validation failed',
                    errors: [
                        {
                            property: 'page',
                            constraints: {
                                isInt: 'page must be an integer number',
                                min: 'page must not be less than 1',
                            },
                        },
                    ],
                },
                summary: 'Page number validation failed',
            },
            'Invalid Limit': {
                value: {
                    statusCode: 400,
                    message: 'Validation failed',
                    errors: [
                        {
                            property: 'limit',
                            constraints: {
                                max: 'limit must not be greater than 100',
                            },
                        },
                    ],
                },
                summary: 'Limit exceeds maximum value',
            },
            'Invalid Date Format': {
                value: {
                    statusCode: 400,
                    message: 'Validation failed',
                    errors: [
                        {
                            property: 'startDate',
                            constraints: {
                                isDateString: 'startDate must be a valid ISO 8601 date string',
                            },
                        },
                    ],
                },
                summary: 'Date format validation failed',
            },
        },
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Internal server error occurred while retrieving transactions',
        type: error_response_dto_1.InternalServerErrorDto,
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_transactions_dto_1.QueryTransactionsDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('metadata'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Get transaction metadata',
        description: `
      Returns metadata about transaction types, statuses, and supported currencies.
      This endpoint provides the frontend with the valid enum values and currency codes
      that can be used when creating or filtering transactions.
    `,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transaction metadata retrieved successfully',
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
                    example: ['USD', 'EUR', 'BRL'],
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
        description: `
      Retrieves a single transaction by its unique identifier (UUID).
      
      Parameters:
      - id: The UUID of the transaction to retrieve
      
      Response:
      Returns the complete transaction object if found, or a 404 error if the transaction does not exist.
    `,
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Transaction UUID (unique identifier)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
        format: 'uuid',
        examples: {
            'Valid UUID': {
                value: '123e4567-e89b-12d3-a456-426614174000',
                summary: 'A valid transaction UUID',
            },
            'Another UUID': {
                value: '987fcdeb-51a2-43f7-8b9c-123456789abc',
                summary: 'Another valid transaction UUID',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transaction found successfully',
        type: transaction_entity_1.Transaction,
        examples: {
            'Credit Transaction': {
                value: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    transactionId: 'txn-2024-01-15-abc123def456',
                    amount: 100.5,
                    currency: 'BRL',
                    type: 'credit',
                    status: 'completed',
                    metadata: {
                        source: 'payment-gateway',
                        reference: 'order-123',
                        customerId: 'cust-456',
                    },
                    createdAt: '2024-01-15T10:30:00.000Z',
                    updatedAt: '2024-01-15T10:35:00.000Z',
                },
                summary: 'Successfully retrieved a credit transaction',
            },
            'Debit Transaction': {
                value: {
                    id: '987fcdeb-51a2-43f7-8b9c-123456789abc',
                    transactionId: 'txn-2024-01-15-xyz789ghi012',
                    amount: 250.75,
                    currency: 'USD',
                    type: 'debit',
                    status: 'pending',
                    metadata: {
                        source: 'bank-transfer',
                        accountTo: 'ACC-456',
                    },
                    createdAt: '2024-01-15T11:00:00.000Z',
                    updatedAt: '2024-01-15T11:00:00.000Z',
                },
                summary: 'Successfully retrieved a debit transaction',
            },
            'Transaction Without Metadata': {
                value: {
                    id: '555e4567-e89b-12d3-a456-426614174555',
                    transactionId: 'txn-2024-01-15-no-meta',
                    amount: 50.0,
                    currency: 'EUR',
                    type: 'credit',
                    status: 'completed',
                    metadata: null,
                    createdAt: '2024-01-15T12:00:00.000Z',
                    updatedAt: '2024-01-15T12:00:00.000Z',
                },
                summary: 'Transaction without metadata',
            },
        },
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Transaction not found. The provided UUID does not exist in the system.',
        type: error_response_dto_1.NotFoundErrorDto,
        examples: {
            'Not Found': {
                value: {
                    statusCode: 404,
                    message: 'Transaction not found',
                    path: '/transactions/123e4567-e89b-12d3-a456-426614174000',
                    timestamp: '2024-01-15T10:30:00.000Z',
                },
                summary: 'Transaction with the provided ID does not exist',
            },
        },
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid UUID format provided',
        type: error_response_dto_1.BadRequestErrorDto,
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Internal server error occurred while retrieving the transaction',
        type: error_response_dto_1.InternalServerErrorDto,
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
        summary: 'Get transaction queue job status',
        description: `
      Returns the current status of a transaction job in the BullMQ queue.
      This endpoint allows you to check if a transaction is still being processed,
      completed, or failed.
      
      Possible states:
      - waiting: Job is waiting to be processed
      - active: Job is currently being processed
      - completed: Job completed successfully
      - failed: Job failed (will retry based on configuration)
      - delayed: Job is delayed
      - paused: Queue is paused
    `,
    }),
    (0, swagger_1.ApiParam)({
        name: 'transactionId',
        description: 'The transaction ID to check queue status',
        example: 'txn-2024-01-15-abc123def456',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Queue job status retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: '1' },
                transactionId: {
                    type: 'string',
                    example: 'txn-2024-01-15-abc123def456',
                },
                state: {
                    type: 'string',
                    example: 'completed',
                    enum: [
                        'waiting',
                        'active',
                        'completed',
                        'failed',
                        'delayed',
                        'paused',
                    ],
                },
                progress: { type: 'number', example: 100 },
                result: {
                    type: 'object',
                    description: 'Transaction object if completed',
                },
                failedReason: { type: 'string', nullable: true },
                processedOn: { type: 'number', nullable: true, example: 1705315800000 },
                finishedOn: { type: 'number', nullable: true, example: 1705315801000 },
            },
        },
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Transaction job not found in queue',
        type: error_response_dto_1.NotFoundErrorDto,
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
        summary: 'Get BullMQ queue statistics',
        description: `
      Returns statistics about the transaction queue including counts of jobs in different states
      and details about waiting, active, and delayed jobs.
    `,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Queue statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                waiting: { type: 'number', example: 0 },
                active: { type: 'number', example: 0 },
                completed: { type: 'number', example: 5 },
                failed: { type: 'number', example: 0 },
                delayed: { type: 'number', example: 0 },
                jobs: {
                    type: 'object',
                    properties: {
                        waiting: { type: 'array' },
                        active: { type: 'array' },
                        delayed: { type: 'array' },
                    },
                },
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