"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationPipeConfig = void 0;
const common_1 = require("@nestjs/common");
const logger_config_1 = require("./logger.config");
exports.validationPipeConfig = new common_1.ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    skipMissingProperties: false,
    skipNullProperties: false,
    skipUndefinedProperties: false,
    transformOptions: {
        enableImplicitConversion: false,
    },
    exceptionFactory: (errors) => {
        logger_config_1.logger.debug('Raw validation errors received', {
            errors,
            count: errors.length,
        });
        const filteredErrors = errors.filter((error) => {
            if (error.property === 'transactionId') {
                const target = error.target;
                const hasProperty = target && 'transactionId' in target;
                const value = target?.transactionId;
                logger_config_1.logger.info('Checking transactionId error', {
                    hasProperty,
                    value,
                    targetKeys: target ? Object.keys(target) : null,
                });
                if (!target || !hasProperty) {
                    logger_config_1.logger.info('Skipping transactionId validation - property not in target');
                    return false;
                }
                if (value === undefined || value === null || value === '') {
                    logger_config_1.logger.info('Skipping transactionId validation - value is empty', {
                        value,
                    });
                    return false;
                }
            }
            return true;
        });
        logger_config_1.logger.info('Filtered validation errors', {
            originalCount: errors.length,
            filteredCount: filteredErrors.length,
        });
        if (filteredErrors.length === 0) {
            logger_config_1.logger.info('All errors filtered out, returning null');
            return null;
        }
        logger_config_1.logger.error('Validation error', { errors: filteredErrors });
        return new common_1.HttpException({
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            message: 'Validation failed',
            errors: filteredErrors,
        }, common_1.HttpStatus.BAD_REQUEST);
    },
});
//# sourceMappingURL=validation.config.js.map