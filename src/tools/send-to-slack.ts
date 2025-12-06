import type { SlackClient } from '../services/slack-client.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ToolResponse {
  content: TextContent[];
  isError?: boolean;
}

export interface SendToSlackArgs {
  message: string;
}

export type ToolHandler = (args: SendToSlackArgs) => Promise<ToolResponse>;

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
    (slackClient: SlackClient): ToolHandler =>
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
