import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const require = createRequire(import.meta.url);
// Path is relative to dist/src/server/mcp-server.js after compilation
const pkg = require('../../../package.json') as {
  name: string;
  version: string;
};

/**
 * Creates a new MCP server instance configured for text2slack.
 *
 * The server is initialized with the package name and version from package.json,
 * and configured with tools capability.
 *
 * @returns A new McpServer instance ready for tool registration
 *
 * @example
 * ```typescript
 * const server = createMcpServer();
 * registerSendToSlackTool(server, slackClient);
 * await startServer(server);
 * ```
 */
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
 * Gracefully shuts down the MCP server.
 *
 * Closes the server connection and logs the shutdown status.
 * If an error occurs during shutdown, it is logged and re-thrown.
 *
 * @param server - The MCP server instance to shut down
 * @throws {Error} If the server fails to close properly
 *
 * @example
 * ```typescript
 * try {
 *   await shutdownServer(server);
 * } catch (error) {
 *   console.error('Shutdown failed:', error);
 * }
 * ```
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

let signalHandlersRegistered = false;

/**
 * Reset signal handlers registration state (for testing purposes only)
 * @internal
 */
export function _resetSignalHandlersForTesting(): void {
  signalHandlersRegistered = false;
}

/**
 * Sets up signal handlers for graceful shutdown.
 *
 * Registers handlers for SIGINT and SIGTERM signals to gracefully
 * shut down the server. If a second signal is received during shutdown,
 * the process exits immediately with code 1.
 *
 * This function is idempotent - calling it multiple times will only
 * register the handlers once.
 *
 * @param server - The MCP server instance to manage
 * @param onShutdown - Optional callback executed after successful shutdown
 *
 * @example
 * ```typescript
 * setupSignalHandlers(server, () => {
 *   console.log('Cleanup complete');
 * });
 * ```
 */
export function setupSignalHandlers(
  server: McpServer,
  onShutdown?: () => void,
): void {
  if (signalHandlersRegistered) {
    return;
  }
  signalHandlersRegistered = true;

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
 * Starts the MCP server with signal handling and error recovery.
 *
 * This function:
 * 1. Sets up SIGINT/SIGTERM signal handlers for graceful shutdown
 * 2. Creates a stdio transport and connects the server
 * 3. Handles startup errors by attempting cleanup before re-throwing
 *
 * @param server - The MCP server instance to start
 * @throws {Error} If the server fails to start or connect
 *
 * @example
 * ```typescript
 * const server = createMcpServer();
 * registerSendToSlackTool(server, slackClient);
 *
 * try {
 *   await startServer(server);
 * } catch (error) {
 *   console.error('Failed to start server:', error);
 *   process.exit(1);
 * }
 * ```
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
