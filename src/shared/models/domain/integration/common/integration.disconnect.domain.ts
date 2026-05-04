/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationDisconnectRequest:
 *       type: object
 *       description: Request payload for disconnecting an integration from the system
 *       properties:
 *         reason:
 *           type: string
 *           description: Optional reason for disconnecting the integration
 *           example: "Integration no longer needed"
 *           maxLength: 500
 *         removeData:
 *           type: boolean
 *           description: Whether to remove all imported data from this integration
 *           example: true
 *         preserveJobsWithApplications:
 *           type: boolean
 *           description: Whether to preserve jobs that have candidate applications even when removing data
 *           example: true
 *           default: false
 *       required:
 *         - removeData
 */
export interface IIntegrationDisconnectRequest {
  reason?: string;
  removeData: boolean;
  preserveJobsWithApplications?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationDisconnectResponse:
 *       type: object
 *       description: Response from the integration disconnection operation
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the disconnection operation was successful
 *           example: true
 *         integrationId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the disconnected integration
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         message:
 *           type: string
 *           description: Human-readable message describing the result of the operation
 *           example: "Integration disconnected successfully"
 *         disconnectedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the disconnection occurred
 *           example: "2024-01-15T10:30:00Z"
 *         dataSummary:
 *           $ref: '#/components/schemas/IIntegrationDisconnectSummary'
 *           description: Summary of all data that was associated with this integration
 *         removedData:
 *           $ref: '#/components/schemas/IIntegrationDisconnectSummary'
 *           nullable: true
 *           description: Summary of data that was actually removed (only present if removeData was true)
 *       required:
 *         - success
 *         - integrationId
 *         - message
 *         - disconnectedAt
 *         - dataSummary
 */
export interface IIntegrationDisconnectResponse {
  success: boolean;
  integrationId: string;
  message: string;
  disconnectedAt: Date;
  dataSummary: IIntegrationDisconnectSummary;
  removedData?: IIntegrationDisconnectSummary;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IIntegrationDisconnectSummary:
 *       type: object
 *       description: Summary of data entities affected by the integration disconnect operation
 *       properties:
 *         totalJobs:
 *           type: integer
 *           minimum: 0
 *           description: Total number of job postings affected by the disconnect
 *           example: 25
 *         totalCandidates:
 *           type: integer
 *           minimum: 0
 *           description: Total number of candidates affected by the disconnect
 *           example: 150
 *         jobsWithApplications:
 *           type: integer
 *           minimum: 0
 *           description: Number of jobs that have at least one candidate application
 *           example: 18
 *         totalApplications:
 *           type: integer
 *           minimum: 0
 *           description: Total number of candidate applications for all affected jobs
 *           example: 150
 *         affectedEntities:
 *           type: object
 *           description: Lists of specific entity IDs affected by the disconnect
 *           properties:
 *             jobPostings:
 *               type: array
 *               items:
 *                 type: string
 *                 format: uuid
 *               description: List of job posting IDs that were affected
 *               example: ["123e4567-e89b-12d3-a456-426614174001", "123e4567-e89b-12d3-a456-426614174002"]
 *             candidates:
 *               type: array
 *               items:
 *                 type: string
 *                 format: uuid
 *               description: List of candidate IDs that were affected
 *               example: ["223e4567-e89b-12d3-a456-426614174001", "223e4567-e89b-12d3-a456-426614174002"]
 *           required:
 *             - jobPostings
 *             - candidates
 *       required:
 *         - totalJobs
 *         - totalCandidates
 *         - jobsWithApplications
 *         - totalApplications
 *         - affectedEntities
 */
export interface IIntegrationDisconnectSummary {
  totalJobs: number;
  totalCandidates: number;
  jobsWithApplications: number;
  totalApplications: number;
  affectedEntities: {
    jobPostings: string[];
    candidates: string[];
  };
}
