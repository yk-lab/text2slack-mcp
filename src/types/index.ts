/**
 * Centralized type exports for the text2slack-mcp package.
 *
 * This module provides a single entry point for all public types,
 * making imports cleaner and the API surface explicit.
 *
 * @example
 * ```typescript
 * import type {
 *   SendMessageResult,
 *   SlackClientOptions,
 *   LogLevel,
 * } from './types/index.js';
 * ```
 *
 * @module
 */

// =============================================================================
// Slack Client Types
// =============================================================================

export type {
  /** Configuration for retry behavior with exponential backoff */
  RetryConfig,
  /** Result of sending a message to Slack */
  SendMessageResult,
  /** Configuration options for the SlackClient */
  SlackClientOptions,
} from '../services/slack-client.js';

// =============================================================================
// Logger Types
// =============================================================================

export type {
  /** Structured log entry format */
  LogEntry,
  /** Log levels for structured logging */
  LogLevel,
} from '../services/logger.js';

// =============================================================================
// MCP Server Types
// =============================================================================

export type {
  /** Options for signal handlers setup */
  SignalHandlerOptions,
  /** Options for starting the server */
  StartServerOptions,
} from '../server/mcp-server.js';

// =============================================================================
// Validation Types (Error Classes)
// =============================================================================

export {
  /** Error thrown when configuration validation fails */
  ConfigError,
  /** Error thrown when message validation fails */
  MessageValidationError,
} from '../utils/validation.js';

// =============================================================================
// Tool Types
// =============================================================================

export type {
  /** Type definition for the send_to_slack tool arguments */
  SendToSlackArgs,
} from '../tools/send-to-slack.js';
