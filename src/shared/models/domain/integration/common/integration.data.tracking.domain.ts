import {
  IntegrationStatus,
  IntegrationProviderType,
  JobPostingIntegrationStatus,
  IntegrationSyncStatus,
  CandidateSource,
  SourceType,
} from '../../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationDataSummary:
 *       type: object
 *       description: Summary information about integration data imports
 *       properties:
 *         integrationId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the integration
 *         integrationName:
 *           type: string
 *           description: Name of the integration
 *         providerName:
 *           type: string
 *           description: Name of the integration provider
 *         providerType:
 *           $ref: '#/components/schemas/IntegrationProviderType'
 *           description: Type of integration provider
 *         status:
 *           $ref: '#/components/schemas/IntegrationStatus'
 *           description: Current status of the integration
 *         totalJobs:
 *           type: integer
 *           description: Total number of jobs imported from this integration
 *           minimum: 0
 *         totalCandidates:
 *           type: integer
 *           description: Total number of candidates imported from this integration
 *           minimum: 0
 *         totalCandidateInvites:
 *           type: integer
 *           description: Total number of candidate invites sent from this integration
 *           minimum: 0
 *         totalCandidateSourced:
 *           type: integer
 *           description: Total number of candidates sourced through this integration
 *           minimum: 0
 *         activeJobs:
 *           type: integer
 *           description: Number of currently active jobs from this integration
 *           minimum: 0
 *         lastSyncAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp of the last successful synchronization
 *         autoSyncEnabled:
 *           type: boolean
 *           description: Whether automatic synchronization is enabled for this integration
 *         recentActivity:
 *           type: object
 *           description: Recent activity statistics for the integration
 *           properties:
 *             jobsLast30Days:
 *               type: integer
 *               minimum: 0
 *               description: Number of jobs imported in the last 30 days
 *             candidatesLast30Days:
 *               type: integer
 *               minimum: 0
 *               description: Number of candidates imported in the last 30 days
 *           required:
 *             - jobsLast30Days
 *             - candidatesLast30Days
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the integration was created
 *       required:
 *         - integrationId
 *         - integrationName
 *         - providerName
 *         - providerType
 *         - status
 *         - totalJobs
 *         - totalCandidates
 *         - totalCandidateInvites
 *         - totalCandidateSourced
 *         - activeJobs
 *         - autoSyncEnabled
 *         - recentActivity
 *         - createdAt
 */
export interface IIntegrationDataSummary {
  integrationId: string;
  integrationName: string;
  providerName: string;
  providerType: IntegrationProviderType;
  status: IntegrationStatus;
  totalJobs: number;
  totalCandidates: number;
  totalCandidateInvites: number;
  totalCandidateSourced: number;
  activeJobs: number;
  lastSyncAt: Date | null;
  autoSyncEnabled: boolean;
  recentActivity: {
    jobsLast30Days: number;
    candidatesLast30Days: number;
  };
  createdAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationDataDetails:
 *       type: object
 *       description: Detailed information about integration data including jobs and candidates
 *       properties:
 *         integrationId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the integration
 *         integrationName:
 *           type: string
 *           description: Name of the integration
 *         providerName:
 *           type: string
 *           description: Name of the integration provider
 *         providerType:
 *           $ref: '#/components/schemas/IntegrationProviderType'
 *           description: Type of integration provider
 *         status:
 *           $ref: '#/components/schemas/IntegrationStatus'
 *           description: Current status of the integration
 *         autoSyncEnabled:
 *           type: boolean
 *           description: Whether automatic synchronization is enabled
 *         lastSyncAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp of the last successful synchronization
 *         jobs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IIntegrationJobData'
 *           description: List of jobs imported from this integration
 *         candidates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IIntegrationCandidateData'
 *           description: List of candidates imported from this integration
 *         totalJobs:
 *           type: integer
 *           minimum: 0
 *           description: Total number of jobs in this integration
 *         totalCandidates:
 *           type: integer
 *           minimum: 0
 *           description: Total number of candidates in this integration
 *         totalCandidateInvites:
 *           type: integer
 *           minimum: 0
 *           description: Total number of candidate invites sent from this integration
 *         totalCandidateSourced:
 *           type: integer
 *           minimum: 0
 *           description: Total number of candidates sourced through this integration
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the integration was created
 *       required:
 *         - integrationId
 *         - integrationName
 *         - providerName
 *         - providerType
 *         - status
 *         - autoSyncEnabled
 *         - jobs
 *         - candidates
 *         - totalJobs
 *         - totalCandidates
 *         - totalCandidateInvites
 *         - totalCandidateSourced
 *         - createdAt
 */
export interface IIntegrationDataDetails {
  integrationId: string;
  integrationName: string;
  providerName: string;
  providerType: IntegrationProviderType;
  status: IntegrationStatus;
  autoSyncEnabled: boolean;
  lastSyncAt: Date | null;
  jobs: IIntegrationJobData[];
  candidates: IIntegrationCandidateData[];
  totalJobs: number;
  totalCandidates: number;
  totalCandidateInvites: number;
  totalCandidateSourced: number;
  createdAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationJobData:
 *       type: object
 *       description: Job data imported from an integration source
 *       properties:
 *         jobId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the job posting in our system
 *         jobTitle:
 *           type: string
 *           description: Title of the job position
 *         externalJobId:
 *           type: string
 *           nullable: true
 *           description: Job identifier in the external integration system
 *         externalJobUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           description: URL to the job posting in the external system
 *         status:
 *           $ref: '#/components/schemas/JobPostingIntegrationStatus'
 *           description: Current integration status of the job posting
 *         candidateCount:
 *           type: integer
 *           minimum: 0
 *           description: Number of candidates who have applied for this job
 *         syncStatus:
 *           $ref: '#/components/schemas/IntegrationSyncStatus'
 *           nullable: true
 *           description: Current synchronization status
 *         lastSyncedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp of the last successful sync for this job
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date and time when the job was published
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the job was created in our system
 *       required:
 *         - jobId
 *         - jobTitle
 *         - status
 *         - candidateCount
 *         - createdAt
 */
export interface IIntegrationJobData {
  jobId: string;
  jobTitle: string;
  externalJobId: string | null;
  externalJobUrl: string | null;
  status: JobPostingIntegrationStatus;
  candidateCount: number;
  syncStatus: IntegrationSyncStatus | null;
  lastSyncedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationCandidateData:
 *       type: object
 *       description: Candidate data imported from an integration source
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the candidate in our system
 *         candidateName:
 *           type: string
 *           description: Full name of the candidate
 *         candidateEmail:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 *         jobId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the related job posting
 *         jobTitle:
 *           type: string
 *           description: Title of the job the candidate applied for
 *         externalCandidateId:
 *           type: string
 *           nullable: true
 *           description: Candidate identifier in the external integration system
 *         externalApplicationId:
 *           type: string
 *           nullable: true
 *           description: Application identifier in the external integration system
 *         source:
 *           $ref: '#/components/schemas/CandidateSource'
 *           description: Source of the candidate application
 *         pipelineStage:
 *           type: string
 *           nullable: true
 *           description: Current stage in the recruitment pipeline
 *         syncStatus:
 *           $ref: '#/components/schemas/IntegrationSyncStatus'
 *           nullable: true
 *           description: Current synchronization status for this candidate
 *         lastSyncedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp of the last successful sync for this candidate
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the candidate was created in our system
 *       required:
 *         - candidateId
 *         - candidateName
 *         - candidateEmail
 *         - jobId
 *         - jobTitle
 *         - source
 *         - createdAt
 */
export interface IIntegrationCandidateData {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  externalCandidateId: string | null;
  externalApplicationId: string | null;
  source: CandidateSource;
  pipelineStage: string | null;
  syncStatus: IntegrationSyncStatus | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDataImportSource:
 *       type: object
 *       description: Information about the source of imported data
 *       properties:
 *         sourceType:
 *           type: string
 *           enum: [JOB, CANDIDATE]
 *           description: Type of data that was imported
 *         sourceId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the imported entity in our system
 *         integrationId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the integration that imported this data
 *         integrationName:
 *           type: string
 *           description: Name of the integration that imported this data
 *         providerName:
 *           type: string
 *           description: Name of the integration provider
 *         providerType:
 *           $ref: '#/components/schemas/IntegrationProviderType'
 *           description: Type of integration provider
 *         externalId:
 *           type: string
 *           nullable: true
 *           description: Identifier of this entity in the external system
 *         externalUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           description: URL to view this entity in the external system
 *         importedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the data was imported
 *         lastSyncedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date and time of the last successful synchronization
 *         relatedJobId:
 *           type: string
 *           format: uuid
 *           description: Related job posting ID (applicable for candidate imports)
 *         relatedJobTitle:
 *           type: string
 *           description: Title of the related job posting (applicable for candidate imports)
 *         pipelineStage:
 *           type: string
 *           nullable: true
 *           description: Current pipeline stage (applicable for candidate imports)
 *         source:
 *           $ref: '#/components/schemas/CandidateSource'
 *           description: Source of the candidate application (applicable for candidate imports)
 *       required:
 *         - sourceType
 *         - sourceId
 *         - integrationId
 *         - integrationName
 *         - providerName
 *         - providerType
 *         - importedAt
 */
export interface IDataImportSource {
  sourceType: SourceType;
  sourceId: string;
  integrationId: string;
  integrationName: string;
  providerName: string;
  providerType: IntegrationProviderType;
  externalId: string | null;
  externalUrl: string | null;
  importedAt: Date;
  lastSyncedAt: Date | null;
  relatedJobId?: string;
  relatedJobTitle?: string;
  pipelineStage?: string | null;
  source?: CandidateSource;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDataUsageStatistics:
 *       type: object
 *       description: Comprehensive statistics about data usage across all integrations
 *       properties:
 *         totalIntegrations:
 *           type: integer
 *           minimum: 0
 *           description: Total number of integrations configured
 *         activeIntegrations:
 *           type: integer
 *           minimum: 0
 *           description: Number of currently active integrations
 *         totalJobsImported:
 *           type: integer
 *           minimum: 0
 *           description: Total number of jobs imported across all integrations
 *         totalCandidatesImported:
 *           type: integer
 *           minimum: 0
 *           description: Total number of candidates imported across all integrations
 *         totalCandidateInvites:
 *           type: integer
 *           minimum: 0
 *           description: Total number of candidate invites sent across all integrations
 *         totalCandidateSourced:
 *           type: integer
 *           minimum: 0
 *           description: Total number of candidates sourced across all integrations
 *         byProvider:
 *           type: object
 *           description: Statistics grouped by integration provider
 *           additionalProperties:
 *             type: object
 *             properties:
 *               providerName:
 *                 type: string
 *                 description: Name of the integration provider
 *               integrationCount:
 *                 type: integer
 *                 minimum: 0
 *                 description: Number of integrations for this provider
 *               jobsImported:
 *                 type: integer
 *                 minimum: 0
 *                 description: Number of jobs imported from this provider
 *               candidatesImported:
 *                 type: integer
 *                 minimum: 0
 *                 description: Number of candidates imported from this provider
 *               candidateInvites:
 *                 type: integer
 *                 minimum: 0
 *                 description: Number of candidate invites sent from this provider
 *               candidateSourced:
 *                 type: integer
 *                 minimum: 0
 *                 description: Number of candidates sourced from this provider
 *             required:
 *               - providerName
 *               - integrationCount
 *               - jobsImported
 *               - candidatesImported
 *               - candidateInvites
 *               - candidateSourced
 *         bySource:
 *           type: object
 *           description: Candidate statistics grouped by source type
 *           additionalProperties:
 *             type: integer
 *             minimum: 0
 *       required:
 *         - totalIntegrations
 *         - activeIntegrations
 *         - totalJobsImported
 *         - totalCandidatesImported
 *         - totalCandidateInvites
 *         - totalCandidateSourced
 *         - byProvider
 *         - bySource
 */
export interface IDataUsageStatistics {
  totalIntegrations: number;
  activeIntegrations: number;
  totalJobsImported: number;
  totalCandidatesImported: number;
  totalCandidateInvites: number;
  totalCandidateSourced: number;
  byProvider: Record<
    string,
    {
      providerName: string;
      integrationCount: number;
      jobsImported: number;
      candidatesImported: number;
      candidateInvites: number;
      candidateSourced: number;
    }
  >;
  bySource: Record<CandidateSource, number>;
}
