import { DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Transaction Processor API')
  .setDescription(
    'API RESTful para processamento de transações financeiras com idempotência, validação e tratamento de erros consistente. ' +
      'Suporta criação, consulta e listagem de transações com paginação e filtros.',
  )
  .setVersion('1.0.0')
  .setContact(
    'API Support',
    'https://github.com/your-org/transaction-processor-api',
    'support@example.com',
  )
  .setLicense('MIT', 'https://opensource.org/licenses/MIT')
  .addTag(
    'transactions',
    'Transaction management endpoints - Create, list, and retrieve financial transactions',
  )
  .addTag(
    'health',
    'Health check endpoints - Monitor service and dependency health',
  )
  .addServer('http://localhost:3000', 'Development server')
  .addServer('https://api.example.com', 'Production server')
  .build();

export const swaggerDocumentOptions: SwaggerDocumentOptions = {
  operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
};

export const swaggerSetupOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
  },
};
