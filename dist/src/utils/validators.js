"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_CURRENCIES = void 0;
exports.IsCurrencyCode = IsCurrencyCode;
exports.IsAmountPrecision = IsAmountPrecision;
const class_validator_1 = require("class-validator");
exports.VALID_CURRENCIES = [
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
function IsCurrencyCode(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isCurrencyCode',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value) {
                    if (typeof value !== 'string') {
                        return false;
                    }
                    return exports.VALID_CURRENCIES.includes(value.toUpperCase());
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid ISO 4217 currency code (e.g., USD, EUR, BRL)`;
                },
            },
        });
    };
}
function IsAmountPrecision(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isAmountPrecision',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value) {
                    if (typeof value !== 'number') {
                        return false;
                    }
                    const decimalPlaces = (value.toString().split('.')[1] || '').length;
                    return decimalPlaces <= 2;
                },
                defaultMessage(args) {
                    return `${args.property} must have maximum 2 decimal places`;
                },
            },
        });
    };
}
//# sourceMappingURL=validators.js.map