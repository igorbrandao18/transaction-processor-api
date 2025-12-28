import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '@entities/transaction.entity';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Current page number (1-indexed)',
    example: 1,
    minimum: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items matching the query (across all pages)',
    example: 100,
    minimum: 0,
  })
  total: number;

  @ApiProperty({
    description:
      'Total number of pages available (calculated as Math.ceil(total / limit))',
    example: 5,
    minimum: 0,
  })
  totalPages: number;
}

export class PaginatedTransactionsResponseDto {
  @ApiProperty({
    description: 'Array of transaction objects matching the query criteria',
    type: Transaction,
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
  })
  data: Transaction[];

  @ApiProperty({
    description:
      'Pagination metadata including page, limit, total, and totalPages',
    type: PaginationMetaDto,
    example: {
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
    },
  })
  pagination: PaginationMetaDto;
}
