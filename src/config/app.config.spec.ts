import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { configureApp } from './app.config';

jest.mock('@nestjs/swagger');
jest.mock('./swagger.config', () => ({
  swaggerConfig: {},
  swaggerDocumentOptions: {},
  swaggerSetupOptions: {},
}));

describe('app.config', () => {
  let mockApp: Partial<INestApplication>;

  beforeEach(() => {
    mockApp = {
      setGlobalPrefix: jest.fn().mockReturnThis(),
      useGlobalPipes: jest.fn().mockReturnThis(),
    };

    (SwaggerModule.createDocument as jest.Mock) = jest.fn().mockReturnValue({});
    (SwaggerModule.setup as jest.Mock) = jest.fn();
  });

  it('should set global prefix to "api"', async () => {
    await configureApp(mockApp as INestApplication);

    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api');
  });

  it('should configure validation pipe', async () => {
    await configureApp(mockApp as INestApplication);

    expect(mockApp.useGlobalPipes).toHaveBeenCalled();
  });

  it('should configure Swagger documentation', async () => {
    await configureApp(mockApp as INestApplication);

    expect(SwaggerModule.createDocument).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith(
      'api/docs',
      mockApp,
      {},
      expect.any(Object),
    );
  });
});

