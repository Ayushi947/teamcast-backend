import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface DocumentRejectionEmailData extends EmailTemplateData {
  clientName: string;
  companyName: string;
  documentName: string;
  documentType: string;
  rejectionReason: string;
  supportEmail: string;
  supportUrl: string;
  resubmissionInstructions: string;
}

export class DocumentRejectionEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return `Document Rejected - ${this.data.documentName}`;
  }

  protected getTemplate(): string {
    return `
              <div class="email-content">
          <div class="header">
            <h1>Document Rejected</h1>
            <p class="subtitle">Dear {{params.clientName}}, we've reviewed your submitted document and found some issues that need to be addressed.</p>
          </div>

        <div class="content-section">
          <div class="info-card">
            <h2>Document Details</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Document Name:</span>
                <span class="value">{{params.documentName}}</span>
              </div>
              <div class="info-item">
                <span class="label">Document Type:</span>
                <span class="value">{{params.documentType}}</span>
              </div>
              <div class="info-item">
                <span class="label">Company:</span>
                <span class="value">{{params.companyName}}</span>
              </div>
            </div>
          </div>

          <div class="rejection-reason">
            <h3>Rejection Reason</h3>
            <div class="reason-box">
              <p>{{params.rejectionReason}}</p>
            </div>
          </div>

          <div class="next-steps">
            <h3>Next Steps</h3>
            <div class="steps-list">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h4>Review the Feedback</h4>
                  <p>Carefully review the rejection reason and feedback provided above.</p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h4>Make Necessary Corrections</h4>
                  <p>{{params.resubmissionInstructions}}</p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h4>Resubmit the Document</h4>
                  <p>Upload the corrected document through your dashboard.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="support-section">
            <h3>Need Help?</h3>
            <p>If you have any questions about the rejection or need assistance with resubmission, our support team is here to help.</p>
            <div class="support-options">
              <div class="support-option">
                <strong>Email Support:</strong>
                <a href="mailto:{{params.supportEmail}}">{{params.supportEmail}}</a>
              </div>
              <div class="support-option">
                <strong>Support Portal:</strong>
                <a href="{{params.supportUrl}}">{{params.supportUrl}}</a>
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your patience and cooperation. We're committed to helping you complete the verification process successfully.</p>
          <p class="company-info">
            <strong>{{params.companyName}}</strong><br>
            Teamcast Support Team
          </p>
        </div>
      </div>
    `;
  }

  protected getEmailContainer(content: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          ${this.getBaseStyles()}
          
          /* Document rejection specific styles */
          .email-content {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .header h1 {
            color: #dc2626;
            font-size: 32px;
            font-weight: 700;
            margin: 0 0 16px 0;
          }
          
          .subtitle {
            color: #6b7280;
            font-size: 18px;
            margin: 0;
            line-height: 1.6;
          }
          
          .content-section {
            margin-bottom: 40px;
          }
          
          .info-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
          }
          
          .info-card h2 {
            color: #111827;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 20px 0;
          }
          
          .info-grid {
            display: grid;
            gap: 16px;
          }
          
          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          
          .info-item:last-child {
            border-bottom: none;
          }
          
          .label {
            font-weight: 600;
            color: #374151;
            min-width: 120px;
          }
          
          .value {
            color: #111827;
            font-weight: 500;
          }
          
          .rejection-reason {
            margin-bottom: 32px;
          }
          
          .rejection-reason h3 {
            color: #dc2626;
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 16px 0;
          }
          
          .reason-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #dc2626;
          }
          
          .reason-box p {
            color: #991b1b;
            margin: 0;
            font-size: 16px;
            line-height: 1.6;
          }
          
          .next-steps h3 {
            color: #111827;
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 20px 0;
          }
          
          .steps-list {
            display: grid;
            gap: 20px;
          }
          
          .step {
            display: flex;
            align-items: flex-start;
            gap: 16px;
          }
          
          .step-number {
            background: #3b82f6;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 16px;
            flex-shrink: 0;
          }
          
          .step-content h4 {
            color: #111827;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
          }
          
          .step-content p {
            color: #6b7280;
            margin: 0;
            line-height: 1.6;
          }
          
          .support-section {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
          }
          
          .support-section h3 {
            color: #0369a1;
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 16px 0;
          }
          
          .support-section p {
            color: #0c4a6e;
            margin: 0 0 20px 0;
            line-height: 1.6;
          }
          
          .support-options {
            display: grid;
            gap: 16px;
          }
          
          .support-option {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .support-option strong {
            color: #0c4a6e;
            min-width: 100px;
          }
          
          .support-option a {
            color: #0284c7;
            text-decoration: none;
            font-weight: 500;
          }
          
          .button {
            display: inline-block;
            background: #0284c7;
            color: white !important;
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          
          .button:hover {
            background: #0369a1;
          }
          
          .footer {
            text-align: center;
            padding-top: 30px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
            line-height: 1.6;
          }
          
          .company-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #f3f4f6;
          }
          
          .company-info strong {
            color: #111827;
          }
          
          /* Responsive design */
          @media (max-width: 600px) {
            .email-content {
              padding: 20px 16px;
            }
            
            .header h1 {
              font-size: 28px;
            }
            
            .info-item {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;
            }
            
            .label {
              min-width: auto;
            }
            
            .step {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }
            
            .support-option {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;
            }
            
            .support-option strong {
              min-width: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          ${content}
        </div>
      </body>
      </html>
    `;
  }
}
