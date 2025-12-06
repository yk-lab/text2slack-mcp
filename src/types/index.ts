/**
 * Shared type definitions for the MCP server
 */

/**
 * Definition of an MCP tool
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

/**
 * Text content in a tool response
 */
export interface TextContent {
  type: 'text';
  text: string;
}

/**
 * Response from a tool execution
 */
export interface ToolResponse {
  content: TextContent[];
  isError?: boolean;
}

/**
 * Generic handler function for MCP tools
 * @template T - The type of arguments the handler accepts
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolHandler<T = any> = (args: T) => Promise<ToolResponse>;

/**
 * A complete tool with its definition and handler
 */
export interface Tool {
  definition: ToolDefinition;
  handler: ToolHandler;
}
