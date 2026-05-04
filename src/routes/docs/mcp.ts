import { Router } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../../package.json';
import { ENV } from '@/config/env';

interface MCPParameter {
  name: string;
  in: string;
  required: boolean;
  type: string;
  description: string;
}

interface MCPResponse {
  status: number;
  description: string;
  schema: any;
}

interface MCPService {
  name: string;
  path: string;
  method: string;
  description: string;
  parameters: MCPParameter[];
  responses: MCPResponse[];
}

interface MCPDocument {
  version: string;
  services: MCPService[];
}

const router = Router();

// Load the same options as in swagger.ts
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: `${ENV.APP_NAME} API Documentation`,
      version,
      description: `API documentation for ${ENV.APP_NAME}`,
    },
    servers: [
      {
        url: '/api',
        description: 'API server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string' },
                  code: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/**/*.ts',
    './src/docs/schemas/*.yml',
    './src/shared/models/**/*.ts',
  ],
};

// Convert OpenAPI spec to MCP format
function convertToMCP(openApiSpec: any): MCPDocument {
  const mcp: MCPDocument = {
    version: '1.0',
    services: [],
  };

  // Convert paths to MCP services
  Object.entries(openApiSpec.paths || {}).forEach(
    ([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, details]: [string, any]) => {
        const service: MCPService = {
          name: details.operationId || `${method.toUpperCase()} ${path}`,
          path: path,
          method: method.toUpperCase(),
          description: details.description || '',
          parameters: [],
          responses: [],
        };

        // Convert parameters
        if (details.parameters) {
          service.parameters = details.parameters.map(
            (param: any): MCPParameter => ({
              name: param.name,
              in: param.in,
              required: param.required || false,
              type: param.schema?.type || 'string',
              description: param.description || '',
            })
          );
        }

        // Convert responses
        if (details.responses) {
          service.responses = Object.entries(details.responses)
            .filter(
              ([_, response]: [string, any]) =>
                response && typeof response === 'object'
            )
            .map(
              ([status, response]: [string, any]): MCPResponse => ({
                status: parseInt(status),
                description: response?.description || '',
                schema: response?.content?.['application/json']?.schema || {},
              })
            );
        }

        mcp.services.push(service);
      });
    }
  );

  return mcp;
}

// Generate OpenAPI specification
const openApiSpec = swaggerJsdoc(options);

// Generate MCP specification
const mcpSpec = convertToMCP(openApiSpec);

// Serve MCP documentation
router.get('/mcp', (_req, res) => {
  res.json(mcpSpec);
});

export default router;
