import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SlackClient } from '../../src/services/slack-client.js';
import { registerSendToSlackTool } from '../../src/tools/send-to-slack.js';

describe('registerSendToSlackTool', () => {
  let mockSlackClient: { sendMessage: ReturnType<typeof vi.fn> };
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockSlackClient = {
      sendMessage: vi.fn(),
    };
    mockServer = {
      registerTool: vi.fn(),
    };
  });

  describe('registration', () => {
    it('should register tool with correct metadata', () => {
      registerSendToSlackTool(
        mockServer as unknown as McpServer,
        mockSlackClient as unknown as SlackClient,
      );

      expect(mockServer.registerTool).toHaveBeenCalledTimes(1);
      const [name, config] = mockServer.registerTool.mock.calls[0];
      expect(name).toBe('send_to_slack');
      expect(config.description).toBe('Send a text message to Slack');
      expect(config.inputSchema).toBeDefined();
      // inputSchema is now ZodRawShape (schema.shape)
      expect(config.inputSchema.message).toBeDefined();
    });
  });

  describe('handler', () => {
    it('should send message successfully', async () => {
      const testMessage = 'Hello, Slack!';
      mockSlackClient.sendMessage.mockResolvedValue({
        success: true,
        message: testMessage,
      });

      registerSendToSlackTool(
        mockServer as unknown as McpServer,
        mockSlackClient as unknown as SlackClient,
      );

      const handler = mockServer.registerTool.mock.calls[0][2];
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

      registerSendToSlackTool(
        mockServer as unknown as McpServer,
        mockSlackClient as unknown as SlackClient,
      );

      const handler = mockServer.registerTool.mock.calls[0][2];
      const result = await handler({ message: 'Test message' });

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe(
        `Error sending to Slack: ${errorMessage}`,
      );
    });

    it('should handle non-Error exceptions', async () => {
      const nonErrorObject = { type: 'CustomError', message: 'String error' };
      mockSlackClient.sendMessage.mockRejectedValue(nonErrorObject);

      registerSendToSlackTool(
        mockServer as unknown as McpServer,
        mockSlackClient as unknown as SlackClient,
      );

      const handler = mockServer.registerTool.mock.calls[0][2];
      const result = await handler({ message: 'Test message' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe(
        'Error sending to Slack: Unknown error',
      );
    });
  });
});
