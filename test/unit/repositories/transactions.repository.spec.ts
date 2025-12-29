import { TransactionsRepository } from '@repositories/transactions.repository';
import { dbPool } from '@config/database.config';
import {
  TransactionType,
  TransactionStatus,
} from '@entities/transaction.entity';

jest.mock('@config/database.config');
jest.mock('@config/logger.config');

describe('TransactionsRepository', () => {
  let repository: TransactionsRepository;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    (dbPool.connect as jest.Mock) = jest.fn().mockResolvedValue(mockClient);
    (dbPool.query as jest.Mock) = jest.fn();
    repository = new TransactionsRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const transaction = {
        transactionId: 'test-123',
        amount: 100.5,
        currency: 'USD',
        type: TransactionType.CREDIT,
        status: TransactionStatus.PENDING,
        metadata: {},
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Check for existing
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'uuid-123',
              transaction_id: 'test-123',
              amount: '100.50',
              currency: 'USD',
              type: 'credit',
              status: 'pending',
              metadata: null,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await repository.create(transaction);

      expect(mockClient.query).toHaveBeenCalledTimes(4); // BEGIN, SELECT, INSERT, COMMIT
      expect(result.transactionId).toBe('test-123');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return existing transaction if already exists', async () => {
      const transaction = {
        transactionId: 'test-123',
        amount: 100.5,
        currency: 'USD',
        type: TransactionType.CREDIT,
        status: TransactionStatus.PENDING,
        metadata: {},
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'uuid-123',
              transaction_id: 'test-123',
              amount: '100.50',
              currency: 'USD',
              type: 'credit',
              status: 'pending',
              metadata: null,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await repository.create(transaction);

      expect(mockClient.query).toHaveBeenCalledTimes(3); // BEGIN, SELECT, COMMIT
      expect(result.transactionId).toBe('test-123');
    });
  });

  describe('create', () => {
    it('should handle unique constraint error and return existing transaction', async () => {
      const transaction = {
        transactionId: 'test-123',
        amount: 100.5,
        currency: 'USD',
        type: TransactionType.CREDIT,
        status: TransactionStatus.PENDING,
        metadata: {},
      };

      const error: any = new Error('Duplicate key');
      error.code = '23505';

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Check for existing
        .mockRejectedValueOnce(error) // INSERT fails
        .mockResolvedValueOnce(undefined) // ROLLBACK
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'uuid-123',
              transaction_id: 'test-123',
              amount: '100.50',
              currency: 'USD',
              type: 'credit',
              status: 'pending',
              metadata: null,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        }); // SELECT existing

      const result = await repository.create(transaction);

      expect(result.transactionId).toBe('test-123');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle unique constraint error but not find existing transaction', async () => {
      const transaction = {
        transactionId: 'test-123',
        amount: 100.5,
        currency: 'USD',
        type: TransactionType.CREDIT,
        status: TransactionStatus.PENDING,
        metadata: {},
      };

      const error: any = new Error('Duplicate key');
      error.code = '23505';

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Check for existing
        .mockRejectedValueOnce(error) // INSERT fails
        .mockResolvedValueOnce(undefined) // ROLLBACK
        .mockResolvedValueOnce({ rows: [] }); // SELECT existing returns empty

      await expect(repository.create(transaction)).rejects.toThrow(
        'Duplicate key',
      );
    });

    it('should handle generic error during creation', async () => {
      const transaction = {
        transactionId: 'test-123',
        amount: 100.5,
        currency: 'USD',
        type: TransactionType.CREDIT,
        status: TransactionStatus.PENDING,
        metadata: {},
      };

      const error = new Error('Database error');

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Check for existing
        .mockRejectedValueOnce(error) // INSERT fails
        .mockResolvedValueOnce(undefined); // ROLLBACK

      await expect(repository.create(transaction)).rejects.toThrow(
        'Database error',
      );
    });

    it('should create transaction with null metadata', async () => {
      const transaction = {
        transactionId: 'test-123',
        amount: 100.5,
        currency: 'USD',
        type: TransactionType.CREDIT,
        metadata: null,
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Check for existing
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'uuid-123',
              transaction_id: 'test-123',
              amount: '100.50',
              currency: 'USD',
              type: 'credit',
              status: 'pending',
              metadata: null,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await repository.create(transaction);

      expect(result.transactionId).toBe('test-123');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transactions'),
        expect.arrayContaining([null]),
      );
    });

    it('should use PENDING status when status is undefined', async () => {
      const transaction = {
        transactionId: 'test-123',
        amount: 100.5,
        currency: 'USD',
        type: TransactionType.CREDIT,
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Check for existing
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'uuid-123',
              transaction_id: 'test-123',
              amount: '100.50',
              currency: 'USD',
              type: 'credit',
              status: 'pending',
              metadata: null,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await repository.create(transaction);

      expect(result.status).toBe(TransactionStatus.PENDING);
    });
  });

  describe('findById', () => {
    it('should find transaction by id', async () => {
      (dbPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: 'uuid-123',
            transaction_id: 'test-123',
            amount: '100.50',
            currency: 'USD',
            type: 'credit',
            status: 'pending',
            metadata: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      const result = await repository.findById('uuid-123');

      expect(dbPool.query).toHaveBeenCalled();
      expect(result?.id).toBe('uuid-123');
    });

    it('should return null when transaction not found', async () => {
      (dbPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle error when finding by id', async () => {
      const error = new Error('Database error');
      (dbPool.query as jest.Mock).mockRejectedValueOnce(error);

      await expect(repository.findById('uuid-123')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findByTransactionId', () => {
    it('should find transaction by transactionId', async () => {
      (dbPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: 'uuid-123',
            transaction_id: 'test-123',
            amount: '100.50',
            currency: 'USD',
            type: 'credit',
            status: 'pending',
            metadata: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      const result = await repository.findByTransactionId('test-123');

      expect(dbPool.query).toHaveBeenCalledWith(
        'SELECT * FROM transactions WHERE transaction_id = $1',
        ['test-123'],
      );
      expect(result?.transactionId).toBe('test-123');
    });

    it('should return null when transaction not found', async () => {
      (dbPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await repository.findByTransactionId('non-existent');

      expect(result).toBeNull();
    });

    it('should handle error when finding by transactionId', async () => {
      const error = new Error('Database error');
      (dbPool.query as jest.Mock).mockRejectedValueOnce(error);

      await expect(repository.findByTransactionId('test-123')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findAll', () => {
    it('should find all transactions without filters', async () => {
      (dbPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'uuid-123',
              transaction_id: 'test-123',
              amount: '100.50',
              currency: 'USD',
              type: 'credit',
              status: 'pending',
              metadata: null,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        });

      const result = await repository.findAll({});

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(2);
    });

    it('should find transactions with status filter', async () => {
      (dbPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'uuid-123',
              transaction_id: 'test-123',
              amount: '100.50',
              currency: 'USD',
              type: 'credit',
              status: 'completed',
              metadata: null,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        });

      const result = await repository.findAll({
        status: TransactionStatus.COMPLETED,
      });

      expect(result.transactions[0].status).toBe(TransactionStatus.COMPLETED);
    });

    it('should find transactions with type filter', async () => {
      (dbPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'uuid-123',
              transaction_id: 'test-123',
              amount: '100.50',
              currency: 'USD',
              type: 'debit',
              status: 'pending',
              metadata: null,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        });

      const result = await repository.findAll({ type: 'debit' });

      expect(result.transactions[0].type).toBe('debit');
    });

    it('should find transactions with date filters', async () => {
      (dbPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'uuid-123',
              transaction_id: 'test-123',
              amount: '100.50',
              currency: 'USD',
              type: 'credit',
              status: 'pending',
              metadata: null,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        });

      const result = await repository.findAll({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(result.transactions).toHaveLength(1);
    });

    it('should find transactions with pagination', async () => {
      (dbPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'uuid-123',
              transaction_id: 'test-123',
              amount: '100.50',
              currency: 'USD',
              type: 'credit',
              status: 'pending',
              metadata: null,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        });

      const result = await repository.findAll({ page: 2, limit: 5 });

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(10);
    });

    it('should handle error when finding all transactions', async () => {
      const error = new Error('Database error');
      (dbPool.query as jest.Mock).mockRejectedValueOnce(error);

      await expect(repository.findAll({})).rejects.toThrow('Database error');
    });
  });

  describe('updateStatus', () => {
    it('should update transaction status', async () => {
      (dbPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: 'uuid-123',
            transaction_id: 'test-123',
            amount: '100.50',
            currency: 'USD',
            type: 'credit',
            status: 'completed',
            metadata: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      const result = await repository.updateStatus(
        'uuid-123',
        TransactionStatus.COMPLETED,
      );

      expect(result.status).toBe(TransactionStatus.COMPLETED);
    });

    it('should throw error when transaction not found', async () => {
      (dbPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(
        repository.updateStatus('non-existent', TransactionStatus.COMPLETED),
      ).rejects.toThrow('Transaction with id non-existent not found');
    });

    it('should handle error when updating status', async () => {
      const error = new Error('Database error');
      (dbPool.query as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        repository.updateStatus('uuid-123', TransactionStatus.COMPLETED),
      ).rejects.toThrow('Database error');
    });
  });

  describe('mapRowToEntity', () => {
    it('should map row with string amount', () => {
      const row = {
        id: 'uuid-123',
        transaction_id: 'test-123',
        amount: '100.50',
        currency: 'USD',
        type: 'credit',
        status: 'pending',
        metadata: { key: 'value' },
        created_at: new Date(),
        updated_at: new Date(),
      };

      const repository = new TransactionsRepository();
      // @ts-expect-error - accessing private method for testing
      const result = repository.mapRowToEntity(row);

      expect(result.amount).toBe(100.5);
      expect(result.metadata).toEqual({ key: 'value' });
    });

    it('should map row with number amount', () => {
      const row = {
        id: 'uuid-123',
        transaction_id: 'test-123',
        amount: 100.5,
        currency: 'USD',
        type: 'credit',
        status: 'pending',
        metadata: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const repository = new TransactionsRepository();
      // @ts-expect-error - accessing private method for testing
      const result = repository.mapRowToEntity(row);

      expect(result.amount).toBe(100.5);
    });
  });
});
