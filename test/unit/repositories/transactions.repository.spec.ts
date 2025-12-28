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
  });
});
