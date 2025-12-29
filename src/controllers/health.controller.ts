import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { logger } from '@config/logger.config';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const health = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'transaction-processor-api',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'UNKNOWN',
      },
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      health.checks.database = 'UP';
      logger.info('Health check passed', { health });

      return health;
    } catch (error: unknown) {
      health.status = 'DOWN';
      health.checks.database = 'DOWN';

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error('Health check failed', {
        error: errorMessage,
        health,
      });

      return health;
    }
  }
}
