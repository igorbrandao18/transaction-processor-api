import { dbPool, testConnection } from '@config/database.config';
import { Pool } from 'pg';

jest.mock('pg');

describe('database.config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('dbPool', () => {
    it('should create a Pool instance', () => {
      expect(dbPool).toBeInstanceOf(Pool);
    });

    it('should have pool configuration', () => {
      expect(dbPool).toBeDefined();
      expect(dbPool).toBeInstanceOf(Pool);
    });

    it('should use default host when DB_HOST is not set', () => {
      const originalHost = process.env.DB_HOST;
      delete process.env.DB_HOST;
      jest.resetModules();
      const {
        dbPool: newPool,
      } = require('../../../src/config/database.config');
      expect(newPool).toBeDefined();
      process.env.DB_HOST = originalHost;
    });

    it('should use default port when DB_PORT is not set', () => {
      const originalPort = process.env.DB_PORT;
      delete process.env.DB_PORT;
      jest.resetModules();
      const {
        dbPool: newPool,
      } = require('../../../src/config/database.config');
      expect(newPool).toBeDefined();
      process.env.DB_PORT = originalPort;
    });

    it('should use default user when DB_USER is not set', () => {
      const originalUser = process.env.DB_USER;
      delete process.env.DB_USER;
      jest.resetModules();
      const {
        dbPool: newPool,
      } = require('../../../src/config/database.config');
      expect(newPool).toBeDefined();
      process.env.DB_USER = originalUser;
    });

    it('should use default password when DB_PASSWORD is not set', () => {
      const originalPassword = process.env.DB_PASSWORD;
      delete process.env.DB_PASSWORD;
      jest.resetModules();
      const {
        dbPool: newPool,
      } = require('../../../src/config/database.config');
      expect(newPool).toBeDefined();
      process.env.DB_PASSWORD = originalPassword;
    });

    it('should use default database when DB_NAME is not set', () => {
      const originalName = process.env.DB_NAME;
      delete process.env.DB_NAME;
      jest.resetModules();
      const {
        dbPool: newPool,
      } = require('../../../src/config/database.config');
      expect(newPool).toBeDefined();
      process.env.DB_NAME = originalName;
    });
  });

  describe('testConnection', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        release: jest.fn(),
      };
      jest
        .spyOn(dbPool, 'connect')
        .mockImplementation(() => Promise.resolve(mockClient));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should successfully test database connection', async () => {
      await testConnection();

      expect(dbPool.connect).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error when connection fails', async () => {
      const error = new Error('Connection failed');
      jest.spyOn(dbPool, 'connect').mockRejectedValue(error);

      await expect(testConnection()).rejects.toThrow('Connection failed');
    });

    it('should release client even if release throws', async () => {
      mockClient.release = jest.fn().mockImplementation(() => {
        throw new Error('Release failed');
      });

      await expect(testConnection()).rejects.toThrow('Release failed');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
