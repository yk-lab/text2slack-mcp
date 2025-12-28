import { describe, expect, it } from 'vitest';
import {
  ConfigError,
  DEFAULT_MAX_MESSAGE_LENGTH,
  MessageValidationError,
  validateMessage,
  validateWebhookUrl,
} from '../../src/utils/validation.js';

describe('validateWebhookUrl', () => {
  describe('valid URLs', () => {
    it('should accept valid Slack webhook URL', () => {
      expect(() =>
        validateWebhookUrl('https://hooks.slack.com/services/T00/B00/xxx'),
      ).not.toThrow();
    });

    it('should accept valid Discord webhook URL', () => {
      expect(() =>
        validateWebhookUrl('https://discord.com/api/webhooks/123/abc'),
      ).not.toThrow();
    });

    it('should accept valid Mattermost webhook URL', () => {
      expect(() =>
        validateWebhookUrl('https://mattermost.example.com/hooks/xxx'),
      ).not.toThrow();
    });

    it('should accept any HTTPS URL (no domain restriction)', () => {
      expect(() =>
        validateWebhookUrl(
          'https://custom-service.internal.company.com/webhook',
        ),
      ).not.toThrow();
    });
  });

  describe('empty URL', () => {
    it('should throw ConfigError for empty string', () => {
      expect(() => validateWebhookUrl('')).toThrow(ConfigError);
      expect(() => validateWebhookUrl('')).toThrow('Webhook URL is required');
    });

    it('should throw ConfigError for undefined', () => {
      // @ts-expect-error Testing invalid input
      expect(() => validateWebhookUrl(undefined)).toThrow(ConfigError);
    });

    it('should throw ConfigError for null', () => {
      // @ts-expect-error Testing invalid input
      expect(() => validateWebhookUrl(null)).toThrow(ConfigError);
    });
  });

  describe('invalid URL format', () => {
    it('should throw ConfigError for non-URL string', () => {
      expect(() => validateWebhookUrl('not-a-url')).toThrow(ConfigError);
      expect(() => validateWebhookUrl('not-a-url')).toThrow(
        'Webhook URL is not a valid URL',
      );
    });

    it('should throw ConfigError for malformed URL', () => {
      expect(() => validateWebhookUrl('http://')).toThrow(ConfigError);
    });

    it('should throw ConfigError for URL without protocol', () => {
      expect(() => validateWebhookUrl('hooks.slack.com/services/xxx')).toThrow(
        ConfigError,
      );
    });
  });

  describe('protocol validation', () => {
    it('should throw ConfigError for HTTP URL (non-localhost)', () => {
      expect(() =>
        validateWebhookUrl('http://hooks.slack.com/services/xxx'),
      ).toThrow(ConfigError);
      expect(() =>
        validateWebhookUrl('http://hooks.slack.com/services/xxx'),
      ).toThrow('Webhook URL must use HTTPS');
    });

    it('should allow HTTP for localhost (development)', () => {
      expect(() =>
        validateWebhookUrl('http://localhost:3000/webhook'),
      ).not.toThrow();
    });

    it('should allow HTTP for 127.0.0.1 (development)', () => {
      expect(() =>
        validateWebhookUrl('http://127.0.0.1:8080/webhook'),
      ).not.toThrow();
    });

    it('should allow HTTP for IPv6 localhost [::1] (development)', () => {
      expect(() =>
        validateWebhookUrl('http://[::1]:8080/webhook'),
      ).not.toThrow();
    });

    it('should throw ConfigError for FTP URL', () => {
      expect(() => validateWebhookUrl('ftp://example.com/file')).toThrow(
        ConfigError,
      );
      expect(() => validateWebhookUrl('ftp://example.com/file')).toThrow(
        'Webhook URL must use HTTPS',
      );
    });

    it('should throw ConfigError for file URL', () => {
      expect(() => validateWebhookUrl('file:///etc/passwd')).toThrow(
        ConfigError,
      );
    });
  });

  describe('ConfigError properties', () => {
    it('should have correct error name', () => {
      try {
        validateWebhookUrl('');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigError);
        expect((error as ConfigError).name).toBe('ConfigError');
      }
    });
  });
});

describe('validateMessage', () => {
  describe('valid messages', () => {
    it('should accept non-empty string', () => {
      expect(() => validateMessage('Hello, world!')).not.toThrow();
    });

    it('should accept message at exactly max length', () => {
      const message = 'x'.repeat(DEFAULT_MAX_MESSAGE_LENGTH);
      expect(() => validateMessage(message)).not.toThrow();
    });

    it('should accept message with custom max length', () => {
      const message = 'x'.repeat(100);
      expect(() => validateMessage(message, 100)).not.toThrow();
    });

    it('should accept whitespace-only message', () => {
      // Whitespace is technically a non-empty string
      expect(() => validateMessage('   ')).not.toThrow();
    });
  });

  describe('empty message', () => {
    it('should throw MessageValidationError for empty string', () => {
      expect(() => validateMessage('')).toThrow(MessageValidationError);
      expect(() => validateMessage('')).toThrow(
        'Message must be a non-empty string',
      );
    });

    it('should throw MessageValidationError for undefined', () => {
      // @ts-expect-error Testing invalid input
      expect(() => validateMessage(undefined)).toThrow(MessageValidationError);
    });

    it('should throw MessageValidationError for null', () => {
      // @ts-expect-error Testing invalid input
      expect(() => validateMessage(null)).toThrow(MessageValidationError);
    });

    it('should throw MessageValidationError for non-string types', () => {
      // @ts-expect-error Testing invalid input
      expect(() => validateMessage(123)).toThrow(MessageValidationError);
      // @ts-expect-error Testing invalid input
      expect(() => validateMessage({})).toThrow(MessageValidationError);
      // @ts-expect-error Testing invalid input
      expect(() => validateMessage([])).toThrow(MessageValidationError);
    });
  });

  describe('message length validation', () => {
    it('should throw MessageValidationError for message exceeding default max length', () => {
      const message = 'x'.repeat(DEFAULT_MAX_MESSAGE_LENGTH + 1);
      expect(() => validateMessage(message)).toThrow(MessageValidationError);
      expect(() => validateMessage(message)).toThrow(
        `Message exceeds maximum length of ${DEFAULT_MAX_MESSAGE_LENGTH} characters`,
      );
    });

    it('should include actual message length in error', () => {
      const length = DEFAULT_MAX_MESSAGE_LENGTH + 100;
      const message = 'x'.repeat(length);
      expect(() => validateMessage(message)).toThrow(`got ${length}`);
    });

    it('should respect custom max length (Discord limit)', () => {
      const discordLimit = 2000;
      const message = 'x'.repeat(2001);
      expect(() => validateMessage(message, discordLimit)).toThrow(
        MessageValidationError,
      );
      expect(() => validateMessage(message, discordLimit)).toThrow(
        `Message exceeds maximum length of ${discordLimit} characters`,
      );
    });

    it('should accept message just under max length', () => {
      const message = 'x'.repeat(DEFAULT_MAX_MESSAGE_LENGTH - 1);
      expect(() => validateMessage(message)).not.toThrow();
    });
  });

  describe('MessageValidationError properties', () => {
    it('should have correct error name', () => {
      try {
        validateMessage('');
      } catch (error) {
        expect(error).toBeInstanceOf(MessageValidationError);
        expect((error as MessageValidationError).name).toBe(
          'MessageValidationError',
        );
      }
    });
  });
});

describe('DEFAULT_MAX_MESSAGE_LENGTH', () => {
  it('should be 4000 (Slack limit)', () => {
    expect(DEFAULT_MAX_MESSAGE_LENGTH).toBe(4000);
  });
});
