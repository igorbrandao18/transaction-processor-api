import { ApiProperty } from '@nestjs/swagger';

export class ValidationErrorDto {
  @ApiProperty({
    description: 'Field name',
    example: 'amount',
  })
  property: string;

  @ApiProperty({
    description: 'Validation constraints',
    example: {
      isNumber: 'amount must be a number',
      min: 'amount must not be less than 0',
    },
  })
  constraints: Record<string, string>;
}

export class BadRequestErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Validation failed',
  })
  message: string;

  @ApiProperty({
    description: 'Validation errors',
    type: [ValidationErrorDto],
    example: [
      {
        property: 'amount',
        constraints: {
          isNumber: 'amount must be a number',
        },
      },
    ],
  })
  errors: ValidationErrorDto[];
}

export class ConflictErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 409,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Transaction already exists',
  })
  error: string;

  @ApiProperty({
    description: 'Transaction ID that already exists',
    example: 'unique-transaction-id-123',
  })
  transactionId: string;

  @ApiProperty({
    description: 'Existing transaction data',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      transactionId: 'unique-transaction-id-123',
      amount: 100.5,
      currency: 'BRL',
      type: 'credit',
      status: 'pending',
    },
  })
  existingTransaction: any;
}

export class NotFoundErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Transaction not found',
  })
  message: string;

  @ApiProperty({
    description: 'Request path',
    example: '/transactions/123e4567-e89b-12d3-a456-426614174000',
  })
  path: string;

  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;
}

export class InternalServerErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 500,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Internal server error',
  })
  message: string;

  @ApiProperty({
    description: 'Request path',
    example: '/transactions',
  })
  path: string;

  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;
}
