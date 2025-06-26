#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import 'dotenv/config';

// Validate environment variable at startup
const webhookUrl = process.env.SLACK_WEBHOOK_URL;
if (!webhookUrl) {
  console.error('Error: SLACK_WEBHOOK_URL environment variable is not set');
  process.exit(1);
}

// Create MCP server
const server = new Server({
  name: 'text2slack-mcp',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

// Register the send_to_slack tool
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'send_to_slack',
      description: 'Send a text message to Slack',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The message to send to Slack'
          }
        },
        required: ['message']
      }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'send_to_slack') {
    const { message } = args;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });

      if (!response.ok) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to send message to Slack. Status: ${response.status}`
            }
          ],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `Successfully posted to Slack: ${message}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error sending to Slack: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `Unknown tool: ${name}`
      }
    ],
    isError: true
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('text2slack-mcp server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});