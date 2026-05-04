import { singleton } from '@/shared/decorators/singleton';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';

export interface ITeamsMeetingRequest {
  subject: string;
  startDateTime: Date;
  endDateTime: Date;
  timeZone: string;
  attendees: Array<{
    email: string;
    name: string;
  }>;
  organizer: {
    email: string;
    name: string;
  };
  candidateName?: string; // Add optional candidate name for context
}

export interface ITeamsMeetingResponse {
  meetingId: string;
  joinUrl: string;
  meetingLink: string;
  organizerMeetingUrl?: string;
}

export enum MeetingContentType {
  PANEL_MEMBERS = 'panel_members',
  CANDIDATE = 'candidate',
}

@singleton
export class TeamsService {
  private readonly baseUrl: string;
  private readonly tenantId?: string;
  private readonly clientId?: string;
  private readonly clientSecret?: string;

  constructor() {
    this.baseUrl =
      process.env.MICROSOFT_GRAPH_BASE_URL ||
      'https://graph.microsoft.com/v1.0';
    this.tenantId = process.env.AZURE_TENANT_ID;
    this.clientId = process.env.AZURE_CLIENT_ID;
    this.clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!this.tenantId || !this.clientId || !this.clientSecret) {
      logger.warn(
        'Microsoft Teams configuration not found. Teams meeting creation will be disabled.',
        {
          context: 'TeamsService.constructor',
        }
      );
    }
  }

  /**
   * Check if Teams integration is configured
   */
  isConfigured(): boolean {
    return !!(this.tenantId && this.clientId && this.clientSecret);
  }

  /**
   * Create a Teams meeting for panel interview
   */
  async createPanelInterviewMeeting(
    request: ITeamsMeetingRequest
  ): Promise<ITeamsMeetingResponse> {
    try {
      logger.info('Creating Teams meeting for panel interview', {
        context: 'TeamsService.createPanelInterviewMeeting',
        subject: request.subject,
        startDateTime: request.startDateTime.toISOString(),
      });

      if (!this.isConfigured()) {
        throw new AppError(
          'Microsoft Teams integration is not configured',
          500,
          ErrorCode.SERVICE_UNAVAILABLE
        );
      }

      const accessToken = await this.getAccessToken();

      const meetingRequest = {
        subject: request.subject,
        body: {
          contentType: 'HTML',
          content: this.buildMeetingBodyContent(request),
        },
        start: {
          dateTime: request.startDateTime.toISOString(),
          timeZone: request.timeZone,
        },
        end: {
          dateTime: request.endDateTime.toISOString(),
          timeZone: request.timeZone,
        },
        attendees: request.attendees.map((attendee) => ({
          emailAddress: {
            address: attendee.email,
            name: attendee.name,
          },
          type: 'required',
        })),
        isOnlineMeeting: true,
        onlineMeetingProvider: 'teamsForBusiness',
      };

      const response = await this.makeGraphRequest(
        `/users/${request.organizer.email}/events`,
        'POST',
        meetingRequest,
        accessToken
      );

      if (!response.onlineMeeting) {
        throw new AppError(
          'Failed to create Teams meeting - no online meeting data returned',
          500,
          ErrorCode.EXTERNAL_SERVICE_ERROR
        );
      }

      const meetingResponse: ITeamsMeetingResponse = {
        meetingId: response.id,
        joinUrl: response.onlineMeeting.joinUrl,
        meetingLink: response.onlineMeeting.joinUrl,
        organizerMeetingUrl: response.webLink,
      };

      logger.info('Teams meeting created successfully', {
        context: 'TeamsService.createPanelInterviewMeeting',
        meetingId: meetingResponse.meetingId,
        subject: request.subject,
      });

      return meetingResponse;
    } catch (error) {
      logger.error('Failed to create Teams meeting', {
        context: 'TeamsService.createPanelInterviewMeeting',
        error: error instanceof Error ? error.message : 'Unknown error',
        subject: request.subject,
      });
      throw error;
    }
  }

  /**
   * Update an existing Teams meeting
   */
  async updatePanelInterviewMeeting(
    meetingId: string,
    organizerEmail: string,
    request: Partial<ITeamsMeetingRequest>
  ): Promise<ITeamsMeetingResponse> {
    try {
      logger.info('Updating Teams meeting', {
        context: 'TeamsService.updatePanelInterviewMeeting',
        meetingId,
        organizerEmail,
      });

      if (!this.isConfigured()) {
        throw new AppError(
          'Microsoft Teams integration is not configured',
          500,
          ErrorCode.SERVICE_UNAVAILABLE
        );
      }

      const accessToken = await this.getAccessToken();

      const updateRequest: any = {};

      if (request.subject) {
        updateRequest.subject = request.subject;
      }

      if (request.startDateTime && request.endDateTime && request.timeZone) {
        updateRequest.start = {
          dateTime: request.startDateTime.toISOString(),
          timeZone: request.timeZone,
        };
        updateRequest.end = {
          dateTime: request.endDateTime.toISOString(),
          timeZone: request.timeZone,
        };
      }

      if (request.attendees) {
        updateRequest.attendees = request.attendees.map((attendee) => ({
          emailAddress: {
            address: attendee.email,
            name: attendee.name,
          },
          type: 'required',
        }));
      }

      if (request.organizer || request.startDateTime) {
        updateRequest.body = {
          contentType: 'HTML',
          content: this.buildMeetingBodyContent(
            request as ITeamsMeetingRequest
          ),
        };
      }

      const response = await this.makeGraphRequest(
        `/users/${organizerEmail}/events/${meetingId}`,
        'PATCH',
        updateRequest,
        accessToken
      );

      return {
        meetingId: response.id,
        joinUrl: response.onlineMeeting?.joinUrl || '',
        meetingLink: response.onlineMeeting?.joinUrl || '',
        organizerMeetingUrl: response.webLink,
      };
    } catch (error) {
      logger.error('Failed to update Teams meeting', {
        context: 'TeamsService.updatePanelInterviewMeeting',
        error: error instanceof Error ? error.message : 'Unknown error',
        meetingId,
        organizerEmail,
      });
      throw error;
    }
  }

  /**
   * Cancel/Delete a Teams meeting
   */
  async cancelPanelInterviewMeeting(
    meetingId: string,
    organizerEmail: string
  ): Promise<void> {
    try {
      logger.info('Cancelling Teams meeting', {
        context: 'TeamsService.cancelPanelInterviewMeeting',
        meetingId,
        organizerEmail,
      });

      if (!this.isConfigured()) {
        logger.warn(
          'Teams integration not configured, skipping meeting cancellation',
          {
            context: 'TeamsService.cancelPanelInterviewMeeting',
            meetingId,
          }
        );
        return;
      }

      const accessToken = await this.getAccessToken();

      await this.makeGraphRequest(
        `/users/${organizerEmail}/events/${meetingId}`,
        'DELETE',
        null,
        accessToken
      );

      logger.info('Teams meeting cancelled successfully', {
        context: 'TeamsService.cancelPanelInterviewMeeting',
        meetingId,
      });
    } catch (error) {
      logger.error('Failed to cancel Teams meeting', {
        context: 'TeamsService.cancelPanelInterviewMeeting',
        error: error instanceof Error ? error.message : 'Unknown error',
        meetingId,
        organizerEmail,
      });
      throw error;
    }
  }

  /**
   * Get access token for Microsoft Graph API
   */
  private async getAccessToken(): Promise<string> {
    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

      const body = new URLSearchParams({
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AppError(
          `Failed to get access token: ${response.status} ${errorText}`,
          response.status,
          ErrorCode.EXTERNAL_SERVICE_ERROR
        );
      }

      const tokenData = await response.json();
      return tokenData.access_token;
    } catch (error) {
      logger.error('Failed to get Microsoft Graph access token', {
        context: 'TeamsService.getAccessToken',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Make a request to Microsoft Graph API
   */
  private async makeGraphRequest(
    endpoint: string,
    method: string,
    body: any,
    accessToken: string
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      const options: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      };

      if (body && method !== 'GET' && method !== 'DELETE') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new AppError(
          `Microsoft Graph API error: ${response.status} ${errorText}`,
          response.status,
          ErrorCode.EXTERNAL_SERVICE_ERROR
        );
      }

      if (method === 'DELETE') {
        return null; // DELETE requests typically don't return content
      }

      return await response.json();
    } catch (error) {
      logger.error('Microsoft Graph API request failed', {
        context: 'TeamsService.makeGraphRequest',
        endpoint,
        method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Build meeting body content
   */
  private buildMeetingBodyContent(
    request: ITeamsMeetingRequest,
    _contentType: MeetingContentType = MeetingContentType.PANEL_MEMBERS
  ): string {
    const formatDateTime = (date: Date, timeZone: string) => {
      return date.toLocaleString('en-US', {
        timeZone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    };

    let content = '';
    const candidateInfo = request.candidateName
      ? `<p><strong>Candidate:</strong> ${request.candidateName}</p>`
      : '';

    content = `
      <div>
        <h2>Panel Interview Meeting</h2>
        <p><strong>Date & Time:</strong> ${formatDateTime(request.startDateTime, request.timeZone)}</p>
        <p><strong>Duration:</strong> ${Math.round((request.endDateTime.getTime() - request.startDateTime.getTime()) / (1000 * 60))} minutes</p>
        ${candidateInfo}
        
        <h3>Meeting Participants:</h3>
        <ul>
          ${request.attendees.map((attendee) => `<li>${attendee.name} (${attendee.email})</li>`).join('')}
        </ul>
        
        <h3>Meeting Instructions:</h3>
        <ul>
          <li>Please join the meeting a few minutes early to test your audio and video</li>
          <li>Ensure you have a stable internet connection and working audio/video</li>
          <li>Use a quiet, well-lit environment for the interview</li>
          <li>Have all necessary documents and materials ready</li>
        </ul>
        
        <h3>For Panel Members:</h3>
        <ul>
          <li>Review the candidate's profile and resume beforehand</li>
          <li>Prepare relevant questions to assess the candidate's fit for the role</li>
          <li>Take notes during the interview for feedback submission</li>
        </ul>
        
        <h3>For the Candidate:</h3>
        <ul>
          <li>Have your resume and portfolio ready for discussion</li>
          <li>Prepare to discuss your experience and qualifications</li>
          <li>Feel free to ask questions about the role and company</li>
        </ul>
        
        <p>If you have any technical issues joining the meeting, please contact the organizer immediately.</p>
        
        <p>Thank you for participating in this interview process.</p>
      </div>
    `;

    return content;
  }
}
