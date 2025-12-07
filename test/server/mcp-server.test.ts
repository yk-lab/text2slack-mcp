import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the MCP SDK with proper class implementations
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn().mockImplementation(function () {
    return {
      close: vi.fn().mockResolvedValue(undefined),
      connect: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

// Mock createRequire to return package.json
vi.mock('node:module', () => ({
  createRequire: vi.fn().mockReturnValue(() => ({
    name: 'text2slack-mcp',
    version: '0.1.3',
  })),
}));

// Import after mocks are set up
const { createMcpServer, setupSignalHandlers, shutdownServer, startServer } =
  await import('../../src/server/mcp-server.js');

describe('mcp-server', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let processOnSpy: ReturnType<typeof vi.spyOn>;
  // Store original process.on handlers to restore later
  const originalListeners: Map<string, NodeJS.SignalsListener[]> = new Map();

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Silenced for tests
    });
    processExitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    processOnSpy = vi.spyOn(process, 'on');

    // Save existing listeners
    originalListeners.set(
      'SIGINT',
      process.listeners('SIGINT') as NodeJS.SignalsListener[],
    );
    originalListeners.set(
      'SIGTERM',
      process.listeners('SIGTERM') as NodeJS.SignalsListener[],
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    processOnSpy.mockRestore();

    // Clean up signal handlers added during tests
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');

    // Restore original listeners
    for (const listener of originalListeners.get('SIGINT') ?? []) {
      process.on('SIGINT', listener);
    }
    for (const listener of originalListeners.get('SIGTERM') ?? []) {
      process.on('SIGTERM', listener);
    }
  });

  describe('createMcpServer', () => {
    it('should create an MCP server with correct configuration', () => {
      createMcpServer();

      expect(McpServer).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String),
          version: expect.any(String),
        }),
        expect.objectContaining({
          capabilities: { tools: {} },
        }),
      );
    });
  });

  describe('shutdownServer', () => {
    it('should close the server successfully', async () => {
      const mockServer = {
        close: vi.fn().mockResolvedValue(undefined),
      } as unknown as McpServer;

      await shutdownServer(mockServer);

      expect(mockServer.close).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Shutting down MCP server...',
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'MCP server shut down successfully',
      );
    });

    it('should throw error if shutdown fails', async () => {
      const shutdownError = new Error('Shutdown failed');
      const mockServer = {
        close: vi.fn().mockRejectedValue(shutdownError),
      } as unknown as McpServer;

      await expect(shutdownServer(mockServer)).rejects.toThrow(
        'Shutdown failed',
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error during server shutdown:',
        shutdownError,
      );
    });
  });

  describe('setupSignalHandlers', () => {
    it('should register SIGINT and SIGTERM handlers', () => {
      const mockServer = {
        close: vi.fn().mockResolvedValue(undefined),
      } as unknown as McpServer;

      setupSignalHandlers(mockServer);

      expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith(
        'SIGTERM',
        expect.any(Function),
      );
    });

    it('should handle SIGINT gracefully', async () => {
      const mockServer = {
        close: vi.fn().mockResolvedValue(undefined),
      } as unknown as McpServer;
      const onShutdown = vi.fn();

      setupSignalHandlers(mockServer, onShutdown);

      // Get the SIGINT handler
      const sigintCall = processOnSpy.mock.calls.find(
        (call: [string, unknown]) => call[0] === 'SIGINT',
      );
      const sigintHandler = sigintCall?.[1] as () => void;

      // Trigger the handler
      sigintHandler();

      // Wait for async operations
      await vi.waitFor(
        () => {
          expect(mockServer.close).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Received SIGINT, initiating graceful shutdown...',
      );
      await vi.waitFor(
        () => {
          expect(onShutdown).toHaveBeenCalled();
          expect(processExitSpy).toHaveBeenCalledWith(0);
        },
        { timeout: 1000 },
      );
    });

    it('should handle SIGTERM gracefully', async () => {
      const mockServer = {
        close: vi.fn().mockResolvedValue(undefined),
      } as unknown as McpServer;

      setupSignalHandlers(mockServer);

      // Get the SIGTERM handler
      const sigtermCall = processOnSpy.mock.calls.find(
        (call: [string, unknown]) => call[0] === 'SIGTERM',
      );
      const sigtermHandler = sigtermCall?.[1] as () => void;

      // Trigger the handler
      sigtermHandler();

      // Wait for async operations
      await vi.waitFor(
        () => {
          expect(mockServer.close).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Received SIGTERM, initiating graceful shutdown...',
      );
      await vi.waitFor(
        () => {
          expect(processExitSpy).toHaveBeenCalledWith(0);
        },
        { timeout: 1000 },
      );
    });

    it('should force exit on second signal during shutdown', async () => {
      const mockServer = {
        close: vi.fn().mockImplementation(
          () =>
            new Promise(() => {
              // Never resolves to simulate long shutdown
            }),
        ),
      } as unknown as McpServer;

      setupSignalHandlers(mockServer);

      // Get the SIGINT handler
      const sigintCall = processOnSpy.mock.calls.find(
        (call: [string, unknown]) => call[0] === 'SIGINT',
      );
      const sigintHandler = sigintCall?.[1] as () => void;

      // Trigger first signal
      sigintHandler();

      // Wait for the shutdown to start
      await vi.waitFor(
        () => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Received SIGINT, initiating graceful shutdown...',
          );
        },
        { timeout: 1000 },
      );

      // Trigger second signal during shutdown
      sigintHandler();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Received SIGINT during shutdown, forcing exit...',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit with error code 1 if shutdown fails', async () => {
      const mockServer = {
        close: vi.fn().mockRejectedValue(new Error('Shutdown error')),
      } as unknown as McpServer;

      setupSignalHandlers(mockServer);

      // Get the SIGINT handler
      const sigintCall = processOnSpy.mock.calls.find(
        (call: [string, unknown]) => call[0] === 'SIGINT',
      );
      const sigintHandler = sigintCall?.[1] as () => void;

      // Trigger the handler
      sigintHandler();

      // Wait for async operations
      await vi.waitFor(
        () => {
          expect(processExitSpy).toHaveBeenCalledWith(1);
        },
        { timeout: 1000 },
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to shutdown gracefully',
      );
    });
  });

  describe('startServer', () => {
    it('should start server and setup signal handlers', async () => {
      const mockServer = {
        close: vi.fn().mockResolvedValue(undefined),
        connect: vi.fn().mockResolvedValue(undefined),
      } as unknown as McpServer;

      await startServer(mockServer);

      expect(mockServer.connect).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'text2slack-mcp server running on stdio',
      );
      expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith(
        'SIGTERM',
        expect.any(Function),
      );
    });

    it('should handle startup error and attempt shutdown', async () => {
      const startupError = new Error('Connection failed');
      const mockServer = {
        close: vi.fn().mockResolvedValue(undefined),
        connect: vi.fn().mockRejectedValue(startupError),
      } as unknown as McpServer;

      await expect(startServer(mockServer)).rejects.toThrow(
        'Connection failed',
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to start MCP server:',
        startupError,
      );
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should ignore shutdown errors during startup failure', async () => {
      const startupError = new Error('Connection failed');
      const mockServer = {
        close: vi.fn().mockRejectedValue(new Error('Shutdown also failed')),
        connect: vi.fn().mockRejectedValue(startupError),
      } as unknown as McpServer;

      await expect(startServer(mockServer)).rejects.toThrow(
        'Connection failed',
      );

      expect(mockServer.close).toHaveBeenCalled();
      // Should still throw the original startup error, not the shutdown error
    });
  });
});
