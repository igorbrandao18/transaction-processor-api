import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TransactionsService } from '@services/transactions.service';
import { TransactionsQueue } from '@queues/transactions.queue';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { QueryTransactionsDto } from '@dto/query-transactions.dto';
import { PaginatedTransactionsResponseDto } from '@dto/pagination-response.dto';
import { Transaction } from '@entities/transaction.entity';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly transactionsQueue: TransactionsQueue,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Create a new transaction',
    description:
      'Queues a new financial transaction for processing. Returns immediately with job information. The transaction will be processed asynchronously. If a transaction with the same transactionId already exists, the existing transaction is returned (idempotency).',
  })
  @ApiResponse({
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
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(@Body() createTransactionDto: CreateTransactionDto): Promise<{
    message: string;
    jobId: string;
    transactionId: string;
  }> {
    const { jobId, transactionId } =
      await this.transactionsQueue.addTransactionJob(createTransactionDto);

    return {
      message: 'Transaction queued for processing',
      jobId,
      transactionId,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'List transactions',
    description:
      'Retrieves a paginated list of transactions with optional filtering by status, type, and date range.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of transactions retrieved successfully',
    type: PaginatedTransactionsResponseDto,
  })
  async findAll(
    @Query() query: QueryTransactionsDto,
  ): Promise<PaginatedTransactionsResponseDto> {
    return await this.transactionsService.findAll(query);
  }

  @Get('metadata')
  @ApiOperation({
    summary: 'Get transaction metadata',
    description:
      'Retrieves available transaction types, statuses, and currencies for form dropdowns.',
  })
  @ApiResponse({
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
  })
  async getMetadata(): Promise<{
    types: string[];
    statuses: string[];
    currencies: string[];
  }> {
    return await this.transactionsService.getMetadata();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get transaction by ID',
    description:
      'Retrieves a single transaction by its unique identifier (UUID).',
  })
  @ApiParam({
    name: 'id',
    description: 'Transaction UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
    type: Transaction,
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async findOne(@Param('id') id: string): Promise<Transaction> {
    return await this.transactionsService.findById(id);
  }

  @Get('queue/:transactionId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get transaction queue status',
    description:
      'Retrieves the status of a transaction job in the queue by transactionId.',
  })
  @ApiParam({
    name: 'transactionId',
    description: 'Transaction ID used as job ID',
    example: 'txn-2024-01-15-abc123',
  })
  @ApiResponse({
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
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async getQueueStatus(@Param('transactionId') transactionId: string) {
    const status = await this.transactionsQueue.getJobStatus(transactionId);
    if (!status) {
      throw new Error(`Job with transactionId "${transactionId}" not found`);
    }
    return status;
  }

  @Get('queue/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get queue statistics',
    description: 'Retrieves statistics about the transactions queue.',
  })
  @ApiResponse({
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
  })
  async getQueueStats() {
    return await this.transactionsQueue.getQueueStats();
  }
}
