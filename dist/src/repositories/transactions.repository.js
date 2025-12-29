"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsRepository = void 0;
const database_config_1 = require("@config/database.config");
class TransactionsRepository {
    async create(transaction) {
        const client = await database_config_1.dbPool.connect();
        try {
            const result = await client.query(`INSERT INTO transactions (transaction_id, amount, currency, type, status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`, [
                transaction.transactionId,
                transaction.amount,
                transaction.currency,
                transaction.type,
                transaction.status,
                transaction.metadata ? JSON.stringify(transaction.metadata) : null,
            ]);
            return this.mapRowToTransaction(result.rows[0]);
        }
        finally {
            client.release();
        }
    }
    async findById(id) {
        const client = await database_config_1.dbPool.connect();
        try {
            const result = await client.query('SELECT * FROM transactions WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToTransaction(result.rows[0]);
        }
        finally {
            client.release();
        }
    }
    async findByTransactionId(transactionId) {
        const client = await database_config_1.dbPool.connect();
        try {
            const result = await client.query('SELECT * FROM transactions WHERE transaction_id = $1', [transactionId]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToTransaction(result.rows[0]);
        }
        finally {
            client.release();
        }
    }
    async findAll(query) {
        const client = await database_config_1.dbPool.connect();
        try {
            const page = query.page || 1;
            const limit = query.limit || 20;
            const offset = (page - 1) * limit;
            const conditions = [];
            const params = [];
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
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const countResult = await client.query(`SELECT COUNT(*) as count FROM transactions ${whereClause}`, params);
            const total = parseInt(countResult.rows[0].count, 10);
            params.push(limit, offset);
            const result = await client.query(`SELECT * FROM transactions ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, params);
            return {
                transactions: result.rows.map((row) => this.mapRowToTransaction(row)),
                total,
            };
        }
        finally {
            client.release();
        }
    }
    mapRowToTransaction(row) {
        return {
            id: row.id,
            transactionId: row.transaction_id,
            amount: parseFloat(row.amount.toString()),
            currency: row.currency,
            type: row.type,
            status: row.status,
            metadata: row.metadata || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.TransactionsRepository = TransactionsRepository;
//# sourceMappingURL=transactions.repository.js.map