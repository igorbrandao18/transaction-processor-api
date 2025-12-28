import { dbPool } from '@config/database.config';
import {
  Transaction,
  TransactionRow,
  TransactionStatus,
} from '@entities/transaction.entity';
import { logger } from '@config/logger.config';

export class TransactionsRepository {
  private mapRowToEntity(row: TransactionRow): Transaction {
    return {
      id: row.id,
      transactionId: row.transaction_id,
      amount: parseFloat(row.amount.toString()),
      currency: row.currency,
      type: row.type as any,
      status: row.status as TransactionStatus,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Transaction> {
    const client = await dbPool.connect();

    try {
      await client.query('BEGIN');

      const checkResult = await client.query<TransactionRow>(
        'SELECT * FROM transactions WHERE transaction_id = $1 FOR UPDATE',
        [transaction.transactionId],
      );

      if (checkResult.rows.length > 0) {
        await client.query('COMMIT');
        logger.info('Transaction already exists', {
          transactionId: transaction.transactionId,
        });
        return this.mapRowToEntity(checkResult.rows[0]);
      }

      const result = await client.query<TransactionRow>(
        `INSERT INTO transactions (transaction_id, amount, currency, type, status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          transaction.transactionId,
          transaction.amount,
          transaction.currency,
          transaction.type,
          transaction.status || TransactionStatus.PENDING,
          transaction.metadata ? JSON.stringify(transaction.metadata) : null,
        ],
      );

      await client.query('COMMIT');
      logger.info('Transaction created', {
        transactionId: transaction.transactionId,
      });

      return this.mapRowToEntity(result.rows[0]);
    } catch (error: any) {
      await client.query('ROLLBACK');

      if (error.code === '23505') {
        const existingResult = await client.query<TransactionRow>(
          'SELECT * FROM transactions WHERE transaction_id = $1',
          [transaction.transactionId],
        );
        if (existingResult.rows.length > 0) {
          logger.info('Transaction already exists (unique constraint)', {
            transactionId: transaction.transactionId,
          });
          return this.mapRowToEntity(existingResult.rows[0]);
        }
      }

      logger.error('Error creating transaction', {
        error: error.message,
        transactionId: transaction.transactionId,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Transaction | null> {
    try {
      const result = await dbPool.query<TransactionRow>(
        'SELECT * FROM transactions WHERE id = $1',
        [id],
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToEntity(result.rows[0]);
    } catch (error: any) {
      logger.error('Error finding transaction by id', {
        error: error.message,
        id,
      });
      throw error;
    }
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<Transaction | null> {
    try {
      const result = await dbPool.query<TransactionRow>(
        'SELECT * FROM transactions WHERE transaction_id = $1',
        [transactionId],
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToEntity(result.rows[0]);
    } catch (error: any) {
      logger.error('Error finding transaction by transactionId', {
        error: error.message,
        transactionId,
      });
      throw error;
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: TransactionStatus;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ transactions: Transaction[]; total: number }> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;

      const whereConditions: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (query.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(query.status);
        paramIndex++;
      }

      if (query.type) {
        whereConditions.push(`type = $${paramIndex}`);
        queryParams.push(query.type);
        paramIndex++;
      }

      if (query.startDate) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        queryParams.push(query.startDate);
        paramIndex++;
      }

      if (query.endDate) {
        whereConditions.push(`created_at <= $${paramIndex}`);
        queryParams.push(query.endDate);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(' AND ')}`
          : '';

      const countResult = await dbPool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM transactions ${whereClause}`,
        queryParams,
      );
      const total = parseInt(countResult.rows[0].count);

      queryParams.push(limit, offset);
      const result = await dbPool.query<TransactionRow>(
        `SELECT * FROM transactions ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        queryParams,
      );

      return {
        transactions: result.rows.map((row) => this.mapRowToEntity(row)),
        total,
      };
    } catch (error: any) {
      logger.error('Error finding transactions', { error: error.message });
      throw error;
    }
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
  ): Promise<Transaction> {
    try {
      const result = await dbPool.query<TransactionRow>(
        'UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *',
        [status, id],
      );

      if (result.rows.length === 0) {
        throw new Error(`Transaction with id ${id} not found`);
      }

      logger.info('Transaction status updated', { id, status });
      return this.mapRowToEntity(result.rows[0]);
    } catch (error: any) {
      logger.error('Error updating transaction status', {
        error: error.message,
        id,
        status,
      });
      throw error;
    }
  }
}
