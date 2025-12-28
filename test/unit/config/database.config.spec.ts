import { dbPool, testConnection } from '@config/database.config';
import { Pool } from 'pg';

jest.mock('pg');
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('DatabaseConfig', () => {
  let mockClient: {
    release: jest.Mock;
  };
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;

  beforeEach(() => {
    mockClient = {
      release: jest.fn(),
    };

    (dbPool.connect as jest.Mock) = jest.fn().mockResolvedValue(mockClient);
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Close pool to prevent Jest from hanging
    if (dbPool && typeof dbPool.end === 'function') {
      await dbPool.end().catch(() => {
        // Ignore errors on cleanup
      });
    }
  });

  it('should export dbPool instance', () => {
    expect(dbPool).toBeDefined();
    expect(dbPool).toBeInstanceOf(Pool);
  });

  it('should export testConnection function', () => {
    expect(testConnection).toBeDefined();
    expect(typeof testConnection).toBe('function');
  });

  describe('testConnection', () => {
    it('should connect to database and log success', async () => {
      await testConnection();

      expect(dbPool.connect).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Database connected successfully',
      );
    });

    it('should throw error when connection fails', async () => {
      const error = new Error('Connection failed');
      (dbPool.connect as jest.Mock) = jest.fn().mockRejectedValue(error);

      await expect(testConnection()).rejects.toThrow('Connection failed');
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Database connection error:',
        error,
      );
    });

    it('should release client even if query fails', async () => {
      const error = new Error('Query failed');
      (dbPool.connect as jest.Mock) = jest.fn().mockResolvedValue(mockClient);
      // Simulate error after connect
      mockClient.release = jest.fn().mockImplementation(() => {
        throw error;
      });

      await expect(testConnection()).rejects.toThrow();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
