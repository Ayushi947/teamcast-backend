/**
 * A2A Configuration
 * Agent Card and server configuration for A2A protocol
 */

import { ENV } from '@/config/env';
import {
  A2AAgentCard,
  A2ACapabilities,
  A2ASecurityScheme,
  A2ASecuritySchemeType,
  A2ASkill,
  A2A_PROTOCOL_VERSION,
} from '../core/a2a.types';

/**
 * A2A Server configuration
 */
export const A2A_CONFIG = {
  // Agent identity
  agentId: 'teamcast-interview-agent',
  name: 'TeamCast Interview Agent',
  description:
    'AI-powered technical interview and assessment platform for recruiting agents',
  version: '1.0.0',

  // Protocol
  protocolVersions: [A2A_PROTOCOL_VERSION, '0.2'],

  // Endpoints
  endpoints: {
    base: '/api/a2a',
    messages: '/api/a2a/message',
    tasks: '/api/a2a/tasks',
    stream: '/api/a2a/stream',
    agentCard: '/.well-known/agent.json',
  },

  // Rate limiting
  rateLimit: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 500,
  },
} as const;

/**
 * A2A Capabilities
 */
export const A2A_CAPABILITIES: A2ACapabilities = {
  streaming: true, // SSE streaming support
  pushNotifications: true, // Webhook notifications
  extendedAgentCard: false,
  taskManagement: true, // Full task lifecycle
};

/**
 * Security schemes supported
 */
export const A2A_SECURITY_SCHEMES: Record<string, A2ASecurityScheme> = {
  apiKey: {
    type: A2ASecuritySchemeType.API_KEY,
    name: 'X-API-Key',
    in: 'header',
    description: 'API key for authentication',
  },
  bearerAuth: {
    type: A2ASecuritySchemeType.HTTP,
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Bearer token authentication',
  },
};

/**
 * Interview-related skills
 */
export const A2A_SKILLS: A2ASkill[] = [
  {
    id: 'interview.request',
    name: 'Request Interview',
    description:
      'Request a technical interview assessment for a candidate. Supports skills assessment with configurable difficulty levels.',
    inputSchema: {
      type: 'object',
      required: ['candidateEmail', 'candidateName', 'skillsToAssess'],
      properties: {
        candidateEmail: {
          type: 'string',
          format: 'email',
          description: 'Candidate email address',
        },
        candidateName: {
          type: 'string',
          description: 'Candidate full name',
        },
        skillsToAssess: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 10,
          description:
            'List of skills to assess (e.g., ["JavaScript", "React", "Node.js"])',
        },
        assessmentLevel: {
          type: 'string',
          enum: ['JUNIOR', 'INTERMEDIATE', 'SENIOR', 'LEAD'],
          default: 'INTERMEDIATE',
          description: 'Assessment difficulty level',
        },
        jobTitle: {
          type: 'string',
          description: 'Job title for context',
        },
        jobDescription: {
          type: 'string',
          description: 'Job description for context',
        },
        externalCandidateId: {
          type: 'string',
          description: 'Your system candidate ID for tracking',
        },
        externalReferenceId: {
          type: 'string',
          description: 'Your system reference ID for tracking',
        },
        expiryDays: {
          type: 'integer',
          minimum: 1,
          maximum: 30,
          default: 7,
          description: 'Days until interview invite expires',
        },
        notifyOnComplete: {
          type: 'boolean',
          default: true,
          description: 'Send push notification when interview completes',
        },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        interviewId: { type: 'string' },
        status: { type: 'string' },
        inviteUrl: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
    tags: ['interview', 'assessment', 'candidate'],
    examples: [
      {
        input:
          'Request an interview for John Doe (john@example.com) to assess JavaScript, React, and Node.js skills at senior level',
        output:
          'Interview requested successfully. Interview ID: int_abc123. Invite sent to john@example.com. Expires in 7 days.',
      },
    ],
  },
  {
    id: 'interview.status',
    name: 'Get Interview Status',
    description:
      'Check the current status of an interview. Returns status, timestamps, and whether results are ready.',
    inputSchema: {
      type: 'object',
      properties: {
        interviewId: {
          type: 'string',
          description: 'TeamCast interview ID',
        },
        externalReferenceId: {
          type: 'string',
          description: 'Your external reference ID',
        },
        candidateEmail: {
          type: 'string',
          format: 'email',
          description: 'Candidate email to look up',
        },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        interviewId: { type: 'string' },
        status: {
          type: 'string',
          enum: [
            'INVITED',
            'ACCEPTED',
            'DECLINED',
            'IN_PROGRESS',
            'COMPLETED',
            'EVALUATING',
            'RESULTS_READY',
            'EXPIRED',
            'CANCELLED',
          ],
        },
        candidateName: { type: 'string' },
        candidateEmail: { type: 'string' },
        skillsAssessed: { type: 'array', items: { type: 'string' } },
        invitedAt: { type: 'string', format: 'date-time' },
        acceptedAt: { type: 'string', format: 'date-time' },
        completedAt: { type: 'string', format: 'date-time' },
        resultsReady: { type: 'boolean' },
      },
    },
    tags: ['interview', 'status'],
    examples: [
      {
        input: 'What is the status of interview int_abc123?',
        output:
          'Interview int_abc123 is IN_PROGRESS. Candidate John Doe started the assessment on Jan 20, 2025.',
      },
    ],
  },
  {
    id: 'interview.results',
    name: 'Get Interview Results',
    description:
      'Retrieve detailed interview results including scores, skill assessments, and recommendations. Only available when status is RESULTS_READY.',
    inputSchema: {
      type: 'object',
      properties: {
        interviewId: {
          type: 'string',
          description: 'TeamCast interview ID',
        },
        externalReferenceId: {
          type: 'string',
          description: 'Your external reference ID',
        },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        interviewId: { type: 'string' },
        candidateName: { type: 'string' },
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        recommendation: { type: 'string' },
        resultSummary: { type: 'string' },
        skillResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skillName: { type: 'string' },
              score: { type: 'number' },
              proficiencyLevel: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              improvements: { type: 'array', items: { type: 'string' } },
              feedback: { type: 'string' },
            },
          },
        },
        completedAt: { type: 'string', format: 'date-time' },
        duration: { type: 'integer', description: 'Duration in minutes' },
      },
    },
    tags: ['interview', 'results', 'assessment'],
    examples: [
      {
        input: 'Get the results for interview int_abc123',
        output:
          'Interview results for John Doe: Overall Score 85/100. Recommendation: STRONG_HIRE. JavaScript: 90 (Expert), React: 82 (Advanced), Node.js: 83 (Advanced).',
      },
    ],
  },
  {
    id: 'interview.list',
    name: 'List Interviews',
    description:
      'List all interviews with optional filtering by status, date range, or external IDs.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'INVITED',
              'ACCEPTED',
              'DECLINED',
              'IN_PROGRESS',
              'COMPLETED',
              'EVALUATING',
              'RESULTS_READY',
              'EXPIRED',
              'CANCELLED',
            ],
          },
          description: 'Filter by status(es)',
        },
        externalReferenceId: {
          type: 'string',
          description: 'Filter by external reference',
        },
        candidateEmail: {
          type: 'string',
          description: 'Filter by candidate email',
        },
        fromDate: {
          type: 'string',
          format: 'date',
          description: 'Filter from date',
        },
        toDate: {
          type: 'string',
          format: 'date',
          description: 'Filter to date',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20,
        },
        offset: {
          type: 'integer',
          minimum: 0,
          default: 0,
        },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        interviews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              interviewId: { type: 'string' },
              candidateName: { type: 'string' },
              candidateEmail: { type: 'string' },
              status: { type: 'string' },
              skillsToAssess: { type: 'array', items: { type: 'string' } },
              overallScore: { type: 'number' },
              invitedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'integer' },
        limit: { type: 'integer' },
        offset: { type: 'integer' },
      },
    },
    tags: ['interview', 'list'],
  },
  {
    id: 'interview.cancel',
    name: 'Cancel Interview',
    description:
      'Cancel a pending interview. Cannot cancel interviews that are already in progress or completed.',
    inputSchema: {
      type: 'object',
      required: ['interviewId'],
      properties: {
        interviewId: {
          type: 'string',
          description: 'TeamCast interview ID to cancel',
        },
        reason: {
          type: 'string',
          description: 'Reason for cancellation',
        },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    tags: ['interview', 'cancel'],
  },
];

/**
 * Generate Agent Card
 */
export function generateAgentCard(): A2AAgentCard {
  const baseUrl = ENV.SERVER_URL || 'https://api.teamcast.io';

  return {
    agentId: A2A_CONFIG.agentId,
    name: A2A_CONFIG.name,
    description: A2A_CONFIG.description,
    url: `${baseUrl}${A2A_CONFIG.endpoints.base}`,
    protocolVersions: [...A2A_CONFIG.protocolVersions],
    capabilities: A2A_CAPABILITIES,
    securitySchemes: A2A_SECURITY_SCHEMES,
    security: [{ apiKey: [] }, { bearerAuth: [] }],
    skills: A2A_SKILLS,
    defaultInputModes: ['text', 'data'],
    defaultOutputModes: ['text', 'data'],
    metadata: {
      version: A2A_CONFIG.version,
      documentation: 'https://docs.teamcast.io/a2a',
      support: 'support@teamcast.io',
    },
  };
}
