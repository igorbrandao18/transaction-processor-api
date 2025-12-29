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
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { QueryTransactionsDto } from '@dto/query-transactions.dto';
import { PaginatedTransactionsResponseDto } from '@dto/pagination-response.dto';
import { Transaction } from '@entities/transaction.entity';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new transaction',
    description:
      'Creates a new financial transaction. If a transaction with the same transactionId already exists, returns the existing transaction (idempotency).',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: Transaction,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Transaction with this ID already exists',
  })
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    return await this.transactionsService.create(createTransactionDto);
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
}
