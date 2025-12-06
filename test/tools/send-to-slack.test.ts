import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SlackClient } from '../../src/services/slack-client.js';
import type { SendToSlackArgs } from '../../src/tools/send-to-slack.js';
import { sendToSlackTool } from '../../src/tools/send-to-slack.js';
import type { ToolHandler } from '../../src/types/index.js';

describe('sendToSlackTool', () => {
  let mockSlackClient: { sendMessage: ReturnType<typeof vi.fn> };
  let handler: ToolHandler<SendToSlackArgs>;

  beforeEach(() => {
    mockSlackClient = {
      sendMessage: vi.fn(),
    };
    handler = sendToSlackTool.handler(
      mockSlackClient as unknown as SlackClient,
    );
  });

  describe('definition', () => {
    it('should have correct tool metadata', () => {
      expect(sendToSlackTool.definition.name).toBe('send_to_slack');
      expect(sendToSlackTool.definition.description).toBe(
        'Send a text message to Slack',
      );
      expect(sendToSlackTool.definition.inputSchema.type).toBe('object');
      expect(sendToSlackTool.definition.inputSchema.required).toEqual([
        'message',
      ]);
    });
  });

  describe('handler', () => {
    it('should send message successfully', async () => {
      const testMessage = 'Hello, Slack!';
      mockSlackClient.sendMessage.mockResolvedValue({
        success: true,
        message: testMessage,
      });

      const result = await handler({ message: testMessage });

      expect(mockSlackClient.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockSlackClient.sendMessage).toHaveBeenCalledWith(testMessage);
      expect(result.isError).toBeUndefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe(
        `Successfully posted to Slack: ${testMessage}`,
      );
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Network error';
      mockSlackClient.sendMessage.mockRejectedValue(new Error(errorMessage));

      const result = await handler({ message: 'Test message' });

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe(
        `Error sending to Slack: ${errorMessage}`,
      );
    });

    it('should handle non-Error exceptions', async () => {
      // Simulate a non-Error object being thrown
      const nonErrorObject = { type: 'CustomError', message: 'String error' };
      mockSlackClient.sendMessage.mockRejectedValue(nonErrorObject);

      const result = await handler({ message: 'Test message' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe(
        'Error sending to Slack: Unknown error',
      );
    });
  });
});
