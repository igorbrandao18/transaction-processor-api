import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { configureApp } from '@config/app.config';
import { HttpExceptionFilter } from '@filters/http-exception.filter';
import { validationPipeConfig } from '@config/validation.config';
import { testConnection } from '@config/database.config';
import { logger } from '@config/logger.config';

jest.mock('@nestjs/swagger');
jest.mock('@filters/http-exception.filter');
jest.mock('@config/validation.config');
jest.mock('@config/swagger.config', () => ({
  swaggerConfig: {},
  swaggerDocumentOptions: {},
  swaggerSetupOptions: {},
}));
jest.mock('@config/database.config');
jest.mock('@config/logger.config');

describe('app.config', () => {
  let mockApp: Partial<INestApplication>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockApp = {
      useGlobalPipes: jest.fn(),
      useGlobalFilters: jest.fn(),
      enableCors: jest.fn(),
    };

    (SwaggerModule.createDocument as jest.Mock).mockReturnValue({});
    (SwaggerModule.setup as jest.Mock).mockReturnValue(undefined);
    (testConnection as jest.Mock).mockResolvedValue(undefined);
    (logger.info as jest.Mock).mockImplementation(() => {});
    (logger.error as jest.Mock).mockImplementation(() => {});
  });

  it('should configure app with all middleware', async () => {
    await configureApp(mockApp as INestApplication);

    expect(mockApp.useGlobalPipes).toHaveBeenCalledWith(validationPipeConfig);
    expect(mockApp.useGlobalFilters).toHaveBeenCalledWith(
      expect.any(HttpExceptionFilter),
    );
    expect(mockApp.enableCors).toHaveBeenCalled();
  });

  it('should setup Swagger documentation', async () => {
    await configureApp(mockApp as INestApplication);

    expect(SwaggerModule.createDocument).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith(
      'api/docs',
      mockApp,
      {},
      expect.any(Object),
    );
  });

  it('should test database connection', async () => {
    await configureApp(mockApp as INestApplication);

    expect(testConnection).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Database connection established');
  });

  it('should exit process on database connection failure', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    const error = new Error('Connection failed');
    (testConnection as jest.Mock).mockRejectedValue(error);

    await expect(configureApp(mockApp as INestApplication)).rejects.toThrow(
      'process.exit',
    );

    expect(logger.error).toHaveBeenCalledWith('Failed to connect to database', {
      error,
    });

    exitSpy.mockRestore();
  });
});
