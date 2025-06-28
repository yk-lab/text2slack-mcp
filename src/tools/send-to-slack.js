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
  },

  handler: (slackClient) => async (args) => {
    const { message } = args;

    try {
      const result = await slackClient.sendMessage(message);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully posted to Slack: ${result.message}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error sending to Slack: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
