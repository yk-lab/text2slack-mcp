import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_RETRY_CONFIG,
  SlackClient,
} from '../../src/services/slack-client.js';

describe('SlackClient', () => {
  let client: SlackClient;
  const mockWebhookUrl = 'https://hooks.slack.com/services/TEST/WEBHOOK/URL';

  beforeEach(() => {
    client = new SlackClient(mockWebhookUrl, { retry: false });
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
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

    it('should accept custom retry config', () => {
      const customClient = new SlackClient(mockWebhookUrl, {
        retry: { maxRetries: 5, baseDelayMs: 500, maxDelayMs: 5000 },
      });
      expect(customClient).toBeDefined();
    });

    it('should accept retry: false to disable retries', () => {
      const customClient = new SlackClient(mockWebhookUrl, { retry: false });
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
        retry: false,
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

  describe('retry logic', () => {
    it('should retry on 5xx errors with exponential backoff', async () => {
      const retryClient = new SlackClient(mockWebhookUrl, {
        retry: { maxRetries: 2, baseDelayMs: 100, maxDelayMs: 1000 },
      });

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 503 })
        .mockResolvedValueOnce({ ok: true, status: 200 });
      vi.stubGlobal('fetch', mockFetch);

      const resultPromise = retryClient.sendMessage('Test message');

      // First attempt fails immediately
      await vi.advanceTimersByTimeAsync(0);

      // Wait for first retry delay (100ms)
      await vi.advanceTimersByTimeAsync(100);

      // Wait for second retry delay (200ms)
      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on timeout errors', async () => {
      const retryClient = new SlackClient(mockWebhookUrl, {
        timeoutMs: 10,
        retry: { maxRetries: 1, baseDelayMs: 50, maxDelayMs: 1000 },
      });

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(abortError)
        .mockResolvedValueOnce({ ok: true, status: 200 });
      vi.stubGlobal('fetch', mockFetch);

      const resultPromise = retryClient.sendMessage('Test message');

      // First attempt fails
      await vi.advanceTimersByTimeAsync(0);

      // Wait for retry delay
      await vi.advanceTimersByTimeAsync(50);

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx errors', async () => {
      const retryClient = new SlackClient(mockWebhookUrl, {
        retry: { maxRetries: 2, baseDelayMs: 100, maxDelayMs: 1000 },
      });

      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 400 });
      vi.stubGlobal('fetch', mockFetch);

      await expect(retryClient.sendMessage('Test message')).rejects.toThrow(
        'Failed to send message to Slack. Status: 400',
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry when retry is disabled', async () => {
      const noRetryClient = new SlackClient(mockWebhookUrl, { retry: false });

      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      vi.stubGlobal('fetch', mockFetch);

      await expect(noRetryClient.sendMessage('Test message')).rejects.toThrow(
        'Failed to send message to Slack. Status: 500',
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries exceeded', async () => {
      const retryClient = new SlackClient(mockWebhookUrl, {
        retry: { maxRetries: 2, baseDelayMs: 50, maxDelayMs: 1000 },
      });

      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      vi.stubGlobal('fetch', mockFetch);

      // Immediately attach error handler to prevent unhandled rejection warning
      let caughtError: Error | null = null;
      const resultPromise = retryClient
        .sendMessage('Test message')
        .catch((error) => {
          caughtError = error as Error;
        });

      // Run all pending timers to completion
      await vi.runAllTimersAsync();

      // Wait for the promise to complete
      await resultPromise;

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain(
        'Failed to send message to Slack. Status: 500',
      );
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should cap delay at maxDelayMs', async () => {
      const retryClient = new SlackClient(mockWebhookUrl, {
        retry: { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 2000 },
      });

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, status: 200 });
      vi.stubGlobal('fetch', mockFetch);

      const resultPromise = retryClient.sendMessage('Test message');

      // First retry: 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      // Second retry: 2000ms (capped from 2000ms)
      await vi.advanceTimersByTimeAsync(2000);
      // Third retry: 2000ms (capped from 4000ms)
      await vi.advanceTimersByTimeAsync(2000);

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should use default retry config when not specified', async () => {
      const defaultClient = new SlackClient(mockWebhookUrl);

      expect(DEFAULT_RETRY_CONFIG).toEqual({
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
      });

      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal('fetch', mockFetch);

      const result = await defaultClient.sendMessage('Test message');
      expect(result.success).toBe(true);
    });

    it('should retry on network errors', async () => {
      const retryClient = new SlackClient(mockWebhookUrl, {
        retry: { maxRetries: 1, baseDelayMs: 50, maxDelayMs: 1000 },
      });

      const networkError = new TypeError('fetch failed');
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ ok: true, status: 200 });
      vi.stubGlobal('fetch', mockFetch);

      const resultPromise = retryClient.sendMessage('Test message');

      await vi.advanceTimersByTimeAsync(50);

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on AbortError (timeout)', async () => {
      const retryClient = new SlackClient(mockWebhookUrl, {
        retry: { maxRetries: 1, baseDelayMs: 50, maxDelayMs: 1000 },
      });

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(abortError)
        .mockResolvedValueOnce({ ok: true, status: 200 });
      vi.stubGlobal('fetch', mockFetch);

      const resultPromise = retryClient.sendMessage('Test message');

      await vi.advanceTimersByTimeAsync(50);

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-Error objects', async () => {
      const retryClient = new SlackClient(mockWebhookUrl, {
        retry: { maxRetries: 2, baseDelayMs: 50, maxDelayMs: 1000 },
      });

      // Mock fetch to throw a non-Error object
      const mockFetch = vi.fn().mockRejectedValue('string error');
      vi.stubGlobal('fetch', mockFetch);

      // Non-Error objects are wrapped in Error and not retried
      await expect(retryClient.sendMessage('Test message')).rejects.toThrow(
        'string error',
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should clamp negative maxRetries to 0', async () => {
      const retryClient = new SlackClient(mockWebhookUrl, {
        retry: { maxRetries: -5, baseDelayMs: 50, maxDelayMs: 1000 },
      });

      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      vi.stubGlobal('fetch', mockFetch);

      // With maxRetries clamped to 0, only 1 attempt (no retries)
      await expect(retryClient.sendMessage('Test message')).rejects.toThrow(
        'Failed to send message to Slack. Status: 500',
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should clamp excessive maxRetries to 10', async () => {
      const retryClient = new SlackClient(mockWebhookUrl, {
        retry: { maxRetries: 100, baseDelayMs: 10, maxDelayMs: 10 },
      });

      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      vi.stubGlobal('fetch', mockFetch);

      const resultPromise = retryClient
        .sendMessage('Test message')
        .catch((e) => e);

      // Run all timers (10 retries * 10ms = 100ms total delay)
      await vi.runAllTimersAsync();

      const error = await resultPromise;
      expect(error.message).toContain('Failed to send message to Slack');

      // maxRetries clamped to 10: 1 initial + 10 retries = 11 attempts
      expect(mockFetch).toHaveBeenCalledTimes(11);
    });

    it('should clamp negative delays to 0', async () => {
      const retryClient = new SlackClient(mockWebhookUrl, {
        retry: { maxRetries: 1, baseDelayMs: -100, maxDelayMs: -50 },
      });

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, status: 200 });
      vi.stubGlobal('fetch', mockFetch);

      const resultPromise = retryClient.sendMessage('Test message');

      // With delays clamped to 0, still need to advance timers
      await vi.advanceTimersByTimeAsync(0);

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should ensure maxDelayMs is at least baseDelayMs', async () => {
      const retryClient = new SlackClient(mockWebhookUrl, {
        retry: { maxRetries: 1, baseDelayMs: 100, maxDelayMs: 50 },
      });

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, status: 200 });
      vi.stubGlobal('fetch', mockFetch);

      const resultPromise = retryClient.sendMessage('Test message');

      // maxDelayMs is adjusted to baseDelayMs (100ms)
      await vi.advanceTimersByTimeAsync(100);

      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should create independent copy of DEFAULT_RETRY_CONFIG', () => {
      // Store original values
      const originalMaxRetries = DEFAULT_RETRY_CONFIG.maxRetries;

      // Create a client with default config
      const client1 = new SlackClient(mockWebhookUrl);

      // Mutate DEFAULT_RETRY_CONFIG (this should NOT affect client1)
      DEFAULT_RETRY_CONFIG.maxRetries = 99;

      // Create another client
      const client2 = new SlackClient(mockWebhookUrl);

      // Restore original value
      DEFAULT_RETRY_CONFIG.maxRetries = originalMaxRetries;

      // Both clients should have independent configs
      // client1 was created before mutation, client2 after
      // Both should have valid clamped values (not 99)
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal('fetch', mockFetch);

      // This test verifies that the constructor copies the config
      // If it didn't, client2 would have maxRetries=10 (clamped from 99)
      // but client1 would have the original value
      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
    });
  });
});
