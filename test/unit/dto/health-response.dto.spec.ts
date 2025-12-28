import { HealthCheckDto } from '@dto/health-response.dto';

describe('HealthCheckDto', () => {
  it('should create instance with all properties', () => {
    const dto = new HealthCheckDto();
    dto.status = 'UP';
    dto.timestamp = '2024-01-01T00:00:00.000Z';
    dto.service = 'transaction-processor-api';
    dto.version = '1.0.0';
    dto.checks = {
      database: 'UP',
    };

    expect(dto.status).toBe('UP');
    expect(dto.timestamp).toBe('2024-01-01T00:00:00.000Z');
    expect(dto.service).toBe('transaction-processor-api');
    expect(dto.version).toBe('1.0.0');
    expect(dto.checks.database).toBe('UP');
  });

  it('should allow DOWN status', () => {
    const dto = new HealthCheckDto();
    dto.status = 'DOWN';

    expect(dto.status).toBe('DOWN');
  });

  it('should allow different service names', () => {
    const dto = new HealthCheckDto();
    dto.service = 'test-service';

    expect(dto.service).toBe('test-service');
  });

  it('should allow different versions', () => {
    const dto = new HealthCheckDto();
    dto.version = '2.0.0';

    expect(dto.version).toBe('2.0.0');
  });

  it('should allow different database status', () => {
    const dto = new HealthCheckDto();
    dto.checks = {
      database: 'DOWN',
    };

    expect(dto.checks.database).toBe('DOWN');
  });

  it('should create complete health check object', () => {
    const dto: HealthCheckDto = {
      status: 'UP',
      timestamp: '2024-01-01T00:00:00.000Z',
      service: 'transaction-processor-api',
      version: '1.0.0',
      checks: {
        database: 'UP',
      },
    };

    expect(dto).toEqual({
      status: 'UP',
      timestamp: '2024-01-01T00:00:00.000Z',
      service: 'transaction-processor-api',
      version: '1.0.0',
      checks: {
        database: 'UP',
      },
    });
  });
});
