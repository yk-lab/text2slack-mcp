import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { setTimeout } from 'node:timers/promises';

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
    const server = spawn('node', ['cli.js'], {
      env: {
        ...process.env,
        SLACK_WEBHOOK_URL: `http://127.0.0.1:${mockSlackPort}/webhook`,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    try {
      // Send list tools request
      const request = {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      };

      server.stdin.write(JSON.stringify(request) + '\n');

      // Wait for response
      const [data] = await Promise.race([
        once(server.stdout, 'data'),
        setTimeout(5000).then(() => {
          throw new Error('Timeout waiting for response');
        }),
      ]);

      const response = JSON.parse(data.toString().trim());

      assert.strictEqual(response.jsonrpc, '2.0');
      assert.strictEqual(response.id, 1);
      assert(response.result);
      assert(Array.isArray(response.result.tools));
      assert.strictEqual(response.result.tools.length, 1);
      assert.strictEqual(response.result.tools[0].name, 'send_to_slack');
    } finally {
      server.kill();
      await once(server, 'close');
    }
  });

  it('should send message to Slack successfully', async () => {
    receivedRequests = []; // Clear previous requests

    const server = spawn('node', ['cli.js'], {
      env: {
        ...process.env,
        SLACK_WEBHOOK_URL: `http://127.0.0.1:${mockSlackPort}/webhook`,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    try {
      // Wait for server to be ready
      await setTimeout(100);

      // Send tool call request
      const request = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'send_to_slack',
          arguments: {
            message: 'Integration test message',
          },
        },
        id: 2,
      };

      server.stdin.write(JSON.stringify(request) + '\n');

      // Wait for response
      const [data] = await Promise.race([
        once(server.stdout, 'data'),
        setTimeout(5000).then(() => {
          throw new Error('Timeout waiting for response');
        }),
      ]);

      const response = JSON.parse(data.toString().trim());

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
      server.kill();
      await once(server, 'close');
    }
  });

  it('should handle invalid tool name', async () => {
    const server = spawn('node', ['cli.js'], {
      env: {
        ...process.env,
        SLACK_WEBHOOK_URL: `http://127.0.0.1:${mockSlackPort}/webhook`,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    try {
      // Send invalid tool call
      const request = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'invalid_tool',
          arguments: {},
        },
        id: 3,
      };

      server.stdin.write(JSON.stringify(request) + '\n');

      // Wait for response
      const [data] = await Promise.race([
        once(server.stdout, 'data'),
        setTimeout(5000).then(() => {
          throw new Error('Timeout waiting for response');
        }),
      ]);

      const response = JSON.parse(data.toString().trim());

      assert.strictEqual(response.jsonrpc, '2.0');
      assert.strictEqual(response.id, 3);
      assert(response.result);
      assert.strictEqual(response.result.isError, true);
      assert(response.result.content[0].text.includes('Unknown tool'));
    } finally {
      server.kill();
      await once(server, 'close');
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

    const server = spawn('node', ['cli.js'], {
      env: {
        ...process.env,
        SLACK_WEBHOOK_URL: `http://127.0.0.1:${errorPort}/webhook`,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    try {
      await setTimeout(100);

      const request = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'send_to_slack',
          arguments: {
            message: 'This should fail',
          },
        },
        id: 4,
      };

      server.stdin.write(JSON.stringify(request) + '\n');

      const [data] = await Promise.race([
        once(server.stdout, 'data'),
        setTimeout(5000).then(() => {
          throw new Error('Timeout waiting for response');
        }),
      ]);

      const response = JSON.parse(data.toString().trim());

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
      server.kill();
      await once(server, 'close');
      errorServer.close();
    }
  });
});
