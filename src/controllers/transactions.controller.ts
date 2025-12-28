import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { TransactionsService } from '@services/transactions.service';
import { TransactionsQueue } from '@queues/transactions.queue';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { QueryTransactionsDto } from '@dto/query-transactions.dto';
import { Transaction } from '@entities/transaction.entity';
import { PaginatedTransactionsResponseDto } from '@dto/pagination-response.dto';
import {
  BadRequestErrorDto,
  ConflictErrorDto,
  NotFoundErrorDto,
  InternalServerErrorDto,
} from '@dto/error-response.dto';
import { logger } from '@config/logger.config';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly transactionsQueue: TransactionsQueue,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
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
  })
  @ApiCreatedResponse({
    description: 'Transaction created successfully',
    type: Transaction,
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
  })
  @ApiBadRequestResponse({
    description: 'Validation failed. The request body contains invalid data.',
    type: BadRequestErrorDto,
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
                isCurrencyCode:
                  'currency must be a valid ISO 4217 currency code (e.g., USD, EUR, BRL)',
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
  })
  @ApiConflictResponse({
    description:
      'Transaction already exists. The transactionId provided already exists in the system. The existing transaction is returned.',
    type: ConflictErrorDto,
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
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error occurred while processing the request',
    type: InternalServerErrorDto,
  })
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    logger.info('POST /transactions - Adding transaction to queue', {
      transactionId: createTransactionDto.transactionId,
    });

    await this.transactionsQueue.addTransaction(createTransactionDto);

    return {
      message: 'Transaction queued for processing',
      transactionId: createTransactionDto.transactionId,
      status: 'queued',
    };
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
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
  })
  @ApiResponse({
    status: 200,
    description: 'List of transactions retrieved successfully',
    type: PaginatedTransactionsResponseDto,
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
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters provided',
    type: BadRequestErrorDto,
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
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error occurred while retrieving transactions',
    type: InternalServerErrorDto,
  })
  async findAll(@Query() queryDto: QueryTransactionsDto) {
    logger.info('GET /transactions - Listing transactions', {
      query: queryDto,
    });

    return this.transactionsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get transaction by ID',
    description: `
      Retrieves a single transaction by its unique identifier (UUID).
      
      Parameters:
      - id: The UUID of the transaction to retrieve
      
      Response:
      Returns the complete transaction object if found, or a 404 error if the transaction does not exist.
    `,
  })
  @ApiParam({
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
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction found successfully',
    type: Transaction,
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
  })
  @ApiNotFoundResponse({
    description:
      'Transaction not found. The provided UUID does not exist in the system.',
    type: NotFoundErrorDto,
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
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format provided',
    type: BadRequestErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description:
      'Internal server error occurred while retrieving the transaction',
    type: InternalServerErrorDto,
  })
  async findOne(@Param('id') id: string): Promise<Transaction> {
    logger.info('GET /transactions/:id - Finding transaction', { id });

    return this.transactionsService.findOne(id);
  }

  @Get('queue/:transactionId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
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
  })
  @ApiParam({
    name: 'transactionId',
    description: 'The transaction ID to check queue status',
    example: 'txn-2024-01-15-abc123def456',
  })
  @ApiResponse({
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
  })
  @ApiNotFoundResponse({
    description: 'Transaction job not found in queue',
    type: NotFoundErrorDto,
  })
  async getQueueStatus(@Param('transactionId') transactionId: string) {
    logger.info(
      'GET /transactions/queue/:transactionId/status - Checking queue status',
      {
        transactionId,
      },
    );

    const status = await this.transactionsQueue.getJobStatus(transactionId);

    if (!status) {
      throw new NotFoundException(
        `Transaction job with ID "${transactionId}" not found in queue`,
      );
    }

    return status;
  }

  @Get('queue/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get BullMQ queue statistics',
    description: `
      Returns statistics about the transaction queue including counts of jobs in different states
      and details about waiting, active, and delayed jobs.
    `,
  })
  @ApiResponse({
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
  })
  async getQueueStats() {
    logger.info('GET /transactions/queue/stats - Getting queue statistics');

    return this.transactionsQueue.getQueueStats();
  }
}
