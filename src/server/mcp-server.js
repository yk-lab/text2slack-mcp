import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export class MCPServer {
  constructor(tools = []) {
    this.tools = tools;
    this.toolHandlers = new Map();

    // Register tools
    tools.forEach((tool) => {
      this.toolHandlers.set(tool.definition.name, tool.handler);
    });

    // Create MCP server
    this.server = new Server(
      {
        name: 'text2slack-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // Register list tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools.map((tool) => tool.definition),
    }));

    // Register call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const handler = this.toolHandlers.get(name);
      if (!handler) {
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
      }

      return await handler(args);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('text2slack-mcp server running on stdio');
  }
}
