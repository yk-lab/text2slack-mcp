# text2slack-mcp

[![npm version](https://badge.fury.io/js/text2slack-mcp.svg)](https://www.npmjs.com/package/text2slack-mcp)
[![CI](https://github.com/yk-lab/text2slack-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/yk-lab/text2slack-mcp/actions/workflows/ci.yml)
[![Maintainability](https://qlty.sh/badges/29fc7f29-79ba-420f-965b-6db0693cc186/maintainability.svg)](https://qlty.sh/gh/yk-lab/projects/text2slack-mcp)
[![Code Coverage](https://qlty.sh/badges/29fc7f29-79ba-420f-965b-6db0693cc186/test_coverage.svg)](https://qlty.sh/gh/yk-lab/projects/text2slack-mcp)
[![codecov](https://codecov.io/gh/yk-lab/text2slack-mcp/graph/badge.svg?token=9zuSClrRCg)](https://codecov.io/gh/yk-lab/text2slack-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-v1.0.0-blue.svg)](https://modelcontextprotocol.io)

[日本語](README.md) | English

An MCP (Model Context Protocol) server that enables sending text messages to Slack.

## Overview

text2slack-mcp is an MCP server that allows AI assistants (like Claude) to send messages to Slack channels.
It uses Slack's Incoming Webhooks to deliver messages.

## Features

- 🚀 Simple and lightweight MCP server implementation
- 🔒 Secure token-less npm publishing with OIDC
- ✅ 100% test coverage
- 📊 Continuous code quality monitoring (Qlty, Codecov)
- 🛡️ Security scanning (CodeQL, Dependabot)

## Requirements

- Node.js 20 or later
- Slack workspace admin privileges (for setting up Incoming Webhooks)
- MCP-compatible client (Claude Desktop, Claude Code, etc.)

## Installation

```bash
npm install -g text2slack-mcp
```

## Setup

### 1. Configure Slack Incoming Webhook

1. Open "Apps" in your Slack workspace admin panel
2. Search for and add "Incoming Webhooks"
3. Select the channel where you want to send messages
4. Copy the Webhook URL (format: `https://hooks.slack.com/services/...`)

### 2. Configure MCP Client

Add the following to your Claude Desktop or other MCP-compatible client configuration:

```json
{
  "mcpServers": {
    "text2slack": {
      "command": "npx",
      "args": ["-y", "text2slack-mcp@latest"],
      "env": {
        "SLACK_WEBHOOK_URL": "YOUR_SLACK_WEBHOOK_URL_HERE"
      }
    }
  }
}
```

For Claude Code:

```shell
claude mcp add text2slack -e SLACK_WEBHOOK_URL="YOUR_SLACK_WEBHOOK_URL_HERE" npx -- -y text2slack-mcp@latest
```

Replace `YOUR_SLACK_WEBHOOK_URL_HERE` with your actual Webhook URL.

## Usage

From your MCP client (like Claude), you can use the `send_to_slack` tool to send messages:

- Tool name: `send_to_slack`
- Parameters:
  - `message` (string, required): Message to send to Slack

### Example

In Claude, you can use it like this:

```plain
Ask Claude to "Send today's meeting notes to Slack"
and Claude will automatically use the send_to_slack tool to deliver the message.
```

## Local Development

```bash
# Clone the repository
git clone https://github.com/yk-lab/text2slack-mcp.git
cd text2slack-mcp

# Install dependencies (using pnpm recommended)
pnpm install

# Set environment variables
echo "SLACK_WEBHOOK_URL=your_webhook_url_here" > .env

# Start the server
pnpm start
```

### Running Tests

```bash
# Run unit and integration tests
pnpm test

# Run with coverage report
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### Code Quality

```bash
# Lint check
pnpm lint

# Auto-fix lint issues
pnpm lint:fix
```

## Troubleshooting

### Error: SLACK_WEBHOOK_URL environment variable is not set

The `SLACK_WEBHOOK_URL` environment variable is not configured. Please check your MCP client settings.

### Error: Failed to send message to Slack

- Verify that your Webhook URL is correct
- Check if the app is enabled in your Slack workspace
- Verify your network connection

## Project Structure

```plain
text2slack-mcp/
├── src/
│   ├── services/      # Business logic
│   │   └── slack-client.js
│   ├── tools/         # MCP tool definitions
│   │   └── send-to-slack.js
│   └── server/        # MCP server implementation
│       └── mcp-server.js
├── test/
│   ├── services/      # Unit tests
│   ├── tools/         # Unit tests
│   └── integration/   # Integration tests
└── cli.js            # Entry point
```

## Contributing

Pull requests are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Security

If you discover a security issue, please follow the instructions in [SECURITY.md](.github/SECURITY.md) to report it.

## License

MIT License - See [LICENSE](LICENSE) for details.
