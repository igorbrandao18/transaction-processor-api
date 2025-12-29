import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { HealthController } from '@controllers/health.controller';
import { PrismaService } from '@config/prisma.service';
import { configureApp } from '@config/app.config';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

describe('Health Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [PrismaService],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return health status', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.body.status).toBe('UP');
    expect(response.body.checks.database).toBe('UP');
  });
});
