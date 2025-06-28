import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { SlackClient } from '../../src/services/slack-client.js';

describe('SlackClient', () => {
  let client;
  const mockWebhookUrl = 'https://hooks.slack.com/services/TEST/WEBHOOK/URL';

  beforeEach(() => {
    client = new SlackClient(mockWebhookUrl);
  });

  describe('constructor', () => {
    it('should throw error if webhook URL is not provided', () => {
      assert.throws(() => new SlackClient(), {
        message: 'Slack webhook URL is required',
      });
    });

    it('should create instance with valid webhook URL', () => {
      assert.strictEqual(client.webhookUrl, mockWebhookUrl);
    });
  });

  describe('sendMessage', () => {
    it('should throw error if message is empty', async () => {
      await assert.rejects(async () => await client.sendMessage(''), {
        message: 'Message must be a non-empty string',
      });
    });

    it('should throw error if message is not a string', async () => {
      await assert.rejects(async () => await client.sendMessage(123), {
        message: 'Message must be a non-empty string',
      });
    });

    it('should send message successfully', async () => {
      // Mock fetch
      const originalFetch = global.fetch;
      global.fetch = mock.fn(async () => ({
        ok: true,
        status: 200,
      }));

      const result = await client.sendMessage('Test message');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.message, 'Test message');
      assert.strictEqual(global.fetch.mock.calls.length, 1);

      const [url, options] = global.fetch.mock.calls[0].arguments;
      assert.strictEqual(url, mockWebhookUrl);
      assert.strictEqual(options.method, 'POST');
      assert.deepStrictEqual(JSON.parse(options.body), {
        text: 'Test message',
      });

      // Restore fetch
      global.fetch = originalFetch;
    });

    it('should throw error on failed request', async () => {
      // Mock fetch
      const originalFetch = global.fetch;
      global.fetch = mock.fn(async () => ({
        ok: false,
        status: 404,
      }));

      await assert.rejects(
        async () => await client.sendMessage('Test message'),
        { message: 'Failed to send message to Slack. Status: 404' },
      );

      // Restore fetch
      global.fetch = originalFetch;
    });
  });
});
