import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { ToolDefinition, ToolHandler } from '../tools/send-to-slack.js';

export interface Tool {
  definition: ToolDefinition;
  handler: ToolHandler;
}

export class MCPServer {
  private readonly tools: Tool[];
  private readonly toolHandlers: Map<string, ToolHandler>;
  private readonly server: Server;

  constructor(tools: Tool[] = []) {
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

  private setupHandlers(): void {
    // Register list tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools.map((tool) => tool.definition),
    }));

    // Register call tool handler
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request): Promise<CallToolResult> => {
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

        const result = await handler(args as { message: string });
        return {
          content: result.content,
          isError: result.isError,
        };
      },
    );
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('text2slack-mcp server running on stdio');
  }
}
