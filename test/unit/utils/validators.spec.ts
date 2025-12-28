import { IsCurrencyCode, IsAmountPrecision } from '@utils/validators';
import { validate } from 'class-validator';

class TestCurrencyDto {
  @IsCurrencyCode()
  currency: string;
}

class TestAmountDto {
  @IsAmountPrecision()
  amount: number;
}

describe('Validators', () => {
  describe('IsCurrencyCode', () => {
    it('should validate valid currency codes', async () => {
      const dto = new TestCurrencyDto();
      dto.currency = 'USD';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate BRL currency code', async () => {
      const dto = new TestCurrencyDto();
      dto.currency = 'BRL';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate EUR currency code', async () => {
      const dto = new TestCurrencyDto();
      dto.currency = 'EUR';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate lowercase currency codes', async () => {
      const dto = new TestCurrencyDto();
      dto.currency = 'usd';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate mixed case currency codes', async () => {
      const dto = new TestCurrencyDto();
      dto.currency = 'Brl';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid currency codes', async () => {
      const dto = new TestCurrencyDto();
      dto.currency = 'XXX';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isCurrencyCode');
      expect(errors[0].constraints?.isCurrencyCode).toContain(
        'must be a valid ISO 4217 currency code',
      );
    });

    it('should reject empty string', async () => {
      const dto = new TestCurrencyDto();
      dto.currency = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject non-string values', async () => {
      const dto = new TestCurrencyDto();
      (dto as any).currency = 123;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject null values', async () => {
      const dto = new TestCurrencyDto();
      (dto as any).currency = null;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject undefined values', async () => {
      const dto = new TestCurrencyDto();
      (dto as any).currency = undefined;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should validate all valid currencies from the list', async () => {
      const validCurrencies = [
        'USD',
        'EUR',
        'GBP',
        'JPY',
        'AUD',
        'CAD',
        'CHF',
        'CNY',
        'SEK',
        'NZD',
        'MXN',
        'SGD',
        'HKD',
        'NOK',
        'TRY',
        'RUB',
        'INR',
        'BRL',
        'ZAR',
        'DKK',
        'PLN',
        'TWD',
        'THB',
        'MYR',
        'CZK',
        'HUF',
        'ILS',
        'CLP',
        'PHP',
        'AED',
        'COP',
        'SAR',
        'IDR',
        'KRW',
        'EGP',
        'IQD',
        'ARS',
        'VND',
        'PKR',
        'BGN',
      ];

      for (const currency of validCurrencies) {
        const dto = new TestCurrencyDto();
        dto.currency = currency;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('IsAmountPrecision', () => {
    it('should validate amounts with 0 decimal places', async () => {
      const dto = new TestAmountDto();
      dto.amount = 100;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate amounts with 1 decimal place', async () => {
      const dto = new TestAmountDto();
      dto.amount = 100.5;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate amounts with 2 decimal places', async () => {
      const dto = new TestAmountDto();
      dto.amount = 100.99;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject amounts with more than 2 decimal places', async () => {
      const dto = new TestAmountDto();
      dto.amount = 100.999;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isAmountPrecision');
      expect(errors[0].constraints?.isAmountPrecision).toContain(
        'must have maximum 2 decimal places',
      );
    });

    it('should reject amounts with 3 decimal places', async () => {
      const dto = new TestAmountDto();
      dto.amount = 100.123;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject non-number values', async () => {
      const dto = new TestAmountDto();
      (dto as any).amount = '100.50';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject null values', async () => {
      const dto = new TestAmountDto();
      (dto as any).amount = null;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject undefined values', async () => {
      const dto = new TestAmountDto();
      (dto as any).amount = undefined;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should handle very large numbers correctly', async () => {
      const dto = new TestAmountDto();
      dto.amount = 999999999.99;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle very small numbers correctly', async () => {
      const dto = new TestAmountDto();
      dto.amount = 0.01;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle zero correctly', async () => {
      const dto = new TestAmountDto();
      dto.amount = 0;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle negative numbers correctly', async () => {
      const dto = new TestAmountDto();
      dto.amount = -100.5;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
