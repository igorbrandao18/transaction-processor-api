import { ValidationOptions } from 'class-validator';
export declare const VALID_CURRENCIES: readonly ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SEK", "NZD", "MXN", "SGD", "HKD", "NOK", "TRY", "RUB", "INR", "BRL", "ZAR", "DKK", "PLN", "TWD", "THB", "MYR", "CZK", "HUF", "ILS", "CLP", "PHP", "AED", "COP", "SAR", "IDR", "KRW", "EGP", "IQD", "ARS", "VND", "PKR", "BGN"];
export declare function IsCurrencyCode(validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
export declare function IsAmountPrecision(validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
