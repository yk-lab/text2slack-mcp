import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const require = createRequire(import.meta.url);
// Path is relative to dist/src/server/mcp-server.js after compilation
const pkg = require('../../../package.json') as {
  name: string;
  version: string;
};

export function createMcpServer(): McpServer {
  return new McpServer(
    {
      name: pkg.name,
      version: pkg.version,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
}

export async function startServer(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('text2slack-mcp server running on stdio');
}
