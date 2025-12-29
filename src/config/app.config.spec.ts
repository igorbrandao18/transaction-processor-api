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

  it('should set global prefix to "api"', () => {
    configureApp(mockApp as INestApplication);

    const setGlobalPrefixMock = mockApp.setGlobalPrefix as jest.Mock;
    expect(setGlobalPrefixMock).toHaveBeenCalledWith('api');
    expect(setGlobalPrefixMock).toHaveBeenCalledTimes(1);
  });

  it('should configure validation pipe', () => {
    configureApp(mockApp as INestApplication);

    const useGlobalPipesMock = mockApp.useGlobalPipes as jest.Mock;
    expect(useGlobalPipesMock).toHaveBeenCalledTimes(1);
  });

  it('should configure Swagger documentation', () => {
    configureApp(mockApp as INestApplication);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(SwaggerModule.createDocument).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(SwaggerModule.setup).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(SwaggerModule.setup).toHaveBeenCalledWith(
      'api/docs',
      mockApp,
      expect.any(Object),
      expect.any(Object),
    );
  });
});
