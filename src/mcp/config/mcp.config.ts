import { z } from 'zod';

/**
 * MCP Server Configuration Schema
 * Defines the configuration options for the Teamcast MCP Server
 */
export const McpConfigSchema = z.object({
  name: z.string().default('teamcast-mcp-server'),
  version: z.string().default('1.0.0'),
  protocolVersion: z.string().default('2025-11-25'),
  description: z
    .string()
    .default('Teamcast MCP Server for AI Agent Integration'),
  capabilities: z.object({
    tools: z.boolean().default(true),
    resources: z.boolean().default(false),
    prompts: z.boolean().default(false),
    sampling: z.boolean().default(false),
    elicitation: z.boolean().default(false),
  }),
  auth: z.object({
    enabled: z.boolean().default(true),
    requireApiKey: z.boolean().default(true),
  }),
  rateLimit: z.object({
    enabled: z.boolean().default(true),
    requestsPerMinute: z.number().default(100),
    requestsPerHour: z.number().default(1000),
  }),
});

export type McpConfig = z.infer<typeof McpConfigSchema>;

/**
 * Default MCP Configuration
 */
export const mcpConfig: McpConfig = {
  name: 'teamcast-mcp-server',
  version: '1.0.0',
  protocolVersion: '2025-11-25',
  description: 'Teamcast MCP Server for AI Agent Integration',
  capabilities: {
    tools: true,
    resources: false,
    prompts: false,
    sampling: false,
    elicitation: false,
  },
  auth: {
    enabled: true,
    requireApiKey: true,
  },
  rateLimit: {
    enabled: true,
    requestsPerMinute: 100,
    requestsPerHour: 1000,
  },
};

/**
 * MCP Permission Scopes
 */
export const MCP_SCOPES = {
  JOBS_READ: 'jobs:read',
  JOBS_WRITE: 'jobs:write',
  CANDIDATES_READ: 'candidates:read',
  CANDIDATES_WRITE: 'candidates:write',
  INVITES_READ: 'invites:read',
  INVITES_WRITE: 'invites:write',
  APPLICATIONS_READ: 'applications:read',
  APPLICATIONS_WRITE: 'applications:write',
} as const;

export type McpScope = (typeof MCP_SCOPES)[keyof typeof MCP_SCOPES];

/**
 * Get MCP Server Info for discovery endpoint
 */
export function getMcpServerInfo() {
  return {
    name: mcpConfig.name,
    version: mcpConfig.version,
    protocolVersion: mcpConfig.protocolVersion,
    description: mcpConfig.description,
    capabilities: mcpConfig.capabilities,
    transports: [
      {
        type: 'sse',
        endpoint: '/api/mcp/sse',
        description:
          'Server-Sent Events transport (recommended for Cursor/Claude Desktop)',
      },
      {
        type: 'http',
        endpoint: '/api/mcp/v1',
        description: 'HTTP JSON-RPC 2.0 transport',
      },
    ],
    authentication: {
      type: 'bearer',
      headerName: 'Authorization',
    },
    scopes: Object.values(MCP_SCOPES),
  };
}
