import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import type { SlackClient } from '../services/slack-client.js';

/**
 * Zod schema for the send_to_slack tool input.
 * Used for validating tool arguments in the MCP protocol.
 */
const SendToSlackArgsSchema = z.object({
  message: z.string().describe('The message to send to Slack'),
});

/**
 * Type definition for the send_to_slack tool arguments.
 * Inferred from the Zod schema.
 */
export type SendToSlackArgs = z.infer<typeof SendToSlackArgsSchema>;

/**
 * Registers the `send_to_slack` tool with the MCP server.
 *
 * This tool allows AI assistants to send text messages to a configured
 * Slack channel via Incoming Webhooks.
 *
 * @param server - The MCP server instance to register the tool with
 * @param slackClient - The Slack client instance for sending messages
 *
 * @example
 * ```typescript
 * import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
 * import { SlackClient } from '../services/slack-client.js';
 *
 * const server = new McpServer({ name: 'my-server', version: '1.0.0' });
 * const slackClient = new SlackClient('https://hooks.slack.com/...');
 *
 * registerSendToSlackTool(server, slackClient);
 * ```
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
