/**
 * A2A Protocol Types
 * Agent-to-Agent Protocol specification types
 * Based on A2A Protocol v0.3 specification
 */

/**
 * A2A Protocol Version
 */
export const A2A_PROTOCOL_VERSION = '0.3';

/**
 * Task lifecycle states
 */
export enum A2ATaskState {
  WORKING = 'working',
  INPUT_REQUIRED = 'input-required',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

/**
 * Message roles
 */
export enum A2AMessageRole {
  USER = 'user',
  AGENT = 'agent',
}

/**
 * Part types for content
 */
export enum A2APartType {
  TEXT = 'text',
  FILE = 'file',
  DATA = 'data',
}

/**
 * Authentication scheme types
 */
export enum A2ASecuritySchemeType {
  API_KEY = 'apiKey',
  HTTP = 'http',
  OAUTH2 = 'oauth2',
  MUTUAL_TLS = 'mutualTLS',
}

/**
 * Text part - plain text content
 */
export interface A2ATextPart {
  type: A2APartType.TEXT;
  text: string;
  metadata?: Record<string, unknown>;
}

/**
 * File part - file/binary content
 */
export interface A2AFilePart {
  type: A2APartType.FILE;
  mimeType: string;
  data?: string; // Base64 encoded
  uri?: string; // URL to file
  name?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Data part - structured JSON data
 */
export interface A2ADataPart {
  type: A2APartType.DATA;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Union of all part types
 */
export type A2APart = A2ATextPart | A2AFilePart | A2ADataPart;

/**
 * Message structure
 */
export interface A2AMessage {
  messageId: string;
  role: A2AMessageRole;
  parts: A2APart[];
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Artifact - tangible output from task
 */
export interface A2AArtifact {
  artifactId: string;
  name: string;
  parts: A2APart[];
  metadata?: Record<string, unknown>;
}

/**
 * Task structure
 */
export interface A2ATask {
  taskId: string;
  contextId?: string;
  state: A2ATaskState;
  messages: A2AMessage[];
  artifacts?: A2AArtifact[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Skill definition
 */
export interface A2ASkill {
  id: string;
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>; // JSON Schema
  outputSchema?: Record<string, unknown>; // JSON Schema
  tags?: string[];
  examples?: A2ASkillExample[];
}

/**
 * Skill example
 */
export interface A2ASkillExample {
  input: string;
  output: string;
}

/**
 * Security scheme definition
 */
export interface A2ASecurityScheme {
  type: A2ASecuritySchemeType;
  name?: string;
  in?: 'header' | 'query';
  scheme?: string; // For HTTP (e.g., 'bearer')
  bearerFormat?: string;
  description?: string;
}

/**
 * Agent capabilities
 */
export interface A2ACapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  extendedAgentCard?: boolean;
  taskManagement?: boolean;
}

/**
 * Agent Card - discovery document
 */
export interface A2AAgentCard {
  agentId: string;
  name: string;
  description?: string;
  url: string;
  protocolVersions: string[];
  capabilities: A2ACapabilities;
  securitySchemes: Record<string, A2ASecurityScheme>;
  security: Array<Record<string, string[]>>;
  skills: A2ASkill[];
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * JSON-RPC 2.0 Request
 */
export interface A2AJsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id?: string | number | null;
}

/**
 * JSON-RPC 2.0 Response
 */
export interface A2AJsonRpcResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: A2AJsonRpcError;
  id: string | number | null;
}

/**
 * JSON-RPC 2.0 Error
 */
export interface A2AJsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * A2A Error Codes
 */
export const A2A_ERROR_CODES = {
  // Standard JSON-RPC errors
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,

  // A2A specific errors
  TASK_NOT_FOUND: -32001,
  UNSUPPORTED_OPERATION: -32002,
  PUSH_NOT_SUPPORTED: -32003,
  VERSION_NOT_SUPPORTED: -32004,
  CONTENT_TYPE_NOT_SUPPORTED: -32005,
  UNAUTHORIZED: -32010,
  FORBIDDEN: -32011,
  RATE_LIMITED: -32012,
} as const;

/**
 * message/send request params
 */
export interface A2AMessageSendParams {
  message: {
    role: A2AMessageRole;
    parts: A2APart[];
    metadata?: Record<string, unknown>;
  };
  contextId?: string;
  taskId?: string;
  configuration?: {
    acceptedOutputModes?: string[];
    blocking?: boolean;
  };
}

/**
 * message/send response
 */
export interface A2AMessageSendResponse {
  task?: A2ATask;
  message?: A2AMessage;
}

/**
 * tasks/get request params
 */
export interface A2ATasksGetParams {
  taskId: string;
}

/**
 * tasks/list request params
 */
export interface A2ATasksListParams {
  contextId?: string;
  state?: A2ATaskState[];
  limit?: number;
  offset?: number;
}

/**
 * tasks/cancel request params
 */
export interface A2ATasksCancelParams {
  taskId: string;
  reason?: string;
}

/**
 * A2A Context - request context
 */
export interface A2AContext {
  requestId: string;
  clientId: string;
  tenantId: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Skill handler function type
 */
export type A2ASkillHandler = (
  params: Record<string, unknown>,
  context: A2AContext
) => Promise<{
  state: A2ATaskState;
  message?: A2AMessage;
  artifacts?: A2AArtifact[];
  taskId?: string;
}>;

/**
 * Registered skill with handler
 */
export interface A2ARegisteredSkill extends A2ASkill {
  handler: A2ASkillHandler;
  requiredScopes?: string[];
}

/**
 * Push notification payload
 */
export interface A2APushNotification {
  taskId: string;
  state: A2ATaskState;
  message?: A2AMessage;
  artifacts?: A2AArtifact[];
  timestamp: string;
}

/**
 * SSE Event types
 */
export enum A2ASseEventType {
  TASK_UPDATE = 'task_update',
  MESSAGE = 'message',
  ARTIFACT = 'artifact',
  ERROR = 'error',
  PING = 'ping',
}
