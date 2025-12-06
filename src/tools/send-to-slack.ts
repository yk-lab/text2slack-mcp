import type { SlackClient } from '../services/slack-client.js';
import type {
  ToolDefinition,
  ToolHandler,
  ToolResponse,
} from '../types/index.js';

/**
 * Arguments for the send_to_slack tool
 */
export interface SendToSlackArgs {
  message: string;
}

export const sendToSlackTool = {
  definition: {
    name: 'send_to_slack',
    description: 'Send a text message to Slack',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message to send to Slack',
        },
      },
      required: ['message'],
    },
  } as ToolDefinition,

  handler:
    (slackClient: SlackClient): ToolHandler<SendToSlackArgs> =>
    async (args: SendToSlackArgs): Promise<ToolResponse> => {
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
};
