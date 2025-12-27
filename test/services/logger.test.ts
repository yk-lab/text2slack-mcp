import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../src/services/logger.js';

describe('Logger', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Suppress console.error output during tests
    });
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should be disabled by default when DEBUG and LOG_LEVEL are not set', () => {
      delete process.env.DEBUG;
      delete process.env.LOG_LEVEL;

      const logger = new Logger();
      logger.info('test message');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should be enabled when DEBUG=true', () => {
      process.env.DEBUG = 'true';
      delete process.env.LOG_LEVEL;

      const logger = new Logger();
      logger.info('test message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should be enabled when LOG_LEVEL is set', () => {
      delete process.env.DEBUG;
      process.env.LOG_LEVEL = 'info';

      const logger = new Logger();
      logger.info('test message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect enabled option override', () => {
      delete process.env.DEBUG;
      delete process.env.LOG_LEVEL;

      const logger = new Logger({ enabled: true });
      logger.info('test message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect minLevel option override', () => {
      const logger = new Logger({ enabled: true, minLevel: 'warn' });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(logEntry.level).toBe('warn');
    });
  });

  describe('log levels', () => {
    it('should filter logs below minimum level', () => {
      process.env.LOG_LEVEL = 'warn';

      const logger = new Logger();
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      // warn and error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });

    it('should always output error logs even when disabled', () => {
      delete process.env.DEBUG;
      delete process.env.LOG_LEVEL;

      const logger = new Logger();
      logger.info('info message');
      logger.error('error message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(logEntry.level).toBe('error');
    });

    it('should ignore invalid LOG_LEVEL values', () => {
      process.env.LOG_LEVEL = 'invalid';
      delete process.env.DEBUG;

      const logger = new Logger();
      logger.info('test message');

      // Should not be enabled due to invalid LOG_LEVEL
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('log output format', () => {
    it('should output JSON with timestamp, level, and message', () => {
      const logger = new Logger({ enabled: true });
      logger.info('test message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);

      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry.level).toBe('info');
      expect(logEntry.message).toBe('test message');
      expect(new Date(logEntry.timestamp).toISOString()).toBe(
        logEntry.timestamp,
      );
    });

    it('should include metadata when provided', () => {
      const logger = new Logger({ enabled: true });
      logger.info('test message', { key: 'value', count: 42 });

      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(logEntry.metadata).toEqual({ key: 'value', count: 42 });
    });

    it('should extract duration to top level', () => {
      const logger = new Logger({ enabled: true });
      logger.info('test message', { duration: 100, other: 'data' });

      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(logEntry.duration).toBe(100);
      expect(logEntry.metadata).toEqual({ other: 'data' });
    });

    it('should not include metadata field when only duration is provided', () => {
      const logger = new Logger({ enabled: true });
      logger.info('test message', { duration: 100 });

      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(logEntry.duration).toBe(100);
      expect(logEntry.metadata).toBeUndefined();
    });

    it('should not include metadata field when empty', () => {
      const logger = new Logger({ enabled: true });
      logger.info('test message', {});

      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(logEntry.metadata).toBeUndefined();
    });
  });

  describe('debug', () => {
    it('should log at debug level', () => {
      const logger = new Logger({ enabled: true, minLevel: 'debug' });
      logger.debug('debug message');

      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(logEntry.level).toBe('debug');
      expect(logEntry.message).toBe('debug message');
    });
  });

  describe('info', () => {
    it('should log at info level', () => {
      const logger = new Logger({ enabled: true });
      logger.info('info message');

      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(logEntry.level).toBe('info');
      expect(logEntry.message).toBe('info message');
    });
  });

  describe('warn', () => {
    it('should log at warn level', () => {
      const logger = new Logger({ enabled: true });
      logger.warn('warn message');

      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(logEntry.level).toBe('warn');
      expect(logEntry.message).toBe('warn message');
    });
  });

  describe('error', () => {
    it('should log at error level', () => {
      const logger = new Logger({ enabled: true });
      logger.error('error message');

      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(logEntry.level).toBe('error');
      expect(logEntry.message).toBe('error message');
    });

    it('should include error details when Error object is provided', () => {
      const logger = new Logger({ enabled: true });
      const testError = new Error('Test error');
      logger.error('operation failed', testError);

      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(logEntry.metadata?.error).toBe('Test error');
      expect(logEntry.metadata?.stack).toContain('Error: Test error');
    });

    it('should include both error and additional metadata', () => {
      const logger = new Logger({ enabled: true });
      const testError = new Error('Test error');
      logger.error('operation failed', testError, { userId: 123 });

      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(logEntry.metadata?.error).toBe('Test error');
      expect(logEntry.metadata?.userId).toBe(123);
    });
  });
});
