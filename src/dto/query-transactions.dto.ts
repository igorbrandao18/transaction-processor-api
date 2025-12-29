import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  TransactionStatus,
  TransactionType,
} from '@entities/transaction.entity';

export class QueryTransactionsDto {
  @ApiPropertyOptional({
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
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
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
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description:
      'Filter transactions by status. Returns only transactions with the specified status.',
    enum: TransactionStatus,
    example: 'pending',
    examples: {
      Pending: {
        value: 'pending',
        summary: 'Transactions that are pending processing',
      },
      Completed: {
        value: 'completed',
        summary: 'Transactions that have been completed successfully',
      },
      Failed: {
        value: 'failed',
        summary: 'Transactions that have failed',
      },
    },
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description:
      'Filter transactions by type. Returns only transactions of the specified type.',
    enum: TransactionType,
    example: 'credit',
    examples: {
      Credit: {
        value: 'credit',
        summary: 'Credit transactions (money received)',
      },
      Debit: {
        value: 'debit',
        summary: 'Debit transactions (money sent)',
      },
    },
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({
    description:
      'Start date for filtering transactions. Returns transactions created on or after this date. Must be in ISO 8601 format.',
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
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description:
      'End date for filtering transactions. Returns transactions created on or before this date. Must be in ISO 8601 format.',
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
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
