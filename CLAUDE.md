# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a MCP (Model Context Protocol) server that enables AI assistants to send text messages to Slack via webhooks. It's implemented as a Node.js application using the MCP SDK v1.0.0.

## Commands

```bash
# Install dependencies (pnpm is configured as package manager)
pnpm install

# Start the MCP server
npm start
# or
node cli.js

# Run as global CLI tool (after npm link)
text2slack-mcp
```

## Architecture

The application (`cli.js`) implements an MCP server that:
1. Runs as a stdio-based server (communicates via standard input/output)
2. Exposes a single tool called `send_to_slack`
3. Accepts a message parameter and sends it to Slack via webhook
4. Returns success/error status to the MCP client

## Configuration

The application requires one environment variable:
- `SLACK_WEBHOOK_URL`: The Slack incoming webhook URL

For local development, create a `.env` file:
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

For MCP client usage (e.g., Claude Desktop), the webhook URL is passed via the client configuration.

## Key Technical Details

- Uses ES modules (type: "module" in package.json)
- Package manager: pnpm (v10.12.3)
- No TypeScript, build process, or bundling required
- No authentication beyond Slack webhook security
- Dependencies: @modelcontextprotocol/sdk (v1.0.0), dotenv
- MCP SDK API: Uses Server class with schema-based request handlers

## MCP Tool

**Tool: send_to_slack**
- Input: `{ "message": "Your text to send to Slack" }`
- Success: Returns confirmation message
- Error: Returns error details if webhook fails

## File Structure

- `cli.js` - Main MCP server implementation (updated to use MCP SDK v1.0.0 API)
- `mcp.json` - MCP manifest file
- `.mcp.json` - Local MCP configuration with webhook URL
- `package.json` - Node.js project configuration
- `README.md` - User documentation
- `USER_TASKS.md` - Publishing and setup instructions
- `.gitignore` - Git ignore patterns

## Recent Updates

- Updated cli.js to use the new MCP SDK v1.0.0 API (Server class instead of McpServer)
- Fixed request handler registration to use schema objects (ListToolsRequestSchema, CallToolRequestSchema)
- Added server capabilities configuration for tools support