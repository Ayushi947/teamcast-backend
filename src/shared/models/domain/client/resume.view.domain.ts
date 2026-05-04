/**
 * @openapi
 * components:
 *   schemas:
 *     IClientResumeViewRequest:
 *       type: object
 *       description: Domain model for client resume download request
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate whose resume to view
 *       required:
 *         - candidateId
 *
 */
export interface IClientResumeViewRequest {
  candidateId: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientResumeViewResponse:
 *       type: object
 *       description: Domain model for client resume view response
 *       properties:
 *         viewUrl:
 *           type: string
 *           description: Pre-signed URL for viewing the resume file
 *         fileName:
 *           type: string
 *           description: Original filename of the resume
 *         fileSize:
 *           type: number
 *           description: Size of the resume file in bytes
 *         mimeType:
 *           type: string
 *           description: MIME type of the resume file
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the view URL expires
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate
 *         candidateName:
 *           type: string
 *           description: Name of the candidate
 *         viewedAt:
 *           type: string
 *           format: date-time
 *           description: When the view was initiated
 *       required:
 *         - viewUrl
 *         - fileName
 *         - fileSize
 *         - mimeType
 *         - expiresAt
 *         - candidateId
 *         - candidateName
 *         - viewedAt
 */
export interface IClientResumeViewResponse {
  viewUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  expiresAt: Date;
  candidateId: string;
  candidateName: string;
  viewedAt: Date;
}
