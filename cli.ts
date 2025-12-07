#!/usr/bin/env node
import 'dotenv/config';
import { createMcpServer, startServer } from './src/server/mcp-server.js';
import { SlackClient } from './src/services/slack-client.js';
import { registerSendToSlackTool } from './src/tools/send-to-slack.js';

// Validate environment variable at startup
const webhookUrl = process.env.SLACK_WEBHOOK_URL;
if (!webhookUrl) {
  console.error('Error: SLACK_WEBHOOK_URL environment variable is not set');
  process.exit(1);
}

// Initialize services
const slackClient = new SlackClient(webhookUrl);

// Create server and register tools
const server = createMcpServer();
registerSendToSlackTool(server, slackClient);

// Start server
startServer(server).catch((error: unknown) => {
  console.error('Server error:', error);
  process.exit(1);
});
