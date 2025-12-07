import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SlackClient } from '../../src/services/slack-client.js';

describe('SlackClient', () => {
  let client: SlackClient;
  const mockWebhookUrl = 'https://hooks.slack.com/services/TEST/WEBHOOK/URL';

  beforeEach(() => {
    client = new SlackClient(mockWebhookUrl);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('constructor', () => {
    it('should throw error if webhook URL is not provided', () => {
      // @ts-expect-error Testing invalid input
      expect(() => new SlackClient()).toThrow('Slack webhook URL is required');
    });

    it('should create instance with valid webhook URL', () => {
      expect(client).toBeDefined();
    });

    it('should accept custom timeout option', () => {
      const customClient = new SlackClient(mockWebhookUrl, { timeoutMs: 5000 });
      expect(customClient).toBeDefined();
    });
  });

  describe('sendMessage', () => {
    it('should throw error if message is empty', async () => {
      await expect(client.sendMessage('')).rejects.toThrow(
        'Message must be a non-empty string',
      );
    });

    it('should throw error if message is not a string', async () => {
      // @ts-expect-error Testing invalid input
      await expect(client.sendMessage(123)).rejects.toThrow(
        'Message must be a non-empty string',
      );
    });

    it('should send message successfully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await client.sendMessage('Test message');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Test message');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(mockWebhookUrl);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ text: 'Test message' });
    });

    it('should throw error on failed request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(client.sendMessage('Test message')).rejects.toThrow(
        'Failed to send message to Slack. Status: 404',
      );
    });

    it('should include AbortSignal in fetch call', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });
      vi.stubGlobal('fetch', mockFetch);

      await client.sendMessage('Test message');

      const [, options] = mockFetch.mock.calls[0];
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    it('should throw timeout error when request times out', async () => {
      const clientWithShortTimeout = new SlackClient(mockWebhookUrl, {
        timeoutMs: 10,
      });

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      const mockFetch = vi.fn().mockRejectedValue(abortError);
      vi.stubGlobal('fetch', mockFetch);

      await expect(
        clientWithShortTimeout.sendMessage('Test message'),
      ).rejects.toThrow('Request to Slack timed out after 10ms');
    });

    it('should rethrow non-abort errors', async () => {
      const networkError = new Error('Network failure');
      const mockFetch = vi.fn().mockRejectedValue(networkError);
      vi.stubGlobal('fetch', mockFetch);

      await expect(client.sendMessage('Test message')).rejects.toThrow(
        'Network failure',
      );
    });
  });
});
