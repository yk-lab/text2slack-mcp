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

/**
 * Gracefully shutdown the MCP server
 */
export async function shutdownServer(server: McpServer): Promise<void> {
  console.error('Shutting down MCP server...');
  try {
    await server.close();
    console.error('MCP server shut down successfully');
  } catch (error) {
    console.error('Error during server shutdown:', error);
    throw error;
  }
}

/**
 * Setup signal handlers for graceful shutdown
 */
export function setupSignalHandlers(
  server: McpServer,
  onShutdown?: () => void,
): void {
  let isShuttingDown = false;

  const handleSignal = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      console.error(`Received ${signal} during shutdown, forcing exit...`);
      process.exit(1);
    }

    isShuttingDown = true;
    console.error(`Received ${signal}, initiating graceful shutdown...`);

    try {
      await shutdownServer(server);
      onShutdown?.();
      process.exit(0);
    } catch {
      console.error('Failed to shutdown gracefully');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => {
    void handleSignal('SIGINT');
  });
  process.on('SIGTERM', () => {
    void handleSignal('SIGTERM');
  });
}

/**
 * Start the MCP server with signal handling and error recovery
 */
export async function startServer(server: McpServer): Promise<void> {
  // Setup signal handlers before starting
  setupSignalHandlers(server);

  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('text2slack-mcp server running on stdio');
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    try {
      await shutdownServer(server);
    } catch {
      // Ignore shutdown errors during startup failure
    }
    throw error;
  }
}
