import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { setTimeout } from 'node:timers/promises';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_RETRY_CONFIG } from '../../src/services/slack-client.js';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as { name: string; version: string };

/**
 * Calculate the maximum total retry time based on DEFAULT_RETRY_CONFIG.
 * This ensures test timeouts stay in sync with retry configuration changes.
 *
 * Formula: sum of baseDelayMs * 2^i for i in 0..maxRetries-1
 * Example with default config (3 retries, 1000ms base, 10000ms max):
 *   Attempt 0: fail -> wait min(1000 * 2^0, 10000) = 1000ms
 *   Attempt 1: fail -> wait min(1000 * 2^1, 10000) = 2000ms
 *   Attempt 2: fail -> wait min(1000 * 2^2, 10000) = 4000ms
 *   Attempt 3: fail -> done
 *   Total delay: 7000ms
 */
function calculateMaxRetryTime(): number {
  const { maxRetries, baseDelayMs, maxDelayMs } = DEFAULT_RETRY_CONFIG;
  let totalDelay = 0;
  for (let i = 0; i < maxRetries; i++) {
    totalDelay += Math.min(baseDelayMs * 2 ** i, maxDelayMs);
  }
  return totalDelay;
}

// Buffer time for request processing, network latency, etc.
const RETRY_TEST_BUFFER_MS = 5000;
const RETRY_TEST_TIMEOUT_MS = calculateMaxRetryTime() + RETRY_TEST_BUFFER_MS;

interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: {
    tools?: Array<{ name: string }>;
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
    serverInfo?: { name: string; version: string };
  };
}

interface ReceivedRequest {
  method: string | undefined;
  url: string | undefined;
  headers: IncomingMessage['headers'];
  body: string;
}

/**
 * Parse the first complete JSON line from a data buffer
 * Handles cases where multiple JSON messages might be in a single chunk
 */
function parseFirstJsonLine(data: Buffer): JsonRpcResponse {
  const lines = data
    .toString()
    .split('\n')
    .filter((line) => line.trim());
  if (lines.length === 0) {
    throw new Error('No JSON data received');
  }
  return JSON.parse(lines[0]) as JsonRpcResponse;
}

/**
 * Wait for a JSON response from the server with timeout
 */
async function waitForResponse(
  server: ChildProcess,
  timeoutMs = 5000,
): Promise<JsonRpcResponse> {
  const [data] = (await Promise.race([
    once(server.stdout!, 'data'),
    setTimeout(timeoutMs).then(() => {
      throw new Error(`Timeout waiting for response after ${timeoutMs}ms`);
    }),
  ])) as [Buffer];
  return parseFirstJsonLine(data);
}

/**
 * Create and initialize an MCP test server
 */
async function createMcpTestServer(webhookUrl: string): Promise<{
  server: ChildProcess;
  cleanup: () => Promise<void>;
  initResponse: JsonRpcResponse;
}> {
  const server = spawn('node', ['dist/cli.js'], {
    env: {
      ...process.env,
      SLACK_WEBHOOK_URL: webhookUrl,
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Send initialize request
  const initRequest = {
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    },
    id: 0,
  };

  server.stdin!.write(JSON.stringify(initRequest) + '\n');

  const initResponse = await waitForResponse(server);
  expect(initResponse.id).toBe(0);
  expect(initResponse.result).toBeDefined();

  const cleanup = async () => {
    server.kill();
    await once(server, 'close');
  };

  return { server, cleanup, initResponse };
}

/**
 * Send an MCP request and wait for response
 */
async function sendRequest(
  server: ChildProcess,
  request: object,
  timeoutMs = 5000,
): Promise<JsonRpcResponse> {
  server.stdin!.write(JSON.stringify(request) + '\n');
  return waitForResponse(server, timeoutMs);
}

describe('MCP Server Integration Tests', () => {
  let mockSlackServer: Server;
  let mockSlackPort: number;
  let receivedRequests: ReceivedRequest[] = [];

  beforeAll(async () => {
    // Create mock Slack server
    mockSlackServer = createServer(
      (req: IncomingMessage, res: ServerResponse) => {
        let body = '';
        req.on('data', (chunk: Buffer) => (body += chunk.toString()));
        req.on('end', () => {
          receivedRequests.push({
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: body,
          });
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('ok');
        });
      },
    );

    // Start mock server and get random port
    await new Promise<void>((resolve) => {
      mockSlackServer.listen(0, '127.0.0.1', () => {
        const address = mockSlackServer.address();
        if (address && typeof address === 'object') {
          mockSlackPort = address.port;
        }
        resolve();
      });
    });
  });

  afterAll(() => {
    mockSlackServer.close();
  });

  beforeEach(() => {
    receivedRequests = [];
  });

  it('should return correct server info with version from package.json', async () => {
    const { cleanup, initResponse } = await createMcpTestServer(
      `http://127.0.0.1:${mockSlackPort}/webhook`,
    );

    try {
      expect(initResponse.result?.serverInfo).toBeDefined();
      expect(initResponse.result?.serverInfo?.name).toBe(pkg.name);
      expect(initResponse.result?.serverInfo?.version).toBe(pkg.version);
    } finally {
      await cleanup();
    }
  });

  it('should list available tools', async () => {
    const { server, cleanup } = await createMcpTestServer(
      `http://127.0.0.1:${mockSlackPort}/webhook`,
    );

    try {
      const response = await sendRequest(server, {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      });

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.result).toBeDefined();
      expect(Array.isArray(response.result?.tools)).toBe(true);
      expect(response.result?.tools?.length).toBe(1);
      expect(response.result?.tools?.[0].name).toBe('send_to_slack');
    } finally {
      await cleanup();
    }
  });

  it('should send message to Slack successfully', async () => {
    const { server, cleanup } = await createMcpTestServer(
      `http://127.0.0.1:${mockSlackPort}/webhook`,
    );

    try {
      const response = await sendRequest(server, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'send_to_slack',
          arguments: {
            message: 'Integration test message',
          },
        },
        id: 2,
      });

      // Verify MCP response
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(2);
      expect(response.result).toBeDefined();
      expect(response.result?.content).toBeDefined();
      expect(response.result?.content?.[0].type).toBe('text');
      expect(response.result?.content?.[0].text).toContain(
        'Successfully posted to Slack',
      );

      // Verify Slack webhook was called
      expect(receivedRequests.length).toBe(1);
      const slackRequest = receivedRequests[0];
      expect(slackRequest.method).toBe('POST');
      expect(slackRequest.url).toBe('/webhook');
      expect(slackRequest.headers['content-type']).toBe('application/json');

      const slackBody = JSON.parse(slackRequest.body);
      expect(slackBody.text).toBe('Integration test message');
    } finally {
      await cleanup();
    }
  });

  it('should handle invalid tool name', async () => {
    const { server, cleanup } = await createMcpTestServer(
      `http://127.0.0.1:${mockSlackPort}/webhook`,
    );

    try {
      const response = await sendRequest(server, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'invalid_tool',
          arguments: {},
        },
        id: 3,
      });

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(3);
      expect(response.result).toBeDefined();
      expect(response.result?.isError).toBe(true);
      expect(response.result?.content?.[0].text).toContain('not found');
    } finally {
      await cleanup();
    }
  });

  it(
    'should handle Slack webhook failure',
    { timeout: RETRY_TEST_TIMEOUT_MS * 2 },
    async () => {
      // Create a mock server that returns error
      const errorServer = createServer((_req, res) => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      });

      await new Promise<void>((resolve) => {
        errorServer.listen(0, '127.0.0.1', resolve);
      });

      const address = errorServer.address();
      const errorPort =
        address && typeof address === 'object' ? address.port : 0;

      const { server, cleanup } = await createMcpTestServer(
        `http://127.0.0.1:${errorPort}/webhook`,
      );

      try {
        // Timeout calculated from DEFAULT_RETRY_CONFIG to stay in sync with config changes
        const response = await sendRequest(
          server,
          {
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'send_to_slack',
              arguments: {
                message: 'This should fail',
              },
            },
            id: 4,
          },
          RETRY_TEST_TIMEOUT_MS,
        );

        expect(response.jsonrpc).toBe('2.0');
        expect(response.id).toBe(4);
        expect(response.result).toBeDefined();
        expect(response.result?.isError).toBe(true);
        expect(response.result?.content?.[0].text).toContain(
          'Failed to send message to Slack',
        );
      } finally {
        await cleanup();
        await new Promise<void>((resolve) =>
          errorServer.close(() => resolve()),
        );
      }
    },
  );
});
