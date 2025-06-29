import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';
import { sendToSlackTool } from '../../src/tools/send-to-slack.js';

describe('sendToSlackTool', () => {
  let mockSlackClient;
  let handler;

  beforeEach(() => {
    mockSlackClient = {
      sendMessage: mock.fn(),
    };
    handler = sendToSlackTool.handler(mockSlackClient);
  });

  describe('definition', () => {
    it('should have correct tool metadata', () => {
      assert.strictEqual(sendToSlackTool.definition.name, 'send_to_slack');
      assert.strictEqual(
        sendToSlackTool.definition.description,
        'Send a text message to Slack',
      );
      assert.strictEqual(sendToSlackTool.definition.inputSchema.type, 'object');
      assert.deepStrictEqual(sendToSlackTool.definition.inputSchema.required, [
        'message',
      ]);
    });
  });

  describe('handler', () => {
    it('should send message successfully', async () => {
      const testMessage = 'Hello, Slack!';
      mockSlackClient.sendMessage.mock.mockImplementation(async () => ({
        success: true,
        message: testMessage,
      }));

      const result = await handler({ message: testMessage });

      assert.strictEqual(mockSlackClient.sendMessage.mock.calls.length, 1);
      assert.strictEqual(
        mockSlackClient.sendMessage.mock.calls[0].arguments[0],
        testMessage,
      );
      assert.strictEqual(result.isError, undefined);
      assert.strictEqual(result.content[0].type, 'text');
      assert.strictEqual(
        result.content[0].text,
        `Successfully posted to Slack: ${testMessage}`,
      );
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Network error';
      mockSlackClient.sendMessage.mock.mockImplementation(async () => {
        throw new Error(errorMessage);
      });

      const result = await handler({ message: 'Test message' });

      assert.strictEqual(result.isError, true);
      assert.strictEqual(result.content[0].type, 'text');
      assert.strictEqual(
        result.content[0].text,
        `Error sending to Slack: ${errorMessage}`,
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockSlackClient.sendMessage.mock.mockImplementation(async () => {
        // Simulate a non-Error object being thrown
        const nonErrorObject = { type: 'CustomError', message: 'String error' };
        throw nonErrorObject;
      });

      const result = await handler({ message: 'Test message' });

      assert.strictEqual(result.isError, true);
      assert.strictEqual(
        result.content[0].text,
        'Error sending to Slack: Unknown error',
      );
    });
  });
});
