import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../../../src/app.controller';
import { AppService } from '../../../src/app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn().mockReturnValue('Hello World!'),
          },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return "Hello World!"', () => {
    const result = controller.getHello();
    expect(result).toBe('Hello World!');
    expect(service.getHello).toHaveBeenCalled();
  });
});
