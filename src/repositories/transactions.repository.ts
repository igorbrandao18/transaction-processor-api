import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import type { QueryTransactionsDto } from '@dto/query-transactions.dto';
import { Prisma, TransactionType, TransactionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

type TransactionEntity = {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(transaction: {
    transactionId: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    metadata?: Record<string, any>;
  }): Promise<TransactionEntity> {
    const created = await this.prisma.transaction.create({
      data: {
        id: randomUUID(),
        transactionId: transaction.transactionId,
        amount: new Prisma.Decimal(transaction.amount),
        currency: transaction.currency,
        type: transaction.type as TransactionType,
        status: (transaction.status || 'pending') as TransactionStatus,
        metadata: transaction.metadata || undefined,
      },
    });

    return this.mapPrismaToEntity(created);
  }

  async findById(id: string): Promise<TransactionEntity | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return null;
    }

    return this.mapPrismaToEntity(transaction);
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<TransactionEntity | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { transactionId },
    });

    if (!transaction) {
      return null;
    }

    return this.mapPrismaToEntity(transaction);
  }

  async findAll(query: QueryTransactionsDto): Promise<{
    transactions: TransactionEntity[];
    total: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {};

    if (query.status) {
      where.status = query.status as TransactionStatus;
    }

    if (query.type) {
      where.type = query.type as TransactionType;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions: transactions.map((t) => this.mapPrismaToEntity(t)),
      total,
    };
  }

  private mapPrismaToEntity(transaction: {
    id: string;
    transactionId: string;
    amount: Prisma.Decimal;
    currency: string;
    type: TransactionType;
    status: TransactionStatus;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): TransactionEntity {
    return {
      id: transaction.id,
      transactionId: transaction.transactionId,
      amount: transaction.amount.toNumber(),
      currency: transaction.currency,
      type: transaction.type,
      status: transaction.status,
      metadata: transaction.metadata as Record<string, any> | undefined,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
