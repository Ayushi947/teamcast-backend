import { IApiRequest, IApiResponse } from '../common/common.api';
import { ISendOnboardingReminderRequest } from '../../domain/support/candidates.reminder.domain';

export { ISendOnboardingReminderRequest };

/**
 * @openapi
 * components:
 *   schemas:
 *     ISendOnboardingReminderResponseData:
 *       type: object
 *       properties:
 *         candidateEmail:
 *           type: string
 *           description: Email address of the candidate
 *         candidateName:
 *           type: string
 *           description: Name of the candidate
 */
export interface ISendOnboardingReminderResponseData {
  candidateEmail?: string;
  candidateName?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISendOnboardingReminderApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ISendOnboardingReminderResponseData'
 */
export type ISendOnboardingReminderApiResponse =
  IApiResponse<ISendOnboardingReminderResponseData>;

export type ISendOnboardingReminderApiRequest =
  IApiRequest<ISendOnboardingReminderRequest>;

// Re-export for backward compatibility if needed, or remove if we update all usages
export type SendOnboardingReminderRequest = ISendOnboardingReminderRequest;
export type SendOnboardingReminderResponse = ISendOnboardingReminderApiResponse;
