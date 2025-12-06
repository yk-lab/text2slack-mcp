import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { after, before, describe, it } from 'node:test';
import { setTimeout } from 'node:timers/promises';

/**
 * Parse the first complete JSON line from a data buffer
 * Handles cases where multiple JSON messages might be in a single chunk
 * @param {Buffer} data - Raw data from stdout
 * @returns {object} Parsed JSON object
 */
function parseFirstJsonLine(data) {
  const lines = data
    .toString()
    .split('\n')
    .filter((line) => line.trim());
  if (lines.length === 0) {
    throw new Error('No JSON data received');
  }
  return JSON.parse(lines[0]);
}

/**
 * Wait for a JSON response from the server with timeout
 * @param {import('node:child_process').ChildProcess} server
 * @param {number} timeoutMs
 * @returns {Promise<object>}
 */
async function waitForResponse(server, timeoutMs = 5000) {
  const [data] = await Promise.race([
    once(server.stdout, 'data'),
    setTimeout(timeoutMs).then(() => {
      throw new Error(`Timeout waiting for response after ${timeoutMs}ms`);
    }),
  ]);
  return parseFirstJsonLine(data);
}

/**
 * Create and initialize an MCP test server
 * @param {string} webhookUrl - Slack webhook URL for testing
 * @returns {Promise<{server: import('node:child_process').ChildProcess, cleanup: () => Promise<void>}>}
 */
async function createMcpTestServer(webhookUrl) {
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

  server.stdin.write(JSON.stringify(initRequest) + '\n');

  const response = await waitForResponse(server);
  assert.strictEqual(response.id, 0);
  assert(response.result);

  const cleanup = async () => {
    server.kill();
    await once(server, 'close');
  };

  return { server, cleanup };
}

/**
 * Send an MCP request and wait for response
 * @param {import('node:child_process').ChildProcess} server
 * @param {object} request - JSON-RPC request object
 * @returns {Promise<object>}
 */
async function sendRequest(server, request) {
  server.stdin.write(JSON.stringify(request) + '\n');
  return waitForResponse(server);
}

describe('MCP Server Integration Tests', () => {
  let mockSlackServer;
  let mockSlackPort;
  let receivedRequests = [];

  before(async () => {
    // Create mock Slack server
    mockSlackServer = createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
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
    });

    // Start mock server and get random port
    await new Promise((resolve) => {
      mockSlackServer.listen(0, '127.0.0.1', () => {
        mockSlackPort = mockSlackServer.address().port;
        resolve();
      });
    });
  });

  after(() => {
    mockSlackServer.close();
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

      assert.strictEqual(response.jsonrpc, '2.0');
      assert.strictEqual(response.id, 1);
      assert(response.result);
      assert(Array.isArray(response.result.tools));
      assert.strictEqual(response.result.tools.length, 1);
      assert.strictEqual(response.result.tools[0].name, 'send_to_slack');
    } finally {
      await cleanup();
    }
  });

  it('should send message to Slack successfully', async () => {
    receivedRequests = []; // Clear previous requests

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
      assert.strictEqual(response.jsonrpc, '2.0');
      assert.strictEqual(response.id, 2);
      assert(response.result);
      assert(response.result.content);
      assert.strictEqual(response.result.content[0].type, 'text');
      assert(
        response.result.content[0].text.includes(
          'Successfully posted to Slack',
        ),
      );

      // Verify Slack webhook was called
      assert.strictEqual(receivedRequests.length, 1);
      const slackRequest = receivedRequests[0];
      assert.strictEqual(slackRequest.method, 'POST');
      assert.strictEqual(slackRequest.url, '/webhook');
      assert.strictEqual(
        slackRequest.headers['content-type'],
        'application/json',
      );

      const slackBody = JSON.parse(slackRequest.body);
      assert.strictEqual(slackBody.text, 'Integration test message');
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

      assert.strictEqual(response.jsonrpc, '2.0');
      assert.strictEqual(response.id, 3);
      assert(response.result);
      assert.strictEqual(response.result.isError, true);
      assert(response.result.content[0].text.includes('Unknown tool'));
    } finally {
      await cleanup();
    }
  });

  it('should handle Slack webhook failure', async () => {
    // Create a mock server that returns error
    const errorServer = createServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    });

    await new Promise((resolve) => {
      errorServer.listen(0, '127.0.0.1', resolve);
    });

    const errorPort = errorServer.address().port;

    const { server, cleanup } = await createMcpTestServer(
      `http://127.0.0.1:${errorPort}/webhook`,
    );

    try {
      const response = await sendRequest(server, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'send_to_slack',
          arguments: {
            message: 'This should fail',
          },
        },
        id: 4,
      });

      assert.strictEqual(response.jsonrpc, '2.0');
      assert.strictEqual(response.id, 4);
      assert(response.result);
      assert.strictEqual(response.result.isError, true);
      assert(
        response.result.content[0].text.includes(
          'Failed to send message to Slack',
        ),
      );
    } finally {
      await cleanup();
      errorServer.close();
    }
  });
});
