import { Test, TestingModule } from '@nestjs/testing';
import { MiddlewareConsumer } from '@nestjs/common';
import { AppModule } from '@app.module';
import { LoggerMiddleware } from '@middleware/logger.middleware';

describe('AppModule', () => {
  let module: TestingModule;
  let appModule: AppModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    appModule = module.get<AppModule>(AppModule);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(appModule).toBeDefined();
  });

  it('should configure middleware', () => {
    const consumer = {
      apply: jest.fn().mockReturnThis(),
      forRoutes: jest.fn().mockReturnThis(),
    } as unknown as MiddlewareConsumer;

    appModule.configure(consumer);

    expect(consumer.apply).toHaveBeenCalledWith(LoggerMiddleware);
    expect(consumer.forRoutes).toHaveBeenCalledWith('*');
  });
});
