import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsObject,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@entities/transaction.entity';
import { IsCurrencyCode, IsAmountPrecision } from '@utils/validators';

export class CreateTransactionDto {
  @ApiProperty({
    description:
      'Unique transaction identifier (for idempotency). This ID must be unique across all transactions. If a transaction with this ID already exists, the existing transaction will be returned instead of creating a new one.',
    example: 'txn-2024-01-15-abc123def456',
    maxLength: 255,
    pattern: '^[a-zA-Z0-9-_]+$',
    examples: {
      'Payment Gateway': {
        value: 'pg-payment-12345-20240115',
        summary: 'Payment gateway transaction ID',
      },
      'E-commerce Order': {
        value: 'order-789456-2024-01-15',
        summary: 'E-commerce order transaction ID',
      },
      'Bank Transfer': {
        value: 'bank-transfer-987654321',
        summary: 'Bank transfer transaction ID',
      },
    },
  })
  @IsString()
  @MaxLength(255)
  transactionId: string;

  @ApiProperty({
    description:
      'Transaction amount in the specified currency. Must be a positive number with maximum 2 decimal places.',
    example: 100.5,
    minimum: 0,
    maximum: 999999999.99,
    examples: {
      'Small Amount': {
        value: 10.99,
        summary: 'Small transaction amount',
      },
      'Medium Amount': {
        value: 1000.5,
        summary: 'Medium transaction amount',
      },
      'Large Amount': {
        value: 50000.0,
        summary: 'Large transaction amount',
      },
    },
  })
  @IsNumber()
  @Min(0)
  @IsAmountPrecision()
  amount: number;

  @ApiProperty({
    description:
      'Currency code following ISO 4217 standard. Supported currencies include major world currencies.',
    example: 'BRL',
    enum: [
      'USD',
      'EUR',
      'GBP',
      'BRL',
      'JPY',
      'AUD',
      'CAD',
      'CHF',
      'CNY',
      'SEK',
      'NZD',
      'MXN',
      'SGD',
      'HKD',
      'NOK',
      'TRY',
      'RUB',
      'INR',
      'ZAR',
      'DKK',
      'PLN',
      'TWD',
      'THB',
      'MYR',
      'CZK',
      'HUF',
      'ILS',
      'CLP',
      'PHP',
      'AED',
      'COP',
      'SAR',
      'IDR',
      'KRW',
      'EGP',
      'IQD',
      'ARS',
      'VND',
      'PKR',
      'BGN',
    ],
    examples: {
      'Brazilian Real': {
        value: 'BRL',
        summary: 'Brazilian Real',
      },
      'US Dollar': {
        value: 'USD',
        summary: 'US Dollar',
      },
      Euro: {
        value: 'EUR',
        summary: 'Euro',
      },
    },
  })
  @IsString()
  @IsCurrencyCode()
  currency: string;

  @ApiProperty({
    description:
      'Type of transaction. CREDIT represents money coming in, DEBIT represents money going out.',
    enum: TransactionType,
    example: TransactionType.CREDIT,
    examples: {
      'Credit Transaction': {
        value: TransactionType.CREDIT,
        summary: 'Money received (deposit, payment received, etc.)',
      },
      'Debit Transaction': {
        value: TransactionType.DEBIT,
        summary: 'Money sent (withdrawal, payment made, etc.)',
      },
    },
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({
    description:
      'Additional metadata as a JSON object. Can include any custom fields relevant to the transaction (e.g., source, reference, customer info, etc.).',
    example: {
      source: 'payment-gateway',
      reference: 'order-123',
      customerId: 'cust-456',
      paymentMethod: 'credit-card',
      merchantId: 'merchant-789',
    },
    examples: {
      'Payment Gateway': {
        value: {
          source: 'stripe',
          paymentIntentId: 'pi_1234567890',
          customerEmail: 'customer@example.com',
        },
        summary: 'Payment gateway metadata',
      },
      'E-commerce': {
        value: {
          source: 'ecommerce-platform',
          orderId: 'ORD-12345',
          customerId: 'CUST-67890',
          items: ['item1', 'item2'],
        },
        summary: 'E-commerce order metadata',
      },
      'Bank Transfer': {
        value: {
          source: 'bank-api',
          transferId: 'TRF-987654',
          accountFrom: 'ACC-111',
          accountTo: 'ACC-222',
        },
        summary: 'Bank transfer metadata',
      },
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
