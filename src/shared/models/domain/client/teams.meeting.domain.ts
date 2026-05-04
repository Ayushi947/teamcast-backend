/**
 * @openapi
 * components:
 *   schemas:
 *     ITeamsMeetingDomain:
 *       type: object
 *       properties:
 *         meetingId:
 *           type: string
 *           description: Microsoft Teams meeting ID
 *         joinUrl:
 *           type: string
 *           description: Teams meeting join URL
 *         organizerEmail:
 *           type: string
 *           description: Email of the meeting organizer
 *         organizerName:
 *           type: string
 *           description: Name of the meeting organizer
 *         subject:
 *           type: string
 *           description: Meeting subject/title
 *         startDateTime:
 *           type: string
 *           format: date-time
 *           description: Meeting start date and time
 *         endDateTime:
 *           type: string
 *           format: date-time
 *           description: Meeting end date and time
 *         timeZone:
 *           type: string
 *           description: Meeting time zone
 *         attendees:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *           description: List of meeting attendees
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Meeting creation timestamp
 */
export interface ITeamsMeetingDomain {
  meetingId: string;
  joinUrl: string;
  organizerEmail: string;
  organizerName: string;
  subject: string;
  startDateTime: Date;
  endDateTime: Date;
  timeZone: string;
  attendees: Array<{
    email: string;
    name: string;
  }>;
  createdAt?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ITeamsMeetingCreateRequest:
 *       type: object
 *       required:
 *         - organizerEmail
 *         - organizerName
 *         - subject
 *         - startDateTime
 *         - endDateTime
 *         - timeZone
 *         - attendees
 *       properties:
 *         organizerEmail:
 *           type: string
 *           format: email
 *           description: Email of the meeting organizer
 *         organizerName:
 *           type: string
 *           description: Name of the meeting organizer
 *         subject:
 *           type: string
 *           description: Meeting subject/title
 *         startDateTime:
 *           type: string
 *           format: date-time
 *           description: Meeting start date and time
 *         endDateTime:
 *           type: string
 *           format: date-time
 *           description: Meeting end date and time
 *         timeZone:
 *           type: string
 *           description: Meeting time zone
 *         attendees:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *           description: List of meeting attendees
 */
export interface ITeamsMeetingCreateRequest {
  organizerEmail: string;
  organizerName: string;
  subject: string;
  startDateTime: Date;
  endDateTime: Date;
  timeZone: string;
  attendees: Array<{
    email: string;
    name: string;
  }>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ITeamsMeetingUpdateRequest:
 *       type: object
 *       properties:
 *         organizerEmail:
 *           type: string
 *           format: email
 *           description: Email of the meeting organizer
 *         subject:
 *           type: string
 *           description: Meeting subject/title
 *         startDateTime:
 *           type: string
 *           format: date-time
 *           description: Meeting start date and time
 *         endDateTime:
 *           type: string
 *           format: date-time
 *           description: Meeting end date and time
 *         timeZone:
 *           type: string
 *           description: Meeting time zone
 *         attendees:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *           description: List of meeting attendees
 */
export interface ITeamsMeetingUpdateRequest {
  organizerEmail?: string;
  subject?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  timeZone?: string;
  attendees?: Array<{
    email: string;
    name: string;
  }>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ITeamsMeetingResponse:
 *       type: object
 *       properties:
 *         meetingId:
 *           type: string
 *           description: Microsoft Teams meeting ID
 *         joinUrl:
 *           type: string
 *           description: Teams meeting join URL
 *         meetingLink:
 *           type: string
 *           description: Teams meeting link (same as joinUrl)
 *         organizerMeetingUrl:
 *           type: string
 *           description: Organizer-specific meeting URL
 *         message:
 *           type: string
 *           description: Success message
 */
export interface ITeamsMeetingResponse {
  meetingId: string;
  joinUrl: string;
  meetingLink: string;
  organizerMeetingUrl?: string;
  message: string;
}
