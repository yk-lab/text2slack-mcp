import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import type { SlackClient } from '../services/slack-client.js';

/**
 * Zod schema for the send_to_slack tool input
 */
const SendToSlackArgsSchema = z.object({
  message: z.string().describe('The message to send to Slack'),
});

export type SendToSlackArgs = z.infer<typeof SendToSlackArgsSchema>;

/**
 * Register the send_to_slack tool with the MCP server
 */
export function registerSendToSlackTool(
  server: McpServer,
  slackClient: SlackClient,
): void {
  server.registerTool(
    'send_to_slack',
    {
      description: 'Send a text message to Slack',
      inputSchema: SendToSlackArgsSchema.shape,
    },
    async (args: SendToSlackArgs) => {
      const { message } = args;

      try {
        const result = await slackClient.sendMessage(message);

        return {
          content: [
            {
              type: 'text' as const,
              text: `Successfully posted to Slack: ${result.message}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error sending to Slack: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
