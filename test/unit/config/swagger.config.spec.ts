import {
  swaggerConfig,
  swaggerDocumentOptions,
  swaggerSetupOptions,
} from '@config/swagger.config';

describe('swagger.config', () => {
  it('should export swaggerConfig', () => {
    expect(swaggerConfig).toBeDefined();
    expect(swaggerConfig.info).toBeDefined();
    expect(swaggerConfig.info.title).toBe('Transaction Processor API');
    expect(swaggerConfig.info.version).toBe('1.0.0');
  });

  it('should export swaggerDocumentOptions', () => {
    expect(swaggerDocumentOptions).toBeDefined();
    expect(swaggerDocumentOptions.operationIdFactory).toBeDefined();
    expect(typeof swaggerDocumentOptions.operationIdFactory).toBe('function');
  });

  it('should export swaggerSetupOptions', () => {
    expect(swaggerSetupOptions).toBeDefined();
    expect(swaggerSetupOptions.swaggerOptions).toBeDefined();
    expect(swaggerSetupOptions.swaggerOptions.persistAuthorization).toBe(true);
    expect(swaggerSetupOptions.swaggerOptions.displayRequestDuration).toBe(
      true,
    );
  });

  it('should have correct operationIdFactory', () => {
    const factory = swaggerDocumentOptions.operationIdFactory;
    const operationId = factory('Controller', 'method');
    expect(operationId).toBe('method');
  });
});
