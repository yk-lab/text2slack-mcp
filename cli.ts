#!/usr/bin/env node
import 'dotenv/config';
import { MCPServer } from './src/server/mcp-server.js';
import { SlackClient } from './src/services/slack-client.js';
import { sendToSlackTool } from './src/tools/send-to-slack.js';

// Validate environment variable at startup
const webhookUrl = process.env.SLACK_WEBHOOK_URL;
if (!webhookUrl) {
  console.error('Error: SLACK_WEBHOOK_URL environment variable is not set');
  process.exit(1);
}

// Initialize services
const slackClient = new SlackClient(webhookUrl);

// Configure tools with dependencies
const tools = [
  {
    definition: sendToSlackTool.definition,
    handler: sendToSlackTool.handler(slackClient),
  },
];

// Create and start server
async function main(): Promise<void> {
  const server = new MCPServer(tools);
  await server.start();
}

main().catch((error: unknown) => {
  console.error('Server error:', error);
  process.exit(1);
});
