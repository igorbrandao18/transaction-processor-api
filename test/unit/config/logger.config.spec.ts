import { logger } from '@config/logger.config';

describe('logger.config', () => {
  it('should export a logger instance', () => {
    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it('should have a valid log level', () => {
    expect(logger.level).toBeDefined();
    expect(['error', 'warn', 'info', 'debug', 'verbose']).toContain(
      logger.level,
    );
  });

  it('should log info messages', () => {
    const spy = jest.spyOn(logger, 'info');
    logger.info('Test message');
    expect(spy).toHaveBeenCalledWith('Test message');
    spy.mockRestore();
  });

  it('should log error messages', () => {
    const spy = jest.spyOn(logger, 'error');
    logger.error('Test error');
    expect(spy).toHaveBeenCalledWith('Test error');
    spy.mockRestore();
  });

  it('should log warn messages', () => {
    const spy = jest.spyOn(logger, 'warn');
    logger.warn('Test warning');
    expect(spy).toHaveBeenCalledWith('Test warning');
    spy.mockRestore();
  });
});
