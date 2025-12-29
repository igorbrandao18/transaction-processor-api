import { dbPool } from '@config/database.config';
import type { TransactionRow } from '@entities/transaction.entity';
import { Transaction } from '@entities/transaction.entity';
import type { QueryTransactionsDto } from '@dto/query-transactions.dto';

export class TransactionsRepository {
  async create(transaction: {
    transactionId: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    metadata?: Record<string, any>;
  }): Promise<Transaction> {
    const client = await dbPool.connect();
    try {
      const result = await client.query<TransactionRow>(
        `INSERT INTO transactions (transaction_id, amount, currency, type, status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          transaction.transactionId,
          transaction.amount,
          transaction.currency,
          transaction.type,
          transaction.status,
          transaction.metadata ? JSON.stringify(transaction.metadata) : null,
        ],
      );

      return this.mapRowToTransaction(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Transaction | undefined> {
    const client = await dbPool.connect();
    try {
      const result = await client.query<TransactionRow>(
        'SELECT * FROM transactions WHERE id = $1',
        [id],
      );

      if (result.rows.length === 0) {
        return undefined;
      }

      return this.mapRowToTransaction(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<Transaction | undefined> {
    const client = await dbPool.connect();
    try {
      const result = await client.query<TransactionRow>(
        'SELECT * FROM transactions WHERE transaction_id = $1',
        [transactionId],
      );

      if (result.rows.length === 0) {
        return undefined;
      }

      return this.mapRowToTransaction(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findAll(query: QueryTransactionsDto): Promise<{
    transactions: Transaction[];
    total: number;
  }> {
    const client = await dbPool.connect();
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;

      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (query.status) {
        conditions.push(`status = $${paramIndex}`);
        params.push(query.status);
        paramIndex++;
      }

      if (query.type) {
        conditions.push(`type = $${paramIndex}`);
        params.push(query.type);
        paramIndex++;
      }

      if (query.startDate) {
        conditions.push(`created_at >= $${paramIndex}`);
        params.push(query.startDate);
        paramIndex++;
      }

      if (query.endDate) {
        conditions.push(`created_at <= $${paramIndex}`);
        params.push(query.endDate);
        paramIndex++;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await client.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM transactions ${whereClause}`,
        params,
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated results
      params.push(limit, offset);
      const result = await client.query<TransactionRow>(
        `SELECT * FROM transactions ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        params,
      );

      return {
        transactions: result.rows.map((row) => this.mapRowToTransaction(row)),
        total,
      };
    } finally {
      client.release();
    }
  }

  private mapRowToTransaction(row: TransactionRow): Transaction {
    return {
      id: row.id,
      transactionId: row.transaction_id,
      amount: parseFloat(row.amount.toString()),
      currency: row.currency,
      type: row.type as any,
      status: row.status as any,
      metadata: row.metadata || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
