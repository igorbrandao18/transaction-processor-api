import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TransactionsRepository } from '@repositories/transactions.repository';
import type { Transaction } from '@entities/transaction.entity';
import type { CreateTransactionDto } from '@dto/create-transaction.dto';
import type { QueryTransactionsDto } from '@dto/query-transactions.dto';
import { TransactionStatus } from '@entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(private readonly repository: TransactionsRepository) {}

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    // Check for idempotency - if transaction with same transactionId exists, return it
    const existing = await this.repository.findByTransactionId(
      dto.transactionId,
    );
    if (existing) {
      throw new ConflictException({
        message: 'Transaction with this ID already exists',
        existingTransaction: existing,
      });
    }

    const transaction = await this.repository.create({
      transactionId: dto.transactionId,
      amount: dto.amount,
      currency: dto.currency,
      type: dto.type,
      status: dto.status || TransactionStatus.PENDING,
      metadata: dto.metadata,
    });

    return transaction;
  }

  async findById(id: string): Promise<Transaction> {
    const transaction = await this.repository.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async findAll(query: QueryTransactionsDto): Promise<{
    data: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { transactions, total } = await this.repository.findAll(query);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  getMetadata(): {
    types: string[];
    statuses: string[];
    currencies: string[];
  } {
    return {
      types: ['credit', 'debit'],
      statuses: ['pending', 'completed', 'failed'],
      currencies: ['BRL', 'USD', 'EUR', 'GBP', 'JPY'],
    };
  }
}
