import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TransactionType,
  TransactionStatus,
} from '@entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({
    description:
      'Unique transaction identifier (must be unique across the system)',
    example: 'txn-2024-01-15-abc123',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  transactionId: string;

  @ApiProperty({
    description: 'Transaction amount (must be positive)',
    example: 100.5,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217 format, e.g., BRL, USD, EUR)',
    example: 'BRL',
    minLength: 3,
    maxLength: 3,
  })
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.CREDIT,
  })
  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({
    description: 'Transaction status (defaults to "pending" if not provided)',
    enum: TransactionStatus,
    example: TransactionStatus.PENDING,
    default: TransactionStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Additional metadata associated with the transaction',
    example: {
      source: 'payment-gateway',
      reference: 'order-123',
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
