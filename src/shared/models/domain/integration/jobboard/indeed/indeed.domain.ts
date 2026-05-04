import { CandidateSource } from '../../../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPostingPublish:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Job title
 *         description:
 *           type: string
 *           description: Job description
 *         location:
 *           type: string
 *           description: Job location
 *         company:
 *           type: string
 *           description: Company name
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *           description: Job requirements
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: Required skills
 *         salaryMin:
 *           type: number
 *           description: Minimum salary
 *         salaryMax:
 *           type: number
 *           description: Maximum salary
 *         employmentType:
 *           type: string
 *           description: Employment type (full-time, part-time, etc.)
 *         workLocation:
 *           type: string
 *           description: Work location type (remote, onsite, hybrid)
 *         applicationUrl:
 *           type: string
 *           description: URL for job applications
 */
export interface IJobPostingPublish {
  title: string;
  description: string;
  location: string;
  company: string;
  requirements: string[];
  skills: string[];
  salaryMin?: number;
  salaryMax?: number;
  employmentType: string;
  workLocation: string;
  applicationUrl: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICandidateImport:
 *       type: object
 *       properties:
 *         externalCandidateId:
 *           type: string
 *           description: External candidate ID from Indeed
 *         externalApplicationId:
 *           type: string
 *           description: External application ID from Indeed
 *         firstName:
 *           type: string
 *           description: Candidate's first name
 *         lastName:
 *           type: string
 *           description: Candidate's last name
 *         email:
 *           type: string
 *           description: Candidate's email
 *         phone:
 *           type: string
 *           description: Candidate's phone number
 *         resumeUrl:
 *           type: string
 *           description: URL to candidate's resume
 *         appliedAt:
 *           type: string
 *           format: date-time
 *           description: When the candidate applied
 *         status:
 *           type: string
 *           description: Application status
 *         source:
 *           $ref: '#/components/schemas/CandidateSource'
 *           description: Source of the candidate
 *         externalData:
 *           type: object
 *           description: Raw data from Indeed
 */
export interface ICandidateImport {
  externalCandidateId: string;
  externalApplicationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  appliedAt: Date;
  status: string;
  source: CandidateSource;
  externalData: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedOAuthConfig:
 *       type: object
 *       properties:
 *         clientId:
 *           type: string
 *           description: Indeed OAuth client ID
 *         clientSecret:
 *           type: string
 *           description: Indeed OAuth client secret
 *         redirectUri:
 *           type: string
 *           description: OAuth redirect URI
 *         baseUrl:
 *           type: string
 *           description: Indeed API base URL
 */
export interface IIndeedOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedTokenResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: Access token
 *         refreshToken:
 *           type: string
 *           description: Refresh token
 *         expiresIn:
 *           type: number
 *           description: Token expiration time in seconds
 */
export interface IIndeedTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedJobPublishResponse:
 *       type: object
 *       properties:
 *         externalJobId:
 *           type: string
 *           description: External job ID from Indeed
 *         externalJobUrl:
 *           type: string
 *           description: URL to the job on Indeed
 *         status:
 *           type: string
 *           description: Job status
 */
export interface IIndeedJobPublishResponse {
  externalJobId: string;
  externalJobUrl: string;
  status: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedCallbackParams:
 *       type: object
 *       properties:
 *         clientIntegrationId:
 *           type: string
 *           format: uuid
 *           description: Client integration ID
 */
export interface IIndeedCallbackParams {
  clientIntegrationId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedJobPublishParams:
 *       type: object
 *       properties:
 *         clientIntegrationId:
 *           type: string
 *           format: uuid
 *           description: Client integration ID
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: Job posting ID
 */
export interface IIndeedJobPublishParams {
  clientIntegrationId: string;
  jobPostingId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIndeedCandidateImportParams:
 *       type: object
 *       properties:
 *         clientIntegrationId:
 *           type: string
 *           format: uuid
 *           description: Client integration ID
 *         jobPostingIntegrationId:
 *           type: string
 *           format: uuid
 *           description: Job posting integration ID
 */
export interface IIndeedCandidateImportParams {
  clientIntegrationId: string;
  jobPostingIntegrationId: string;
}
