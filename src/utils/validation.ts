/**
 * Validation utilities for webhook URLs and messages.
 * @module
 */

/**
 * Error thrown when configuration validation fails.
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Error thrown when message validation fails.
 */
export class MessageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MessageValidationError';
  }
}

/**
 * Default maximum message length (Slack's limit).
 */
export const DEFAULT_MAX_MESSAGE_LENGTH = 4000;

/**
 * Checks if a hostname is a localhost address.
 * Supports both IPv4 (127.0.0.1) and IPv6 (::1) loopback addresses.
 *
 * @param hostname - The hostname to check
 * @returns `true` if the hostname is localhost, `false` otherwise
 */
function isLocalhostAddress(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

/**
 * Validates a webhook URL for format and security requirements.
 *
 * Requirements:
 * - Must be a valid URL (parseable by URL constructor)
 * - Must use HTTPS protocol (HTTP allowed only for localhost/127.0.0.1)
 * - No domain restrictions (supports Slack, Discord, Mattermost, etc.)
 *
 * @param url - The webhook URL to validate
 * @throws {ConfigError} If the URL is empty, invalid, or uses non-HTTPS protocol
 *
 * @example
 * ```typescript
 * // Valid URLs
 * validateWebhookUrl('https://hooks.slack.com/services/...');
 * validateWebhookUrl('https://discord.com/api/webhooks/...');
 * validateWebhookUrl('https://mattermost.example.com/hooks/...');
 * validateWebhookUrl('http://localhost:3000/webhook');  // OK for local dev
 *
 * // Invalid URLs throw ConfigError
 * validateWebhookUrl('');  // 'Webhook URL is required'
 * validateWebhookUrl('not-a-url');  // 'Webhook URL is not a valid URL'
 * validateWebhookUrl('http://example.com');  // 'Webhook URL must use HTTPS'
 * ```
 */
export function validateWebhookUrl(url: string): void {
  if (!url) {
    throw new ConfigError('Webhook URL is required');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ConfigError(
      'Webhook URL is not a valid URL. Expected format: https://hooks.example.com/...',
    );
  }

  // Allow HTTP only for localhost (development/testing)
  if (parsedUrl.protocol !== 'https:') {
    if (
      parsedUrl.protocol === 'http:' &&
      isLocalhostAddress(parsedUrl.hostname)
    ) {
      // HTTP is allowed for localhost development
      return;
    }
    throw new ConfigError(
      'Webhook URL must use HTTPS for security. HTTP is not allowed.',
    );
  }
}

/**
 * Validates a message for content and length requirements.
 *
 * @param message - The message to validate
 * @param maxLength - Maximum allowed message length (default: 4000 for Slack)
 * @throws {MessageValidationError} If the message is empty or exceeds the maximum length
 *
 * @example
 * ```typescript
 * validateMessage('Hello, world!');  // OK
 * validateMessage('');  // throws 'Message must be a non-empty string'
 * validateMessage('x'.repeat(5000));  // throws 'Message exceeds maximum length...'
 * validateMessage('Hello', 10);  // OK with custom max length
 * ```
 */
export function validateMessage(
  message: string,
  maxLength: number = DEFAULT_MAX_MESSAGE_LENGTH,
): void {
  if (!message || typeof message !== 'string') {
    throw new MessageValidationError('Message must be a non-empty string');
  }

  if (message.length > maxLength) {
    throw new MessageValidationError(
      `Message exceeds maximum length of ${maxLength} characters (got ${message.length})`,
    );
  }
}
