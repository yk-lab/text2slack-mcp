#!/usr/bin/env node
import 'dotenv/config';
import { createMcpServer, startServer } from './src/server/mcp-server.js';
import { SlackClient } from './src/services/slack-client.js';
import { registerSendToSlackTool } from './src/tools/send-to-slack.js';
import { ConfigError, validateWebhookUrl } from './src/utils/validation.js';

// Validate environment variable at startup
const webhookUrl = process.env.SLACK_WEBHOOK_URL;
if (!webhookUrl) {
  console.error('Error: SLACK_WEBHOOK_URL environment variable is not set');
  console.error('');
  console.error('Please set the webhook URL for your messaging service:');
  console.error('  - Slack: https://hooks.slack.com/services/...');
  console.error('  - Discord: https://discord.com/api/webhooks/...');
  console.error('  - Mattermost: https://your-server.com/hooks/...');
  process.exit(1);
}

// Validate webhook URL format
try {
  validateWebhookUrl(webhookUrl);
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error('Error: Invalid webhook URL configuration', error);
  }
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
