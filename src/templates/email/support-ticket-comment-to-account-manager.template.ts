import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface SupportTicketCommentToAccountManagerData
  extends EmailTemplateData {
  accountManagerName: string;
  ticketId: string;
  ticketTitle: string;
  ticketNumber: string;
  commentContent: string;
  commentAuthorName: string;
  commentAuthorEmail: string;
  clientCompanyName: string;
  ticketUrl: string;
  ticketPriority: string;
  ticketStatus: string;
}

export class SupportTicketCommentToAccountManagerEmailTemplate extends BaseEmailTemplate {
  constructor(data: SupportTicketCommentToAccountManagerData) {
    super(data);
  }

  protected getSubject(): string {
    const { ticketNumber, ticketTitle } = this
      .data as SupportTicketCommentToAccountManagerData;
    return `New Comment on Support Ticket #${ticketNumber} - ${ticketTitle}`;
  }

  protected getTemplate(): string {
    const {
      accountManagerName,

      ticketTitle,
      ticketNumber,
      commentContent,
      commentAuthorName,
      commentAuthorEmail,
      clientCompanyName,
      ticketUrl,
      ticketPriority,
      ticketStatus,
    } = this.data as SupportTicketCommentToAccountManagerData;

    const priorityColor = this.getPriorityColor(
      ticketPriority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent'
    );

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1a202c; font-size: 28px; font-weight: 600; margin: 0; margin-bottom: 8px; text-align: center; line-height: 1.2;">
              New Comment Added
            </h1>
            <div style="width: 60px; height: 3px; background: #667eea; margin: 0 auto; border-radius: 2px;"></div>
          </div>
          
          <!-- Welcome Message -->
          ${this.createStatusContainer(
            '💬',
            'Comment Notification',
            `Hi ${accountManagerName}, a new comment has been added to a support ticket that requires your attention.`,
            'info'
          )}

          <!-- Ticket Details -->
          ${this.createInfoCard(
            'Ticket Information',
            `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
                <div style="color: #2d3748; font-size: 16px; line-height: 1.8;">
                  
                  <div style="margin-bottom: 16px;">
                    <strong style="color: #667eea; font-size: 18px;">#${ticketNumber} ${ticketTitle}</strong>
                  </div>

                  <div style="margin-bottom: 12px;">
                    <strong>Priority:</strong> 
                    <span style="color: ${priorityColor}; font-weight: 700; text-transform: uppercase;">
                      ${ticketPriority}
                    </span>
                  </div>

                  <div style="margin-bottom: 12px;">
                    <strong>Status:</strong> 
                    <span style="color: #667eea; font-weight: 600; text-transform: uppercase;">
                      ${ticketStatus}
                    </span>
                  </div>

                  <div style="margin-bottom: 12px;">
                    <strong>Client Company:</strong> 
                    <span style="color: #2d3748; font-weight: 600;">
                      ${clientCompanyName}
                    </span>
                  </div>
                </div>
              </div>
            `
          )}

          <!-- Comment Details -->
          ${this.createInfoCard(
            'New Comment',
            `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
                <div style="color: #2d3748; font-size: 16px; line-height: 1.8;">
                  
                  <div style="margin-bottom: 16px;">
                    <strong style="color: #667eea; font-size: 16px;">From: ${commentAuthorName} (${commentAuthorEmail})</strong>
                  </div>

                  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
                    <div style="color: #4a5568; font-size: 15px; line-height: 1.6; font-style: italic;">
                      "${commentContent}"
                    </div>
                  </div>
                </div>
              </div>
            `
          )}

          <!-- Action Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${ticketUrl}" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.3s ease;">
              View Ticket & Respond
            </a>
          </div>

          <!-- Additional Information -->
          <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 24px;">
            <div style="color: #4a5568; font-size: 14px; line-height: 1.6;">
              <strong>Quick Actions:</strong>
              <ul style="margin: 8px 0 0 20px; padding: 0;">
                <li>Review the comment and ticket details</li>
                <li>Respond with a helpful solution or request more information</li>
                <li>Update ticket status if needed</li>
                <li>Escalate to technical team if required</li>
              </ul>
            </div>
          </div>

          <!-- Footer Note -->
          <div style="text-align: center; margin-top: 32px; color: #718096; font-size: 14px;">
            <p style="margin: 0;">
              You're receiving this notification because you're the account manager for this client. 
              Please respond promptly to maintain excellent customer service.
            </p>
          </div>
        </td>
      </tr>
    `;
  }

  private getPriorityColor(
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): string {
    switch (priority) {
      case 'low':
        return '#38a169';
      case 'medium':
        return '#d69e2e';
      case 'high':
        return '#e53e3e';
      case 'urgent':
        return '#9f7aea';
      default:
        return '#667eea';
    }
  }
}
