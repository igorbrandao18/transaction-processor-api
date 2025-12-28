import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { dbPool } from '@config/database.config';
import { logger } from '@config/logger.config';
import { HealthCheckDto } from '@dto/health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health check endpoint',
    description: `
      Checks the health status of the service and its dependencies.
      
      Use Cases:
      - Monitoring and alerting systems can use this endpoint to check service availability
      - Load balancers can use this endpoint to determine if the service should receive traffic
      - CI/CD pipelines can use this endpoint to verify successful deployments
      
      Response Codes:
      - 200 OK: Service is healthy and all dependencies are operational
      - 503 Service Unavailable: Service is unhealthy (database connection failed or other critical issue)
      
      Health Checks:
      - Database connectivity: Verifies that the service can connect to the PostgreSQL database
      
      Response Format:
      The response includes:
      - status: Overall service status (UP or DOWN)
      - timestamp: ISO 8601 timestamp of the health check
      - service: Service name
      - version: Service version
      - checks: Individual dependency health checks
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy and all dependencies are operational',
    type: HealthCheckDto,
    examples: {
      'Healthy Service': {
        value: {
          status: 'UP',
          timestamp: '2024-01-15T10:30:00.000Z',
          service: 'transaction-processor-api',
          version: '1.0.0',
          checks: {
            database: 'UP',
          },
        },
        summary: 'Service is healthy and database is connected',
      },
    },
  })
  @ApiResponse({
    status: 503,
    description:
      'Service is unhealthy. One or more dependencies are not operational.',
    type: HealthCheckDto,
    examples: {
      'Database Down': {
        value: {
          status: 'DOWN',
          timestamp: '2024-01-15T10:30:00.000Z',
          service: 'transaction-processor-api',
          version: '1.0.0',
          checks: {
            database: 'DOWN',
          },
        },
        summary: 'Database connection failed',
      },
    },
  })
  async check(@Res() res: Response) {
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
      const client = await dbPool.connect();
      await client.query('SELECT 1');
      client.release();

      health.checks.database = 'UP';
      logger.info('Health check passed', { health });

      return res.status(HttpStatus.OK).json(health);
    } catch (error: any) {
      health.status = 'DOWN';
      health.checks.database = 'DOWN';

      logger.error('Health check failed', {
        error: error.message,
        health,
      });

      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(health);
    }
  }
}
