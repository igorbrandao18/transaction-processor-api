import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { HealthController } from '@controllers/health.controller';
import { dbPool } from '@config/database.config';
import { logger } from '@config/logger.config';
import type { Response } from 'express';

jest.mock('@config/database.config');
jest.mock('@config/logger.config');

describe('HealthController', () => {
  let controller: HealthController;
  let mockResponse: Partial<Response>;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.npm_package_version;
  });

  describe('check', () => {
    it('should return UP status when database is healthy', async () => {
      (dbPool.connect as jest.Mock).mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

      await controller.check(mockResponse as Response);

      expect(dbPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockClient.release).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'UP',
          checks: {
            database: 'UP',
          },
        }),
      );
      expect(logger.info).toHaveBeenCalled();
    });

    it('should return DOWN status when database connection fails', async () => {
      const error = new Error('Connection failed');
      (dbPool.connect as jest.Mock).mockRejectedValue(error);

      await controller.check(mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'DOWN',
          checks: {
            database: 'DOWN',
          },
        }),
      );
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return DOWN status when database query fails', async () => {
      const error = new Error('Query failed');
      (dbPool.connect as jest.Mock).mockResolvedValue(mockClient);
      mockClient.query.mockRejectedValue(error);

      await controller.check(mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'DOWN',
          checks: {
            database: 'DOWN',
          },
        }),
      );
    });

    it('should include version from package.json if available', async () => {
      process.env.npm_package_version = '2.0.0';
      (dbPool.connect as jest.Mock).mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

      await controller.check(mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '2.0.0',
        }),
      );
    });

    it('should use default version when package version is not available', async () => {
      (dbPool.connect as jest.Mock).mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

      await controller.check(mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '1.0.0',
        }),
      );
    });

    it('should include timestamp in response', async () => {
      (dbPool.connect as jest.Mock).mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

      await controller.check(mockResponse as Response);

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.timestamp).toBeDefined();
      expect(new Date(callArgs.timestamp).toISOString()).toBe(
        callArgs.timestamp,
      );
    });

    it('should include service name in response', async () => {
      (dbPool.connect as jest.Mock).mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

      await controller.check(mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'transaction-processor-api',
        }),
      );
    });
  });
});
