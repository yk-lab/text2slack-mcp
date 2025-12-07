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
 * Configuration options for the SlackClient.
 */
export interface SlackClientOptions {
  /**
   * Timeout in milliseconds for the Slack API request.
   * @default 30000
   */
  timeoutMs?: number;
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
   * // With custom timeout
   * const client = new SlackClient('https://hooks.slack.com/services/...', {
   *   timeoutMs: 10000,
   * });
   * ```
   */
  constructor(webhookUrl: string, options: SlackClientOptions = {}) {
    if (!webhookUrl) {
      throw new Error('Slack webhook URL is required');
    }
    this.webhookUrl = webhookUrl;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Sends a text message to Slack.
   *
   * @param message - The message text to send
   * @returns Promise resolving to the send result
   * @throws {Error} If message is empty or not a string
   * @throws {Error} If the Slack API request fails
   * @throws {Error} If the request times out
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
