/**
 * Shared type definitions for the MCP server
 */

/**
 * JSON Schema property definition for tool input
 */
export interface SchemaProperty {
  type: string;
  description: string;
  enum?: string[];
  default?: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, SchemaProperty>;
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
export type ToolHandler<T extends object = Record<string, unknown>> = (
  args: T,
) => Promise<ToolResponse>;

/**
 * A complete tool with its definition and handler
 * Uses a contravariant handler type to allow any tool arguments
 */
export interface Tool {
  definition: ToolDefinition;
  handler: ToolHandler<any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- Required for contravariant tool handler compatibility
}
