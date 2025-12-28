import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

const VALID_CURRENCIES = [
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

export function IsCurrencyCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCurrencyCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') {
            return false;
          }
          return VALID_CURRENCIES.includes(value.toUpperCase());
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid ISO 4217 currency code (e.g., USD, EUR, BRL)`;
        },
      },
    });
  };
}

export function IsAmountPrecision(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAmountPrecision',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'number') {
            return false;
          }
          const decimalPlaces = (value.toString().split('.')[1] || '').length;
          return decimalPlaces <= 2;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must have maximum 2 decimal places`;
        },
      },
    });
  };
}
