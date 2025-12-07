/**
 * Result of sending a message to Slack.
 */
export interface SendMessageResult {
  /** Whether the message was sent successfully */
  success: boolean;
  /** The message that was sent */
  message: string;
}

/**
 * Configuration for retry behavior with exponential backoff.
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts.
   * @default 3
   */
  maxRetries: number;
  /**
   * Base delay in milliseconds before the first retry.
   * @default 1000
   */
  baseDelayMs: number;
  /**
   * Maximum delay in milliseconds between retries.
   * @default 10000
   */
  maxDelayMs: number;
}

/**
 * Default retry configuration.
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Configuration options for the SlackClient.
 */
export interface SlackClientOptions {
  /**
   * Timeout in milliseconds for the Slack API request.
   * @default 30000
   */
  timeoutMs?: number;
  /**
   * Retry configuration for failed requests.
   * Set to `false` to disable retries.
   * @default DEFAULT_RETRY_CONFIG
   */
  retry?: RetryConfig | false;
}

const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Client for sending messages to Slack via Incoming Webhooks.
 *
 * @example
 * ```typescript
 * const client = new SlackClient('https://hooks.slack.com/services/...');
 * const result = await client.sendMessage('Hello, Slack!');
 * console.log(result.success); // true
 * ```
 */
export class SlackClient {
  private readonly webhookUrl: string;
  private readonly timeoutMs: number;
  private readonly retryConfig: RetryConfig | false;

  /**
   * Creates a new Slack client instance.
   *
   * @param webhookUrl - The Slack Incoming Webhook URL
   * @param options - Optional configuration options
   * @throws {Error} If webhook URL is not provided
   *
   * @example
   * ```typescript
   * // Basic usage
   * const client = new SlackClient('https://hooks.slack.com/services/...');
   *
   * // With custom timeout and retry config
   * const client = new SlackClient('https://hooks.slack.com/services/...', {
   *   timeoutMs: 10000,
   *   retry: { maxRetries: 5, baseDelayMs: 500, maxDelayMs: 5000 },
   * });
   *
   * // Disable retries
   * const client = new SlackClient('https://hooks.slack.com/services/...', {
   *   retry: false,
   * });
   * ```
   */
  constructor(webhookUrl: string, options: SlackClientOptions = {}) {
    if (!webhookUrl) {
      throw new Error('Slack webhook URL is required');
    }
    this.webhookUrl = webhookUrl;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retryConfig = options.retry ?? DEFAULT_RETRY_CONFIG;
  }

  /**
   * Determines if an error is retryable.
   *
   * Retryable errors include:
   * - Network errors (fetch failures)
   * - Timeout errors (AbortError)
   * - Server errors (5xx status codes)
   *
   * @param error - The error to check
   * @returns `true` if the error is retryable, `false` otherwise
   */
  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    // Timeout errors are retryable
    if (error.name === 'AbortError') {
      return true;
    }

    // Network errors (fetch failures) are retryable
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (error.message.includes('Status: 5')) {
      return true;
    }

    // Timeout message from our wrapper
    if (error.message.includes('timed out')) {
      return true;
    }

    return false;
  }

  /**
   * Sleeps for the specified duration.
   *
   * @param ms - Duration in milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculates the delay for the next retry attempt using exponential backoff.
   *
   * @param attempt - The current attempt number (0-indexed)
   * @param config - The retry configuration
   * @returns The delay in milliseconds
   */
  private calculateBackoffDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelayMs * 2 ** attempt;
    return Math.min(delay, config.maxDelayMs);
  }

  /**
   * Sends a text message to Slack with automatic retry on transient failures.
   *
   * Uses exponential backoff for retries. Retryable errors include:
   * - Network errors
   * - Timeout errors
   * - Server errors (5xx status codes)
   *
   * @param message - The message text to send
   * @returns Promise resolving to the send result
   * @throws {Error} If message is empty or not a string
   * @throws {Error} If the Slack API request fails after all retries
   * @throws {Error} If the request times out after all retries
   *
   * @example
   * ```typescript
   * const result = await client.sendMessage('Hello!');
   * console.log(result.success); // true
   * console.log(result.message); // 'Hello!'
   * ```
   */
  async sendMessage(message: string): Promise<SendMessageResult> {
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string');
    }

    const maxAttempts =
      this.retryConfig === false ? 1 : this.retryConfig.maxRetries + 1;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.doSendMessage(message);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if retries are disabled or error is not retryable
        if (this.retryConfig === false || !this.isRetryableError(error)) {
          throw lastError;
        }

        // Don't retry if this was the last attempt
        if (attempt === maxAttempts - 1) {
          throw lastError;
        }

        // Wait before next retry with exponential backoff
        const delay = this.calculateBackoffDelay(attempt, this.retryConfig);
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError ?? new Error('Unknown error');
  }

  /**
   * Performs the actual HTTP request to send a message to Slack.
   *
   * @param message - The message text to send
   * @returns Promise resolving to the send result
   * @throws {Error} If the request fails or times out
   */
  private async doSendMessage(message: string): Promise<SendMessageResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to send message to Slack. Status: ${response.status}`,
        );
      }

      return {
        success: true,
        message: message,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request to Slack timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
