import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckDto {
  @ApiProperty({
    description: 'Service health status',
    example: 'UP',
    enum: ['UP', 'DOWN'],
  })
  status: string;

  @ApiProperty({
    description: 'Health check timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Service name',
    example: 'transaction-processor-api',
  })
  service: string;

  @ApiProperty({
    description: 'Service version',
    example: '1.0.0',
  })
  version: string;

  @ApiProperty({
    description: 'Health checks for dependencies',
    example: {
      database: 'UP',
    },
  })
  checks: {
    database: string;
  };
}
