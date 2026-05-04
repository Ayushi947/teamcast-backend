import { IApiResponse } from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     IGenerateMeetingLinkRequest:
 *       type: object
 *       required:
 *         - organizerEmail
 *         - organizerName
 *       properties:
 *         organizerEmail:
 *           type: string
 *           format: email
 *           description: Email of the meeting organizer
 *           example: "john.doe@company.com"
 *         organizerName:
 *           type: string
 *           description: Name of the meeting organizer
 *           example: "John Doe"
 *         useTeams:
 *           type: boolean
 *           description: Whether to use Microsoft Teams integration or external platform
 *           default: true
 *           example: true
 *         manualMeetingLink:
 *           type: string
 *           format: uri
 *           description: Manual meeting link when useTeams is false (required if useTeams is false)
 *           example: "https://zoom.us/j/1234567890"
 *         manualEventId:
 *           type: string
 *           description: Optional external platform event ID
 *           example: "zoom_meeting_123"
 */
export interface IGenerateMeetingLinkRequest {
  organizerEmail: string;
  organizerName: string;
  useTeams?: boolean;
  manualMeetingLink?: string;
  manualEventId?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IUpdateMeetingRequest:
 *       type: object
 *       required:
 *         - organizerEmail
 *       properties:
 *         organizerEmail:
 *           type: string
 *           format: email
 *           description: Email of the meeting organizer
 *           example: "john.doe@company.com"
 */
export interface IUpdateMeetingRequest {
  organizerEmail: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ICancelMeetingRequest:
 *       type: object
 *       required:
 *         - organizerEmail
 *       properties:
 *         organizerEmail:
 *           type: string
 *           format: email
 *           description: Email of the meeting organizer
 *           example: "john.doe@company.com"
 */
export interface ICancelMeetingRequest {
  organizerEmail: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IMeetingLinkApiResponse:
 *       type: object
 *       properties:
 *         meetingLink:
 *           type: string
 *           description: Meeting join URL (Teams or external platform)
 *           example: "https://teams.microsoft.com/l/meetup-join/..."
 *         eventId:
 *           type: string
 *           description: Meeting/event ID (Teams or external platform)
 *           example: "AAMkAGE3..."
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Meeting link has been generated and sent to all participants"
 */
export interface IMeetingLinkApiResponse {
  meetingLink: string;
  eventId?: string;
  message: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IMeetingCancelApiResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Meeting cancelled successfully"
 */
export interface IMeetingCancelApiResponse {
  message: string;
}

// API Response wrappers
/**
 * @openapi
 * components:
 *   schemas:
 *     IGenerateMeetingLinkApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IMeetingLinkApiResponse'
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Meeting link has been generated and sent to all participants"
 */
export type IGenerateMeetingLinkApiResponse =
  IApiResponse<IMeetingLinkApiResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IUpdateMeetingApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IMeetingLinkApiResponse'
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Meeting has been updated successfully"
 */
export type IUpdateMeetingApiResponse = IApiResponse<IMeetingLinkApiResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ICancelMeetingApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IMeetingCancelApiResponse'
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Meeting cancelled successfully"
 */
export type ICancelMeetingApiResponse = IApiResponse<IMeetingCancelApiResponse>;
