/**
 * Log levels for structured logging.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured log entry format.
 */
export interface LogEntry {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Optional duration in milliseconds */
  duration?: number;
  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Log level priority for filtering.
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Parses the LOG_LEVEL environment variable.
 *
 * @param value - The value of LOG_LEVEL environment variable
 * @returns The parsed log level or undefined if invalid
 */
function parseLogLevel(value: string | undefined): LogLevel | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized in LOG_LEVEL_PRIORITY) {
    return normalized as LogLevel;
  }
  return undefined;
}

/**
 * Structured logger for debugging and monitoring.
 *
 * Logs are output to stderr (to avoid interfering with MCP stdout communication)
 * in JSON format for easy parsing by log aggregators.
 *
 * @example
 * ```typescript
 * const logger = new Logger();
 *
 * // Basic logging
 * logger.info('Server started');
 * logger.error('Failed to connect', { error: 'Connection refused' });
 *
 * // With timing
 * const start = Date.now();
 * // ... operation ...
 * logger.info('Operation completed', { duration: Date.now() - start });
 * ```
 */
export class Logger {
  private readonly enabled: boolean;
  private readonly minLevel: LogLevel;

  /**
   * Creates a new Logger instance.
   *
   * Logging is enabled when:
   * - DEBUG=true environment variable is set, or
   * - LOG_LEVEL environment variable is set to a valid level
   *
   * Error logs are always output regardless of these settings.
   *
   * @param options - Optional configuration
   * @param options.enabled - Force enable/disable logging (overrides env vars)
   * @param options.minLevel - Minimum log level to output (overrides LOG_LEVEL env var)
   */
  constructor(options?: { enabled?: boolean; minLevel?: LogLevel }) {
    const debugEnv = process.env.DEBUG === 'true';
    const logLevelEnv = parseLogLevel(process.env.LOG_LEVEL);

    this.enabled = options?.enabled ?? (debugEnv || logLevelEnv !== undefined);
    this.minLevel = options?.minLevel ?? logLevelEnv ?? 'info';
  }

  /**
   * Logs a debug message.
   *
   * @param message - The log message
   * @param metadata - Optional additional data
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }

  /**
   * Logs an info message.
   *
   * @param message - The log message
   * @param metadata - Optional additional data
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  /**
   * Logs a warning message.
   *
   * @param message - The log message
   * @param metadata - Optional additional data
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  /**
   * Logs an error message.
   *
   * Error logs are always output regardless of DEBUG or LOG_LEVEL settings.
   *
   * @param message - The log message
   * @param error - Optional error object to include
   * @param metadata - Optional additional data
   */
  error(
    message: string,
    error?: Error,
    metadata?: Record<string, unknown>,
  ): void {
    const errorMetadata: Record<string, unknown> = { ...metadata };
    if (error) {
      errorMetadata.error = error.message;
      errorMetadata.stack = error.stack;
    }
    this.log('error', message, errorMetadata);
  }

  /**
   * Internal logging method.
   *
   * @param level - Log level
   * @param message - Log message
   * @param metadata - Optional metadata
   */
  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    // Error logs are always output
    const isError = level === 'error';

    // Skip if logging is disabled and not an error
    if (!this.enabled && !isError) {
      return;
    }

    // Skip if below minimum level (but always output errors)
    if (
      !isError &&
      LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]
    ) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (metadata && Object.keys(metadata).length > 0) {
      // Extract duration to top level if present
      if (typeof metadata.duration === 'number') {
        entry.duration = metadata.duration;
        const { duration: _, ...rest } = metadata;
        if (Object.keys(rest).length > 0) {
          entry.metadata = rest;
        }
      } else {
        entry.metadata = metadata;
      }
    }

    // Output to stderr to avoid interfering with MCP stdout communication
    console.error(JSON.stringify(entry));
  }
}

/**
 * Default logger instance.
 *
 * Use this for simple cases where you don't need custom configuration.
 */
export const logger = new Logger();
