import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface SupportTicketAssignmentData extends EmailTemplateData {
  supportUserName: string;
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string;
  ticketPriority: 'low' | 'medium' | 'high' | 'urgent';
  ticketCategory: string;
  ticketStatus: string;
  assignedByName: string;
  assignedByEmail: string;
  clientName?: string;
  clientCompanyName?: string;
  ticketUrl: string;
  dueDate?: string;
  estimatedResolutionTime?: string;
  attachments?: Array<{
    name: string;
    size: string;
    type: string;
  }>;
}

export class SupportTicketAssignmentEmailTemplate extends BaseEmailTemplate {
  constructor(data: SupportTicketAssignmentData) {
    super(data);
  }

  protected getSubject(): string {
    const { ticketId, ticketTitle, ticketPriority } = this
      .data as SupportTicketAssignmentData;
    const priorityText =
      ticketPriority.charAt(0).toUpperCase() + ticketPriority.slice(1);
    return `[${priorityText} Priority] New Support Ticket #${ticketId} - ${ticketTitle}`;
  }

  protected getTemplate(): string {
    const {
      supportUserName,
      ticketId,
      ticketTitle,
      ticketDescription,
      ticketPriority,
      ticketCategory,
      assignedByName,
      assignedByEmail,
      clientName,
      clientCompanyName,
      ticketUrl,
      dueDate,
      estimatedResolutionTime,
      attachments = [],
    } = this.data as SupportTicketAssignmentData;

    const priorityColor = this.getPriorityColor(ticketPriority);

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1a202c; font-size: 28px; font-weight: 600; margin: 0; margin-bottom: 8px; text-align: center; line-height: 1.2;">
              New Support Ticket Assigned
            </h1>
            <div style="width: 60px; height: 3px; background: #667eea; margin: 0 auto; border-radius: 2px;"></div>
          </div>
          
          <!-- Welcome Message -->
          ${this.createStatusContainer(
            '📋',
            'Ticket Assignment Notification',
            `Hi ${supportUserName}, you have been assigned a new support ticket that requires your attention. Please review the details below and take appropriate action.`,
            'info'
          )}

          <!-- Ticket Details - Simple Format -->
          ${this.createInfoCard(
            'Ticket Details',
            `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
                <div style="color: #2d3748; font-size: 16px; line-height: 1.8;">
                  
                  <div style="margin-bottom: 16px;">
                    <strong style="color: #667eea; font-size: 18px;">#${ticketId} ${ticketTitle}</strong>
                  </div>

                  <div style="margin-bottom: 12px;">
                    <strong>Priority:</strong> 
                    <span style="color: ${priorityColor}; font-weight: 700; text-transform: uppercase;">
                      ${ticketPriority}
                    </span>
                  </div>

                  <div style="margin-bottom: 16px;">
                    <strong>Category:</strong> 
                    <span style="color: #667eea; font-weight: 600; text-transform: uppercase;">
                      ${ticketCategory}
                    </span>
                  </div>

                  <div style="margin-bottom: 16px;">
                    <strong>Ticket Description:</strong>
                  </div>
                  <div style="border-left: 3px solid #667eea; padding-left: 16px; margin-bottom: 20px;">
                    <div style="color: #4a5568; font-size: 15px; line-height: 1.6;">
                      ${this.formatDescription(ticketDescription)}
                    </div>
                  </div>

                  ${
                    dueDate || estimatedResolutionTime
                      ? `
                  ${
                    dueDate
                      ? `<div style="margin-bottom: 12px;">
                    <strong>Due Date:</strong> 
                    <span style="color: #c53030; font-weight: 600;">${dueDate}</span>
                  </div>`
                      : ''
                  }
                  
                  ${
                    estimatedResolutionTime
                      ? `<div style="margin-bottom: 16px;">
                    <strong>Est. Resolution:</strong> 
                    <span style="color: #38a169; font-weight: 600;">${estimatedResolutionTime}</span>
                  </div>`
                      : ''
                  }
                  `
                      : ''
                  }

                  <div style="margin-bottom: 16px;">
                    <strong>Assignment Details:</strong>
                  </div>
                  
                  ${
                    clientName && clientCompanyName
                      ? `<div style="margin-bottom: 12px; padding-left: 16px;">
                    <strong>Client Name:</strong> ${clientName} ${
                      clientCompanyName ? `(${clientCompanyName})` : ''
                    }
                  </div>`
                      : ''
                  }
                  
                  <div style="margin-bottom: 12px; padding-left: 16px;">
                    <strong>Assigned By:</strong> ${assignedByName}
                  </div>
                  
                  <div style="margin-bottom: 16px; padding-left: 16px;">
                    <strong>Contact Email:</strong> 
                    <a href="mailto:${assignedByEmail}" style="color: #667eea; text-decoration: none;">
                      ${assignedByEmail}
                    </a>
                  </div>

                  ${
                    attachments.length > 0
                      ? `
                  <div style="margin-bottom: 12px;">
                    <strong>Attachments:</strong>
                  </div>
                  <div style="padding-left: 16px;">
                    ${attachments
                      .map(
                        (attachment) => `
                      <div style="margin-bottom: 8px; padding: 8px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;">
                        📄 <strong>${attachment.name}</strong> (${attachment.size} • ${attachment.type})
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                  `
                      : ''
                  }

                </div>
              </div>
            `,
            'highlight'
          )}

          <!-- Action Buttons -->
          <div style="margin: 32px 0;">
            ${this.createButton('View Ticket Details', ticketUrl, 'primary')}
          </div>

          <!-- Next Steps -->
          ${this.createWhatsNextSection([
            {
              icon: '🔍',
              title: 'Review Ticket',
              description:
                'Carefully examine ticket details and client context',
            },
            {
              icon: '🛠️',
              title: 'Investigate Issue',
              description: 'Gather information and identify the root cause',
            },
            {
              icon: '💬',
              title: 'Client Communication',
              description: 'Reach out for clarification and provide updates',
            },
            {
              icon: '✅',
              title: 'Resolve & Update',
              description: 'Implement solution and update ticket status',
            },
          ])}

          <!-- Support Guidelines -->
          ${this.createInfoCard(
            'Support Guidelines',
            `
              <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 6px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; color: #2d3748; font-size: 13px; line-height: 1.5;">
                  <div>
                    <strong>Response Time:</strong> Acknowledge within 2 hours
                  </div>
                  <div>
                    <strong>Communication:</strong> Keep client informed regularly
                  </div>
                  <div>
                    <strong>Documentation:</strong> Update with all relevant information
                  </div>
                  <div>
                    <strong>Escalation:</strong> Involve seniors when needed
                  </div>
                </div>
              </div>
            `,
            'default'
          )}

          <!-- Alternative Link -->
          <div style="margin-top: 24px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
              <tr>
                <td style="padding: 16px; background: #f8fafc; border: 1px dashed #cbd5e0; border-radius: 8px;">
                  <div style="text-align: center;">
                    <div style="color: #4a5568; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
                      Button not working?
                    </div>
                    <div style="color: #718096; font-size: 13px; line-height: 1.5; margin-bottom: 8px;">
                      Copy and paste this link into your browser:
                    </div>
                    <div style="background: white; padding: 8px; border-radius: 4px; border: 1px solid #e2e8f0;">
                      <a href="${ticketUrl}" style="color: #0ea5e9; word-break: break-all; font-size: 12px; font-family: monospace; text-decoration: none;">
                        ${ticketUrl}
                      </a>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
    `;
  }

  private formatDescription(description: string): string {
    // Add basic formatting to make description more readable
    return description
      .replace(
        /\n\n/g,
        '</p><p style="margin: 8px 0 0 0; color: #4a5568; font-size: 14px; line-height: 1.6;">'
      )
      .replace(/\n/g, '<br>')
      .replace(
        /^/,
        '<p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">'
      )
      .replace(/$/, '</p>');
  }

  private getPriorityColor(priority: string): string {
    const priorityColors: { [key: string]: string } = {
      low: '#48bb78',
      medium: '#ed8936',
      high: '#f56565',
      urgent: '#e53e3e',
    };
    return priorityColors[priority] || '#ed8936';
  }

  private getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      open: '#4299e1',
      'in-progress': '#ed8936',
      pending: '#a0aec0',
      resolved: '#48bb78',
      closed: '#718096',
      cancelled: '#e53e3e',
    };
    return statusColors[status.toLowerCase()] || '#4299e1';
  }

  render(): { subject: string; html: string; text: string } {
    const {
      ticketId,
      ticketTitle,
      ticketUrl,
      dashboardUrl,
      assignedByName,
      assignedByEmail,
      clientName,
      clientCompanyName,
    } = this.data as SupportTicketAssignmentData;

    const baseRender = super.render();

    const text = `New Support Ticket Assigned

Ticket Details:
- ID: #${ticketId}
- Title: ${ticketTitle}
- Assigned by: ${assignedByName} (${assignedByEmail})
${clientName && clientCompanyName ? `- Client: ${clientName} (${clientCompanyName})` : ''}

View Ticket: ${ticketUrl}
Dashboard: ${dashboardUrl}

What's Next?
1. Review ticket details carefully
2. Investigate the issue thoroughly  
3. Communicate with the client as needed
4. Resolve and update ticket status

Best regards,
The Teamcast Support Team`;

    return {
      subject: baseRender.subject,
      html: baseRender.html,
      text,
    };
  }
}
