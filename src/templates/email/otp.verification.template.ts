import { BaseEmailTemplate, EmailTemplateData } from './base.template';

export interface OtpVerificationEmailData extends EmailTemplateData {
  name: string;
  otpCode: string;
}

export class OtpVerificationEmailTemplate extends BaseEmailTemplate {
  protected getSubject(): string {
    return 'Verify your email address - Teamcast';
  }

  protected getTemplate(): string {
    const { name, otpCode } = this.data as OtpVerificationEmailData;

    return `
      <tr>
        <td align="center" style="padding: 32px 24px;" class="content-padding">
          <h1 style="color: #111827; font-size: 28px; font-weight: 600; margin-bottom: 16px; text-align: center; line-height: 1.25;">
            Verify Your Email Address
          </h1>
                     
          <p style="color: #6b7280; font-size: 16px; margin-bottom: 32px; text-align: center; line-height: 1.5;">
            Hi ${name}, please enter the verification code below to verify your email address.
          </p>
                              
          <!-- OTP Code Display -->
          <div style="text-align: center; margin: 32px 0;">
            <div style="color: #111827; font-size: 16px; margin-bottom: 24px; font-weight: 500;">
              Your Verification Code
            </div>
                         
            <!-- OTP Container with perfect centering -->
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 24px auto;">
              <tr>
                ${otpCode
                  .split('')
                  .map(
                    (digit) => `
                  <td style="padding: 0 1px;">
                    <div style="
                      width: 26px;
                      height: 56px;
                      text-align: center;
                      vertical-align: middle;
                      font-size: 24px;
                      font-weight: 700;
                      color: #6366f1;
                      font-family: 'Courier New', Courier, monospace;
                      line-height: 56px;
                      display: inline-block;
                    ">
                      ${digit}
                    </div>
                  </td>
                `
                  )
                  .join('')}
              </tr>
            </table>
                         
            <div style="color: #6b7280; font-size: 14px; margin-top: 24px; text-align: center; line-height: 1.4;">
              This code will expire in 10 minutes
            </div>
          </div>
                     
          <div style="margin-top: 32px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
              If you didn't request this verification code, you can safely ignore this email.
            </p>
          </div>
        </td>
      </tr>
    `;
  }
}
