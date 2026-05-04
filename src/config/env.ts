// This file defines environment variables for the application
// It uses zod for validation to ensure all required variables are present
// and correctly formatted before the application starts

// Disable console lint error for this file
/* eslint-disable no-console */

import { z } from 'zod';
import 'dotenv/config';
import fs from 'fs';

const envSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z
    .string()
    .transform(Number)
    .refine((n) => n >= 1024 && n <= 65535, {
      message: 'Port must be between 1024 and 65535',
    }),
  NODE_ENV: z.enum(['development', 'production', 'qa', 'local']),
  ENV_NAME: z
    .enum(['development', 'production', 'local', 'qa'])
    .default('development'),
  JWT_SECRET: z.string().min(64, {
    message: 'JWT_SECRET must be at least 64 characters for security',
  }),
  REFRESH_TOKEN_SECRET: z.string().min(64, {
    message: 'REFRESH_TOKEN_SECRET must be at least 64 characters for security',
  }),
  JWT_EXPIRY: z.string().regex(/^\d+[smhd]$/),
  REFRESH_TOKEN_EXPIRY: z.string().regex(/^\d+[smhd]$/),
  FRONTEND_URL: z.string().url(),
  APP_NAME:
    process.env.NODE_ENV === 'development'
      ? z.string().optional().default('Teamcast')
      : z.string(),
  SERVER_URL: z.string().url(),
  PROMETHEUS_URL: z.string().url().optional().default('http://localhost:9090'),
  BUCKET_NAME: z.string().default('teamcast'),
  GOOGLE_CLOUD_KEY_FILE: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Skip validation if not provided
        return fs.existsSync(val) && fs.lstatSync(val).isFile();
      },
      {
        message:
          'The file path for GOOGLE_CLOUD_KEY_FILE is invalid or does not exist.',
      }
    ),
  PRE_SIGNED_URL_EXPIRY_SECONDS: z.string().transform(Number).default('3600'),
  API_DELAY_MS: z.string().transform(Number).default('0'),
  SEND_NOTIFICATIONS: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    })
    .default(false),
  NOTIFICATION_PROVIDER: z.enum(['brevo', 'smtp']).default('brevo'),
  BREVO_API_KEY: z.string().optional(),
  BREVO_FROM_EMAIL: z.string().optional(),
  BREVO_FROM_NAME: z.string().optional(),
  BREVO_VERIFICATION_TEMPLATE_ID: z.string().optional().default('1'),
  BREVO_RESET_PASSWORD_TEMPLATE_ID: z.string().optional().default('2'),
  BREVO_CLIENT_INVITATION_TEMPLATE_ID: z.string().optional().default('3'),
  BREVO_PARTNER_INVITATION_TEMPLATE_ID: z.string().optional().default('17'),
  BREVO_CLIENT_SIGNUP_TEMPLATE_ID: z.string().optional().default('4'),
  BREVO_CLIENT_ACCOUNT_MANAGER_ASSIGNMENT_TEMPLATE_ID: z
    .string()
    .optional()
    .default('26'),
  BREVO_ACCOUNT_MANAGER_CLIENT_ONBOARDED_TEMPLATE_ID: z
    .string()
    .optional()
    .default('27'),
  BREVO_CLIENT_INVITATION_WITHDRAWN_TEMPLATE_ID: z
    .string()
    .optional()
    .default('5'),
  BREVO_USER_ACTIVATED_TEMPLATE_ID: z.string().optional().default('6'),
  BREVO_USER_DEACTIVATED_TEMPLATE_ID: z.string().optional().default('7'),
  BREVO_JOB_INVITATION_TEMPLATE_ID: z.string().optional().default('8'),
  // Job application notification templates
  BREVO_APPLICATION_ACCEPTED_TEMPLATE_ID: z.string().optional().default('9'),
  BREVO_CANDIDATE_ACCEPTED_TEMPLATE_ID: z.string().optional().default('10'),
  BREVO_APPLICATION_REJECTED_TEMPLATE_ID: z.string().optional().default('11'),
  BREVO_APPLICATION_SHORTLISTED_TEMPLATE_ID: z
    .string()
    .optional()
    .default('22'),
  BREVO_CANDIDATE_REJECTED_TEMPLATE_ID: z.string().optional().default('12'),
  BREVO_CANDIDATE_DECLINED_TEMPLATE_ID: z.string().optional().default('12'),
  BREVO_APPLICATION_WITHDRAWN_TEMPLATE_ID: z.string().optional().default('13'),
  BREVO_CANDIDATE_WITHDREW_TEMPLATE_ID: z.string().optional().default('14'),
  BREVO_JOB_APPLICATION_SUBMITTED_TEMPLATE_ID: z.string().min(1).default('15'),
  BREVO_NEW_JOB_APPLICATION_TEMPLATE_ID: z.string().min(1).default('16'),
  BREVO_PARTNER_USER_INVITATION_ACKNOWLEDGMENT_TEMPLATE_ID: z
    .string()
    .min(1)
    .default('20'),
  BREVO_PARTNER_USER_WELCOME_TEMPLATE_ID: z.string().min(1).default('21'),
  BREVO_SUPPORT_CANDIDATE_USER_WELCOME_TEMPLATE_ID: z
    .string()
    .min(1)
    .default('23'),

  BREVO_SUPPORT_PARTNER_USER_WELCOME_TEMPLATE_ID: z
    .string()
    .min(1)
    .default('24'),

  BREVO_SUPPORT_USER_WELCOME_TEMPLATE_ID: z.string().min(1).default('25'),

  // Sentry Configuration
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().transform(Number).default('1.0'),
  SENTRY_PROFILES_SAMPLE_RATE: z.string().transform(Number).default('1.0'),
  SENTRY_ENABLE: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    })
    .default(false),

  STORAGE_PROVIDER: z.enum(['gcp', 'local']).default('local'),
  // Redis configuration
  REDIS_HOST: z.string().optional().default('localhost'),
  REDIS_PORT: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 6379))
    .default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_USER: z.string().optional(),
  REDIS_URL: z.string().optional(),
  USE_REDIS_CACHE: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    })
    .default(false),
  // BullMQ configuration
  BULLMQ_REDIS_HOST: z.string().optional().default('localhost'),
  BULLMQ_REDIS_PORT: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 6379))
    .default('6379'),
  BULLMQ_REDIS_PASSWORD: z.string().optional(),
  BULLMQ_REDIS_USER: z.string().optional(),
  BULLMQ_REDIS_DB: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 1))
    .default('1'),
  // LiveKit Redis configuration (for agent communication)
  LIVEKIT_REDIS_HOST: z.string().optional().default('localhost'),
  LIVEKIT_REDIS_PORT: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 6379))
    .default('6379'),
  LIVEKIT_REDIS_PASSWORD: z.string().optional(),
  LIVEKIT_REDIS_USER: z.string().optional(),
  LIVEKIT_REDIS_DB: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 0))
    .default('0'),
  BULLMQ_DEFAULT_JOB_ATTEMPTS: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 3))
    .default('3'),
  BULLMQ_DEFAULT_JOB_BACKOFF_DELAY: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 2000))
    .default('2000'),
  DEFAULT_PAGE: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 1))
    .default('1'),
  DEFAULT_LIMIT: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 10))
    .default('10'),
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_PUBLISHABLE_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  PAYMENT_PROVIDER: z
    .enum(['stripe', 'paypal', 'manual', 'dummy'])
    .default('dummy'),
  DEFAULT_SORT_BY: z.string().default('createdAt'),
  DEFAULT_SORT_ORDER: z.enum(['asc', 'desc']).default('desc'),

  // GCP Vertex AI configuration
  GOOGLE_CLOUD_PROJECT_ID: z.string(),
  GOOGLE_CLOUD_CLIENT_EMAIL: z.string().optional(),
  GOOGLE_CLOUD_PRIVATE_KEY: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_CLOUD_VERTEX_AI_MODEL: z.string().default('gemini-pro'),
  GOOGLE_CLOUD_VERTEX_AI_LOCATION: z.string().default('us-central1'),
  GOOGLE_CLOUD_VERTEX_AI_EMBEDDING_MODEL_ID: z
    .string()
    .default('text-embedding-005'),
  GEMINI_MAX_RETRIES: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 3))
    .default('3'),
  MAX_QUESTIONS_PER_SECTION: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 5)),
  RESUME_PARSER_PROVIDER: z.enum(['local', 'gcp-vertex']).default('local'),
  RESUME_ASSESSMENT_PROVIDER: z.enum(['local', 'gcp-vertex']).default('local'),
  JOB_PARSER_PROVIDER: z.enum(['local', 'gcp-vertex']).default('gcp-vertex'),
  ONBOARDING_ASSESSMENT_PROVIDER: z
    .enum(['local', 'gcp-vertex'])
    .default('local'),
  AI_JOB_AI_ASSESSMENT_PROVIDER: z
    .enum(['local', 'gcp-vertex'])
    .default('local'),
  RAG_PROVIDER: z.enum(['gcp-vertex']).default('gcp-vertex'),
  CRON_API_KEY: z.string(),
  MIN_RESUME_ASSESSMENT_COMPLETION_PERCENTAGE: z
    .string()
    .transform(Number)
    .refine((n) => n >= 0 && n <= 100, {
      message: 'Completion percentage must be between 0 and 100',
    })
    .default('80'),

  // OAuth Configuration (Direct OAuth)
  OAUTH_REDIRECT_URL: z.string().url().default('http://localhost:3000'),
  OAUTH_STATE_SECRET: z
    .string()
    .min(32, {
      message: 'OAUTH_STATE_SECRET must be at least 32 characters for security',
    })
    .refine((val) => val !== 'change-me-in-production', {
      message:
        'OAUTH_STATE_SECRET must be changed from default value in production',
    }),

  // Direct OAuth Configuration
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GITHUB_OAUTH_CLIENT_ID: z.string().optional(),
  GITHUB_OAUTH_CLIENT_SECRET: z.string().optional(),

  AZURE_TENANT_ID: z.string().optional(),
  AZURE_CLIENT_ID: z.string().optional(),
  AZURE_CLIENT_SECRET: z.string().optional(),
  AZURE_GRAPH_BASE_URL: z
    .string()
    .optional()
    .default('https://graph.microsoft.com/v1.0'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().optional(),
  SMTP_FROM_NAME: z.string().optional(),

  // Indeed Integration Configuration
  INDEED_API_BASE_URL: z.string().optional().default('https://apis.indeed.com'),
  INDEED_CLIENT_ID: z.string().optional().default(''),
  INDEED_CLIENT_SECRET: z.string().optional().default(''),
  INDEED_REDIRECT_URI: z.string().optional().default(''),
  ENABLE_BULLMQ_WORKERS: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    })
    .default(false),
  ENABLE_GPU_BULLMQ_WORKERS: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    })
    .default(false),
  ENABLE_BULLMQ_DASHBOARD: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    })
    .default(false),
  BULLMQ_DASHBOARD_USERNAME: z.string().optional(),
  BULLMQ_DASHBOARD_PASSWORD: z.string().optional(),
  BULLMQ_DASHBOARD_CONCURRENCY: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 10))
    .default('10'),

  // Video Processing Configuration
  VIDEO_PROCESSING_MODE: z
    .enum(['ULTRA_FAST', 'FAST', 'BALANCED'])
    .optional()
    .default('FAST'),
  VIDEO_CHUNK_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 300000))
    .default('300000'), // 5 minutes default

  // Video Analysis Workers Configuration
  // ENABLE_GPU_BULLMQ_WORKERS: Legacy flag for GPU-based full video analysis (deprecated)
  // ENABLE_CHUNK_VIDEO_ANALYSIS_WORKERS: New flag for cloud-based chunk analysis (uses Google Cloud Video Intelligence API)
  ENABLE_CHUNK_VIDEO_ANALYSIS_WORKERS: z
    .string()
    .optional()
    .transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    })
    .default('true'), // Enabled by default - no GPU required, uses Google Cloud
  VIDEO_MERGE_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 600000))
    .default('600000'), // 10 minutes default
  VIDEO_SEGMENT_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 600000))
    .default('600000'), // 10 minutes default
  FONT_REGULAR_PATH: z
    .string()
    .optional()
    .default('/app/assets/fonts/OpenSans-Regular.ttf'),
  FONT_BOLD_PATH: z
    .string()
    .optional()
    .default('/app/assets/fonts/OpenSans-Bold.ttf'),

  CANDIDATE_RECOMMENDATION_SCORE: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 0.7))
    .default('0.7'),
  STRIPE_TRIAL_PERIOD_DAYS: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 14))
    .default('14'),

  // LiveKit Configuration for AI Interviews
  LIVEKIT_API_URL: z.string().url().default('http://localhost:7880'),
  LIVEKIT_WS_URL: z.string().default('ws://localhost:7880'),
  LIVEKIT_API_KEY: z.string().default('devkey'),
  LIVEKIT_API_SECRET: z.string().default('secret'),
  // LiveKit Egress Configuration
  GCP_PROJECT_ID: z.string().optional().default('teamcastai'),
  GCS_BUCKET_NAME: z.string().optional().default('teamcast-local-storage'),
  GCS_RECORDING_PREFIX: z.string().optional().default('interviews/recordings/'),
  GCS_TRANSCRIPT_PREFIX: z
    .string()
    .optional()
    .default('interviews/transcripts/'),
  LIVEKIT_EGRESS_TEMPLATE_BASE_URL: z
    .string()
    .url()
    .optional()
    .default('http://localhost:7980'),
  EGRESS_ENABLED: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    })
    .default(true),

  // OIDC Provider Configuration for Deel SSO Integration
  // Environment-driven: dev uses devapi.teamcast.ai, prod uses api.teamcast.ai
  // If not set, defaults to SERVER_URL (handled in OIDCProviderService)
  OIDC_ISSUER: z.string().url().optional(),
  OIDC_PRIVATE_KEY_PATH: z
    .string()
    .default('./keys/oidc-private-key.pem')
    .refine(
      (val) => {
        if (process.env.NODE_ENV === 'development') return true;
        return fs.existsSync(val) && fs.lstatSync(val).isFile();
      },
      {
        message: 'OIDC private key file does not exist',
      }
    ),
  OIDC_PUBLIC_KEY_PATH: z
    .string()
    .default('./keys/oidc-public-key.pem')
    .refine(
      (val) => {
        if (process.env.NODE_ENV === 'development') return true;
        return fs.existsSync(val) && fs.lstatSync(val).isFile();
      },
      {
        message: 'OIDC public key file does not exist',
      }
    ),
  OIDC_KEY_ID: z.string().default('dev-key-id'),
  OIDC_TOKEN_EXPIRY: z
    .string()
    .transform(Number)
    .refine((n) => n > 0 && n <= 3600, {
      message: 'OIDC token expiry must be between 1 and 3600 seconds',
    })
    .default('3600'),

  // Deel Integration Configuration
  DEEL_CLIENT_ID: z.string().optional(),
  DEEL_CLIENT_SECRET: z
    .string()
    .min(32, {
      message: 'DEEL_CLIENT_SECRET must be at least 32 characters for security',
    })
    .optional(),
  DEEL_REDIRECT_URI: z.string().url().optional(),
  DEEL_ENABLED: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    })
    .default(false),
});

/**
 * Validate the environment variables
 * @throws {Error} if env vars are invalid
 */
const formatErrors = (
  errors: z.ZodFormattedError<Map<string, string>, string>
) =>
  Object.entries(errors)
    .map(([name, value]) => {
      if (value && '_errors' in value)
        return `${name}: ${value._errors.join(', ')}\n`;
      return null;
    })
    .filter(Boolean);

/**
 * Parse environment variables with validation
 */
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    '❌ Invalid environment variables:\n',
    ...formatErrors(_env.error.format())
  );
  throw new Error('Invalid environment variables');
}

/**
 * Export validated environment variables
 */
export const ENV = _env.data;
