import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from '@controllers/metrics.controller';
import { register } from '@config/metrics.config';
import type { Response } from 'express';

jest.mock('@config/metrics.config');

describe('MetricsController', () => {
  let controller: MetricsController;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    mockResponse = {
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('should return metrics in text/plain format', async () => {
      const mockMetrics = 'http_requests_total 100\n';
      (register.metrics as jest.Mock).mockResolvedValue(mockMetrics);

      await controller.getMetrics(mockResponse as Response);

      expect(mockResponse.set).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain',
      );
      expect(register.metrics).toHaveBeenCalled();
      expect(mockResponse.send).toHaveBeenCalledWith(mockMetrics);
    });

    it('should handle metrics retrieval errors', async () => {
      const error = new Error('Metrics error');
      (register.metrics as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.getMetrics(mockResponse as Response),
      ).rejects.toThrow('Metrics error');
    });
  });
});
