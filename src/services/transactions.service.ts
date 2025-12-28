import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TransactionsRepository } from '@repositories/transactions.repository';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { QueryTransactionsDto } from '@dto/query-transactions.dto';
import { Transaction, TransactionStatus } from '@entities/transaction.entity';
import { logger } from '@config/logger.config';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    logger.info('Creating transaction', {
      transactionId: createTransactionDto.transactionId,
    });

    const existingTransaction =
      await this.transactionsRepository.findByTransactionId(
        createTransactionDto.transactionId,
      );

    if (existingTransaction) {
      logger.warn('Transaction already exists', {
        transactionId: createTransactionDto.transactionId,
      });
      throw new ConflictException({
        error: 'Transaction already exists',
        transactionId: createTransactionDto.transactionId,
        existingTransaction,
      });
    }

    const transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
      transactionId: createTransactionDto.transactionId,
      amount: createTransactionDto.amount,
      currency: createTransactionDto.currency,
      type: createTransactionDto.type,
      status: TransactionStatus.PENDING,
      metadata: createTransactionDto.metadata,
    };

    try {
      const createdTransaction =
        await this.transactionsRepository.create(transaction);
      logger.info('Transaction created successfully', {
        id: createdTransaction.id,
        transactionId: createdTransaction.transactionId,
      });
      return createdTransaction;
    } catch (error: any) {
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        const existing = await this.transactionsRepository.findByTransactionId(
          createTransactionDto.transactionId,
        );
        if (existing) {
          logger.warn('Transaction already exists (race condition)', {
            transactionId: createTransactionDto.transactionId,
          });
          return existing;
        }
      }
      logger.error('Error creating transaction', { error: error.message });
      throw error;
    }
  }

  async findOne(id: string): Promise<Transaction> {
    logger.info('Finding transaction', { id });

    const transaction = await this.transactionsRepository.findById(id);

    if (!transaction) {
      logger.warn('Transaction not found', { id });
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async findAll(queryDto: QueryTransactionsDto): Promise<{
    data: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    logger.info('Finding transactions', { query: queryDto });

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;

    const result = await this.transactionsRepository.findAll({
      page,
      limit,
      status: queryDto.status,
      type: queryDto.type,
      startDate: queryDto.startDate,
      endDate: queryDto.endDate,
    });

    const totalPages = Math.ceil(result.total / limit);

    return {
      data: result.transactions,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
  ): Promise<Transaction> {
    logger.info('Updating transaction status', { id, status });
    return this.transactionsRepository.updateStatus(id, status);
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<Transaction | null> {
    return this.transactionsRepository.findByTransactionId(transactionId);
  }
}
