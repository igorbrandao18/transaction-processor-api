"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const validators_1 = require("../../../src/utils/validators");
class TestCurrencyClass {
    currency;
}
__decorate([
    (0, validators_1.IsCurrencyCode)(),
    __metadata("design:type", String)
], TestCurrencyClass.prototype, "currency", void 0);
class TestAmountClass {
    amount;
}
__decorate([
    (0, validators_1.IsAmountPrecision)(),
    __metadata("design:type", Number)
], TestAmountClass.prototype, "amount", void 0);
describe('Validators', () => {
    describe('IsCurrencyCode', () => {
        it('should validate valid currency codes', async () => {
            const testObj = new TestCurrencyClass();
            testObj.currency = 'USD';
            const errors = await (0, class_validator_1.validate)(testObj);
            expect(errors).toHaveLength(0);
        });
        it('should validate lowercase currency codes', async () => {
            const testObj = new TestCurrencyClass();
            testObj.currency = 'usd';
            const errors = await (0, class_validator_1.validate)(testObj);
            expect(errors).toHaveLength(0);
        });
        it('should reject invalid currency codes', async () => {
            const testObj = new TestCurrencyClass();
            testObj.currency = 'XXX';
            const errors = await (0, class_validator_1.validate)(testObj);
            expect(errors).toHaveLength(1);
            expect(errors[0].constraints).toBeDefined();
        });
        it('should reject non-string values', async () => {
            const testObj = new TestCurrencyClass();
            testObj.currency = 123;
            const errors = await (0, class_validator_1.validate)(testObj);
            expect(errors).toHaveLength(1);
        });
        it('should validate all valid currencies', async () => {
            for (const currency of validators_1.VALID_CURRENCIES) {
                const testObj = new TestCurrencyClass();
                testObj.currency = currency;
                const errors = await (0, class_validator_1.validate)(testObj);
                expect(errors).toHaveLength(0);
            }
        });
    });
    describe('IsAmountPrecision', () => {
        it('should validate amounts with 0 decimal places', async () => {
            const testObj = new TestAmountClass();
            testObj.amount = 100;
            const errors = await (0, class_validator_1.validate)(testObj);
            expect(errors).toHaveLength(0);
        });
        it('should validate amounts with 1 decimal place', async () => {
            const testObj = new TestAmountClass();
            testObj.amount = 100.5;
            const errors = await (0, class_validator_1.validate)(testObj);
            expect(errors).toHaveLength(0);
        });
        it('should validate amounts with 2 decimal places', async () => {
            const testObj = new TestAmountClass();
            testObj.amount = 100.99;
            const errors = await (0, class_validator_1.validate)(testObj);
            expect(errors).toHaveLength(0);
        });
        it('should reject amounts with more than 2 decimal places', async () => {
            const testObj = new TestAmountClass();
            testObj.amount = 100.999;
            const errors = await (0, class_validator_1.validate)(testObj);
            expect(errors).toHaveLength(1);
            expect(errors[0].constraints).toBeDefined();
        });
        it('should reject non-number values', async () => {
            const testObj = new TestAmountClass();
            testObj.amount = '100.50';
            const errors = await (0, class_validator_1.validate)(testObj);
            expect(errors).toHaveLength(1);
        });
    });
});
//# sourceMappingURL=validators.spec.js.map