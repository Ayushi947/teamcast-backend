import {
  IntegrationProviderType,
  IntegrationStatus,
  JobPostingIntegrationStatus,
  IntegrationSyncStatus,
  CandidateSource,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationProvider:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the integration provider
 *         name:
 *           type: string
 *           description: Name of the integration provider
 *         type:
 *           $ref: '#/components/schemas/IntegrationProviderType'
 *           description: Type of integration provider
 *         description:
 *           type: string
 *           description: Description of the integration provider
 *         logoUrl:
 *           type: string
 *           format: uri
 *           description: URL to the provider's logo
 *         websiteUrl:
 *           type: string
 *           format: uri
 *           description: URL to the provider's website
 *         apiEndpoint:
 *           type: string
 *           format: uri
 *           description: API endpoint for the provider
 *         apiVersion:
 *           type: string
 *           description: API version supported by the provider
 *         authType:
 *           type: string
 *           description: Type of authentication required
 *         authConfig:
 *           type: object
 *           description: Authentication configuration
 *         supportsJobImport:
 *           type: boolean
 *           description: Whether the provider supports job import
 *         supportsJobPublish:
 *           type: boolean
 *           description: Whether the provider supports job publishing
 *         supportsCandidateImport:
 *           type: boolean
 *           description: Whether the provider supports candidate import
 *         supportsCandidatePush:
 *           type: boolean
 *           description: Whether the provider supports candidate push
 *         supportsPipelineUpdate:
 *           type: boolean
 *           description: Whether the provider supports pipeline updates
 *         rateLimitPerMinute:
 *           type: integer
 *           description: Rate limit per minute
 *         rateLimitPerHour:
 *           type: integer
 *           description: Rate limit per hour
 *         isActive:
 *           type: boolean
 *           description: Whether the provider is active
 *         isVerified:
 *           type: boolean
 *           description: Whether the provider is verified
 *         metadata:
 *           type: object
 *           description: Additional metadata for the provider
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the provider was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the provider was last updated
 */
export interface IIntegrationProvider {
  id: string;
  name: string;
  type: IntegrationProviderType;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  apiEndpoint?: string;
  apiVersion?: string;
  authType?: string;
  authConfig?: Record<string, any>;
  supportsJobImport: boolean;
  supportsJobPublish: boolean;
  supportsCandidateImport: boolean;
  supportsCandidatePush: boolean;
  supportsPipelineUpdate: boolean;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  isActive: boolean;
  isVerified: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     toIIntegrationProvider:
 *       type: function
 *       description: Converts an integration provider database entity to a domain model
 */
export const toIIntegrationProvider = (
  integrationProvider: any
): IIntegrationProvider => {
  return {
    id: integrationProvider.id,
    name: integrationProvider.name,
    type: integrationProvider.type,
    description: integrationProvider.description,
    logoUrl: integrationProvider.logoUrl,
    websiteUrl: integrationProvider.websiteUrl,
    apiEndpoint: integrationProvider.apiEndpoint,
    apiVersion: integrationProvider.apiVersion,
    authType: integrationProvider.authType,
    authConfig: integrationProvider.authConfig,
    supportsJobImport: integrationProvider.supportsJobImport,
    supportsJobPublish: integrationProvider.supportsJobPublish,
    supportsCandidateImport: integrationProvider.supportsCandidateImport,
    supportsCandidatePush: integrationProvider.supportsCandidatePush,
    supportsPipelineUpdate: integrationProvider.supportsPipelineUpdate,
    rateLimitPerMinute: integrationProvider.rateLimitPerMinute,
    rateLimitPerHour: integrationProvider.rateLimitPerHour,
    isActive: integrationProvider.isActive,
    isVerified: integrationProvider.isVerified,
    metadata: integrationProvider.metadata,
    createdAt: integrationProvider.createdAt,
    updatedAt: integrationProvider.updatedAt,
  };
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientIntegration:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the client integration
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the client organization
 *         providerId:
 *           type: string
 *           format: uuid
 *           description: ID of the integration provider
 *         name:
 *           type: string
 *           description: Name of the integration
 *         description:
 *           type: string
 *           description: Description of the integration
 *         status:
 *           $ref: '#/components/schemas/IntegrationStatus'
 *           description: Current status of the integration
 *         credentials:
 *           type: object
 *           description: Integration credentials
 *         config:
 *           type: object
 *           description: Integration configuration
 *         autoSyncEnabled:
 *           type: boolean
 *           description: Whether automatic synchronization is enabled
 *         syncInterval:
 *           type: integer
 *           description: Synchronization interval in minutes
 *         lastSyncAt:
 *           type: string
 *           format: date-time
 *           description: When the last sync occurred
 *         nextSyncAt:
 *           type: string
 *           format: date-time
 *           description: When the next sync is scheduled
 *         lastError:
 *           type: string
 *           description: Last error message
 *         lastErrorAt:
 *           type: string
 *           format: date-time
 *           description: When the last error occurred
 *         errorCount:
 *           type: integer
 *           description: Number of consecutive errors
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the integration was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the integration was last updated
 */
export interface IClientIntegration {
  id: string;
  clientId: string;
  providerId: string;
  name: string;
  description?: string;
  status: IntegrationStatus;
  credentials?: Record<string, any>;
  config?: Record<string, any>;
  autoSyncEnabled: boolean;
  syncInterval?: number;
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  lastError?: string;
  lastErrorAt?: Date;
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     toIClientIntegration:
 *       type: function
 *       description: Converts a client integration database entity to a domain model
 */
export const toIClientIntegration = (
  clientIntegration: any
): IClientIntegration => {
  return {
    id: clientIntegration.id,
    clientId: clientIntegration.clientId,
    providerId: clientIntegration.providerId,
    name: clientIntegration.name,
    description: clientIntegration.description,
    status: clientIntegration.status,
    credentials: clientIntegration.credentials,
    config: clientIntegration.config,
    autoSyncEnabled: clientIntegration.autoSyncEnabled,
    syncInterval: clientIntegration.syncInterval,
    lastSyncAt: clientIntegration.lastSyncAt,
    nextSyncAt: clientIntegration.nextSyncAt,
    lastError: clientIntegration.lastError,
    lastErrorAt: clientIntegration.lastErrorAt,
    errorCount: clientIntegration.errorCount,
    createdAt: clientIntegration.createdAt,
    updatedAt: clientIntegration.updatedAt,
  };
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingIntegration:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the job posting integration
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         clientIntegrationId:
 *           type: string
 *           format: uuid
 *           description: ID of the client integration
 *         externalJobId:
 *           type: string
 *           description: External job ID from the provider
 *         externalJobUrl:
 *           type: string
 *           format: uri
 *           description: URL to the external job posting
 *         externalJobData:
 *           type: object
 *           description: Additional data from the external job posting
 *         status:
 *           $ref: '#/components/schemas/JobPostingIntegrationStatus'
 *           description: Current status of the job posting integration
 *         lastSyncedAt:
 *           type: string
 *           format: date-time
 *           description: When the job posting was last synced
 *         syncStatus:
 *           $ref: '#/components/schemas/IntegrationSyncStatus'
 *           description: Status of the last sync operation
 *         syncError:
 *           type: string
 *           description: Error message from the last sync
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           description: When the job posting was published
 *         publishedBy:
 *           type: string
 *           description: User who published the job posting
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the integration was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the integration was last updated
 */
export interface IJobPostingIntegration {
  id: string;
  jobPostingId: string;
  clientIntegrationId: string;
  externalJobId?: string;
  externalJobUrl?: string;
  externalJobData?: Record<string, any>;
  status: JobPostingIntegrationStatus;
  lastSyncedAt?: Date;
  syncStatus?: IntegrationSyncStatus;
  syncError?: string;
  publishedAt?: Date;
  publishedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     toIJobPostingIntegration:
 *       type: function
 *       description: Converts a job posting integration database entity to a domain model
 */
export const toIJobPostingIntegration = (
  jobPostingIntegration: any
): IJobPostingIntegration => {
  return {
    id: jobPostingIntegration.id,
    jobPostingId: jobPostingIntegration.jobPostingId,
    clientIntegrationId: jobPostingIntegration.clientIntegrationId,
    externalJobId: jobPostingIntegration.externalJobId,
    externalJobUrl: jobPostingIntegration.externalJobUrl,
    externalJobData: jobPostingIntegration.externalJobData,
    status: jobPostingIntegration.status,
    lastSyncedAt: jobPostingIntegration.lastSyncedAt,
    syncStatus: jobPostingIntegration.syncStatus,
    syncError: jobPostingIntegration.syncError,
    publishedAt: jobPostingIntegration.publishedAt,
    publishedBy: jobPostingIntegration.publishedBy,
    createdAt: jobPostingIntegration.createdAt,
    updatedAt: jobPostingIntegration.updatedAt,
  };
};

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateIntegration:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the candidate integration
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate
 *         jobPostingIntegrationId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting integration
 *         externalCandidateId:
 *           type: string
 *           description: External candidate ID from the provider
 *         externalApplicationId:
 *           type: string
 *           description: External application ID from the provider
 *         externalCandidateData:
 *           type: object
 *           description: Additional data from the external candidate
 *         source:
 *           $ref: '#/components/schemas/CandidateSource'
 *           description: Source of the candidate data
 *         lastSyncedAt:
 *           type: string
 *           format: date-time
 *           description: When the candidate was last synced
 *         syncStatus:
 *           $ref: '#/components/schemas/IntegrationSyncStatus'
 *           description: Status of the last sync operation
 *         syncError:
 *           type: string
 *           description: Error message from the last sync
 *         pipelineStage:
 *           type: string
 *           description: Current pipeline stage
 *         pipelineStageId:
 *           type: string
 *           description: ID of the pipeline stage
 *         pipelineData:
 *           type: object
 *           description: Additional pipeline data
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the integration was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the integration was last updated
 */
export interface ICandidateIntegration {
  id: string;
  candidateId: string;
  jobPostingIntegrationId: string;
  externalCandidateId?: string;
  externalApplicationId?: string;
  externalCandidateData?: Record<string, any>;
  source: CandidateSource;
  lastSyncedAt?: Date;
  syncStatus?: IntegrationSyncStatus;
  syncError?: string;
  pipelineStage?: string;
  pipelineStageId?: string;
  pipelineData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     toICandidateIntegration:
 *       type: function
 *       description: Converts a candidate integration database entity to a domain model
 */
export const toICandidateIntegration = (
  candidateIntegration: any
): ICandidateIntegration => {
  return {
    id: candidateIntegration.id,
    candidateId: candidateIntegration.candidateId,
    jobPostingIntegrationId: candidateIntegration.jobPostingIntegrationId,
    externalCandidateId: candidateIntegration.externalCandidateId,
    externalApplicationId: candidateIntegration.externalApplicationId,
    externalCandidateData: candidateIntegration.externalCandidateData,
    source: candidateIntegration.source,
    lastSyncedAt: candidateIntegration.lastSyncedAt,
    syncStatus: candidateIntegration.syncStatus,
    syncError: candidateIntegration.syncError,
    pipelineStage: candidateIntegration.pipelineStage,
    pipelineStageId: candidateIntegration.pipelineStageId,
    pipelineData: candidateIntegration.pipelineData,
    createdAt: candidateIntegration.createdAt,
    updatedAt: candidateIntegration.updatedAt,
  };
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationSyncTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the sync task
 *         clientIntegrationId:
 *           type: string
 *           format: uuid
 *           description: ID of the client integration
 *         taskType:
 *           type: string
 *           description: Type of sync task
 *         status:
 *           $ref: '#/components/schemas/IntegrationSyncStatus'
 *           description: Current status of the sync task
 *         requestData:
 *           type: object
 *           description: Request data for the sync task
 *         responseData:
 *           type: object
 *           description: Response data from the sync task
 *         errorData:
 *           type: object
 *           description: Error data from the sync task
 *         progress:
 *           type: number
 *           description: Progress percentage of the sync task
 *         totalItems:
 *           type: integer
 *           description: Total number of items to process
 *         processedItems:
 *           type: integer
 *           description: Number of items processed
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the sync task started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the sync task completed
 *         estimatedCompletion:
 *           type: string
 *           format: date-time
 *           description: Estimated completion time
 *         retryCount:
 *           type: integer
 *           description: Number of retry attempts
 *         maxRetries:
 *           type: integer
 *           description: Maximum number of retry attempts
 *         nextRetryAt:
 *           type: string
 *           format: date-time
 *           description: When the next retry is scheduled
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the sync task was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the sync task was last updated
 */
export interface IIntegrationSyncTask {
  id: string;
  clientIntegrationId: string;
  taskType: string;
  status: IntegrationSyncStatus;
  requestData?: Record<string, any>;
  responseData?: Record<string, any>;
  errorData?: Record<string, any>;
  progress: number;
  totalItems?: number;
  processedItems: number;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     toIIntegrationSyncTask:
 *       type: function
 *       description: Converts an integration sync task database entity to a domain model
 */
export const toIIntegrationSyncTask = (
  integrationSyncTask: any
): IIntegrationSyncTask => {
  return {
    id: integrationSyncTask.id,
    clientIntegrationId: integrationSyncTask.clientIntegrationId,
    taskType: integrationSyncTask.taskType,
    status: integrationSyncTask.status,
    requestData: integrationSyncTask.requestData,
    responseData: integrationSyncTask.responseData,
    errorData: integrationSyncTask.errorData,
    progress: integrationSyncTask.progress,
    totalItems: integrationSyncTask.totalItems,
    processedItems: integrationSyncTask.processedItems,
    startedAt: integrationSyncTask.startedAt,
    completedAt: integrationSyncTask.completedAt,
    estimatedCompletion: integrationSyncTask.estimatedCompletion,
    retryCount: integrationSyncTask.retryCount,
    maxRetries: integrationSyncTask.maxRetries,
    nextRetryAt: integrationSyncTask.nextRetryAt,
    createdAt: integrationSyncTask.createdAt,
    updatedAt: integrationSyncTask.updatedAt,
  };
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationWebhook:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the webhook
 *         clientIntegrationId:
 *           type: string
 *           format: uuid
 *           description: ID of the client integration
 *         endpoint:
 *           type: string
 *           format: uri
 *           description: Webhook endpoint URL
 *         secret:
 *           type: string
 *           description: Webhook secret for verification
 *         events:
 *           type: array
 *           items:
 *             type: string
 *           description: List of events to trigger the webhook
 *         isActive:
 *           type: boolean
 *           description: Whether the webhook is active
 *         lastTriggeredAt:
 *           type: string
 *           format: date-time
 *           description: When the webhook was last triggered
 *         totalTriggers:
 *           type: integer
 *           description: Total number of webhook triggers
 *         successfulTriggers:
 *           type: integer
 *           description: Number of successful webhook triggers
 *         failedTriggers:
 *           type: integer
 *           description: Number of failed webhook triggers
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the webhook was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the webhook was last updated
 */
export interface IIntegrationWebhook {
  id: string;
  clientIntegrationId: string;
  endpoint: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt?: Date;
  totalTriggers: number;
  successfulTriggers: number;
  failedTriggers: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     toIIntegrationWebhook:
 *       type: function
 *       description: Converts an integration webhook database entity to a domain model
 */
export const toIIntegrationWebhook = (
  integrationWebhook: any
): IIntegrationWebhook => {
  return {
    id: integrationWebhook.id,
    clientIntegrationId: integrationWebhook.clientIntegrationId,
    endpoint: integrationWebhook.endpoint,
    secret: integrationWebhook.secret,
    events: integrationWebhook.events,
    isActive: integrationWebhook.isActive,
    lastTriggeredAt: integrationWebhook.lastTriggeredAt,
    totalTriggers: integrationWebhook.totalTriggers,
    successfulTriggers: integrationWebhook.successfulTriggers,
    failedTriggers: integrationWebhook.failedTriggers,
    createdAt: integrationWebhook.createdAt,
    updatedAt: integrationWebhook.updatedAt,
  };
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationAuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the audit log entry
 *         clientIntegrationId:
 *           type: string
 *           format: uuid
 *           description: ID of the client integration
 *         action:
 *           type: string
 *           description: Action performed
 *         entityType:
 *           type: string
 *           description: Type of entity affected
 *         entityId:
 *           type: string
 *           description: ID of the entity affected
 *         oldData:
 *           type: object
 *           description: Previous data before the action
 *         newData:
 *           type: object
 *           description: New data after the action
 *         metadata:
 *           type: object
 *           description: Additional metadata about the action
 *         performedBy:
 *           type: string
 *           description: User who performed the action
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the audit log entry was created
 */
export interface IIntegrationAuditLog {
  id: string;
  clientIntegrationId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  metadata?: Record<string, any>;
  performedBy?: string;
  createdAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     toIIntegrationAuditLog:
 *       type: function
 *       description: Converts an integration audit log database entity to a domain model
 */
export const toIIntegrationAuditLog = (
  integrationAuditLog: any
): IIntegrationAuditLog => {
  return {
    id: integrationAuditLog.id,
    clientIntegrationId: integrationAuditLog.clientIntegrationId,
    action: integrationAuditLog.action,
    entityType: integrationAuditLog.entityType,
    entityId: integrationAuditLog.entityId,
    oldData: integrationAuditLog.oldData,
    newData: integrationAuditLog.newData,
    metadata: integrationAuditLog.metadata,
    performedBy: integrationAuditLog.performedBy,
    createdAt: integrationAuditLog.createdAt,
  };
};

/**
 * @openapi
 * components:
 *   parameters:
 *     IIntegrationIdParams:
 *       in: path
 *       name: integrationId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Unique identifier of the integration
 */
export type IIntegrationIdParams = {
  integrationId: string;
};

/**
 * @openapi
 * components:
 *   parameters:
 *     IClientIntegrationIdParams:
 *       in: path
 *       name: clientIntegrationId
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Unique identifier of the client integration
 */
export type IClientIntegrationIdParams = {
  clientIntegrationId: string;
};

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientIntegrationCreate:
 *       type: object
 *       required:
 *         - providerId
 *         - name
 *       properties:
 *         providerId:
 *           type: string
 *           format: uuid
 *           description: ID of the integration provider
 *         name:
 *           type: string
 *           description: Name of the integration
 *         description:
 *           type: string
 *           description: Description of the integration
 *         credentials:
 *           type: object
 *           description: Integration credentials
 *         config:
 *           type: object
 *           description: Integration configuration
 *         autoSyncEnabled:
 *           type: boolean
 *           description: Whether automatic synchronization is enabled
 *         syncInterval:
 *           type: integer
 *           description: Synchronization interval in minutes
 */
export interface IClientIntegrationCreate {
  providerId: string;
  name: string;
  description?: string;
  credentials?: Record<string, any>;
  config?: Record<string, any>;
  autoSyncEnabled?: boolean;
  syncInterval?: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientIntegrationUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the integration
 *         description:
 *           type: string
 *           description: Description of the integration
 *         status:
 *           $ref: '#/components/schemas/IntegrationStatus'
 *           description: Status of the integration
 *         credentials:
 *           type: object
 *           description: Integration credentials
 *         config:
 *           type: object
 *           description: Integration configuration
 *         autoSyncEnabled:
 *           type: boolean
 *           description: Whether automatic synchronization is enabled
 *         syncInterval:
 *           type: integer
 *           description: Synchronization interval in minutes
 */
export interface IClientIntegrationUpdate {
  name?: string;
  description?: string;
  status?: IntegrationStatus;
  credentials?: Record<string, any>;
  config?: Record<string, any>;
  autoSyncEnabled?: boolean;
  syncInterval?: number;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     IClientIntegrationFilterQueryName:
 *       in: query
 *       name: name
 *       required: false
 *       schema:
 *         type: string
 *         description: Filter by integration name
 *     IClientIntegrationFilterQueryStatus:
 *       in: query
 *       name: status
 *       required: false
 *       schema:
 *         $ref: '#/components/schemas/IntegrationStatus'
 *         description: Filter by integration status
 *     IClientIntegrationFilterQueryProviderId:
 *       in: query
 *       name: providerId
 *       required: false
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Filter by provider ID
 */
export interface IClientIntegrationFilterQuery {
  name?: string;
  status?: IntegrationStatus;
  providerId?: string;
}
