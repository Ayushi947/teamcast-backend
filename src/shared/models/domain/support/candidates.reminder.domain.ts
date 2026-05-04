/**
 * @openapi
 * components:
 *   schemas:
 *     ISendOnboardingReminderRequest:
 *       type: object
 *       required:
 *         - candidateId
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the candidate
 *     ISendOnboardingReminderResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the reminder was sent successfully
 *         message:
 *           type: string
 *           description: Response message
 *         candidateEmail:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 *         candidateName:
 *           type: string
 *           description: Name of the candidate
 */

export interface ISendOnboardingReminderRequest {
  candidateId: string;
}

export interface ISendOnboardingReminderResponse {
  success: boolean;
  message: string;
  candidateEmail?: string;
  candidateName?: string;
}
