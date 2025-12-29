import {
  ValidationErrorDto,
  BadRequestErrorDto,
  ConflictErrorDto,
  NotFoundErrorDto,
  InternalServerErrorDto,
} from '@dto/error-response.dto';

describe('ErrorResponseDto', () => {
  describe('ValidationErrorDto', () => {
    it('should be defined', () => {
      expect(ValidationErrorDto).toBeDefined();
    });

    it('should create a valid instance', () => {
      const dto = new ValidationErrorDto();
      dto.property = 'amount';
      dto.constraints = { isNumber: 'amount must be a number' };

      expect(dto).toBeInstanceOf(ValidationErrorDto);
      expect(dto.property).toBe('amount');
      expect(dto.constraints).toEqual({ isNumber: 'amount must be a number' });
    });

    it('should create instance with multiple constraints', () => {
      const dto = new ValidationErrorDto();
      dto.property = 'amount';
      dto.constraints = {
        isNumber: 'amount must be a number',
        min: 'amount must not be less than 0',
        max: 'amount must not be greater than 1000000',
      };

      expect(dto.constraints).toHaveProperty('isNumber');
      expect(dto.constraints).toHaveProperty('min');
      expect(dto.constraints).toHaveProperty('max');
    });

    it('should create instance with empty constraints', () => {
      const dto = new ValidationErrorDto();
      dto.property = 'field';
      dto.constraints = {};

      expect(dto.constraints).toEqual({});
    });
  });

  describe('BadRequestErrorDto', () => {
    it('should be defined', () => {
      expect(BadRequestErrorDto).toBeDefined();
    });

    it('should create a valid instance', () => {
      const dto = new BadRequestErrorDto();
      dto.statusCode = 400;
      dto.message = 'Validation failed';
      dto.errors = [
        {
          property: 'amount',
          constraints: { isNumber: 'amount must be a number' },
        },
      ];

      expect(dto).toBeInstanceOf(BadRequestErrorDto);
      expect(dto.statusCode).toBe(400);
      expect(dto.message).toBe('Validation failed');
      expect(dto.errors).toHaveLength(1);
    });
  });

  describe('ConflictErrorDto', () => {
    it('should be defined', () => {
      expect(ConflictErrorDto).toBeDefined();
    });

    it('should create a valid instance', () => {
      const dto = new ConflictErrorDto();
      dto.statusCode = 409;
      dto.error = 'Transaction already exists';
      dto.transactionId = 'txn-123';
      dto.existingTransaction = { id: '123', transactionId: 'txn-123' };

      expect(dto).toBeInstanceOf(ConflictErrorDto);
      expect(dto.statusCode).toBe(409);
      expect(dto.error).toBe('Transaction already exists');
      expect(dto.transactionId).toBe('txn-123');
      expect(dto.existingTransaction).toEqual({
        id: '123',
        transactionId: 'txn-123',
      });
    });
  });

  describe('NotFoundErrorDto', () => {
    it('should be defined', () => {
      expect(NotFoundErrorDto).toBeDefined();
    });

    it('should create a valid instance', () => {
      const dto = new NotFoundErrorDto();
      dto.statusCode = 404;
      dto.message = 'Transaction not found';
      dto.path = '/transactions/123';
      dto.timestamp = '2024-01-01T00:00:00.000Z';

      expect(dto).toBeInstanceOf(NotFoundErrorDto);
      expect(dto.statusCode).toBe(404);
      expect(dto.message).toBe('Transaction not found');
      expect(dto.path).toBe('/transactions/123');
      expect(dto.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('InternalServerErrorDto', () => {
    it('should be defined', () => {
      expect(InternalServerErrorDto).toBeDefined();
    });

    it('should create a valid instance', () => {
      const dto = new InternalServerErrorDto();
      dto.statusCode = 500;
      dto.message = 'Internal server error';
      dto.path = '/transactions';
      dto.timestamp = '2024-01-01T00:00:00.000Z';

      expect(dto).toBeInstanceOf(InternalServerErrorDto);
      expect(dto.statusCode).toBe(500);
      expect(dto.message).toBe('Internal server error');
      expect(dto.path).toBe('/transactions');
      expect(dto.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });
  });
});
