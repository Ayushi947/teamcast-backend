export interface EmailTemplateData {
  [key: string]: any;
}

export abstract class BaseEmailTemplate {
  protected data: EmailTemplateData;

  constructor(data: EmailTemplateData) {
    this.data = data;
  }

  protected abstract getTemplate(): string;
  protected abstract getSubject(): string;

  /**
   * Renders the email template with provided data
   */
  render(): { subject: string; html: string } {
    let template = this.getTemplate();

    // Replace template variables
    if (this.data && typeof this.data === 'object') {
      Object.entries(this.data).forEach(([key, value]) => {
        const placeholder = `{{params.${key}}}`;
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          template = template.replace(
            new RegExp(placeholder, 'g'),
            String(value)
          );
        }
      });
    }

    return {
      subject: this.getSubject(),
      html: this.getEmailContainer(template),
    };
  }

  /**
   * Get the base CSS styles for all email templates - professional and clean design
   */
  protected getBaseStyles(): string {
    return `
      /* General body styles */
      body {
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        background-color: #f8fafc !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        line-height: 1.6 !important;
      }

      /* Client-specific resets */
      div[style*="margin: 16px 0"] {
        background-color: #f8fafc !important;
      }

      table {
        border-collapse: collapse !important;
        mso-table-lspace: 0pt !important;
        mso-table-rspace: 0pt !important;
      }

      img {
        -ms-interpolation-mode: bicubic;
        max-width: 100% !important;
        height: auto !important;
      }

      a {
        text-decoration: none !important;
      }

      .button-link {
        mso-hide: all;
      }
      
      .ExternalClass {
        width: 100%;
      }
      
      .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
        line-height: 100%;
      }

      /* Modern professional styles using theme colors */
      .email-container {
        background-color: #ffffff !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        border: 1px solid #e5e7eb !important;
      }
      
      .header-section {
        background-color: #6e55cf !important;
        color: #ffffff !important;
      }
      
      .footer-section {
        background-color: #f9fafb !important;
        border-top: 1px solid #e5e7eb !important;
      }
      
      .content-section {
        background-color: #ffffff !important;
        color: #374151 !important;
      }
      
      /* Button styles - professional and accessible */
      .button-primary {
        background-color: #6e55cf !important;
        border: none !important;
        border-radius: 6px !important;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
      }
      
      .button-secondary {
        background-color: #10b981 !important;
        border: none !important;
        border-radius: 6px !important;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
      }
      
      .button-text {
        color: #ffffff !important;
        text-decoration: none !important;
        font-weight: 600 !important;
        display: inline-block !important;
      }
      .button-text:hover {
        text-decoration: none !important;
      }
      
      /* Status container styles */
      .status-container {
        background-color: #f5f3ff !important;
        border: 1px solid #e9d5ff !important;
        border-radius: 8px !important;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
      }

      .card-container {
        background-color: #f9fafb !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 8px !important;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
      }

      .info-card {
        background-color: #ffffff !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 6px !important;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
      }

      /* Success styling */
      .success-container {
        background-color: #f0fdf4 !important;
        border: 1px solid #bbf7d0 !important;
        color: #166534 !important;
      }

      /* Warning styling */
      .warning-container {
        background-color: #fffbeb !important;
        border: 1px solid #fde68a !important;
        color: #92400e !important;
      }

      /* Error styling */
      .error-container {
        background-color: #fef2f2 !important;
        border: 1px solid #fecaca !important;
        color: #991b1b !important;
      }

      /* Professional text styles */
      h1, h2, h3, h4, h5, h6 {
        color: #111827 !important;
        font-weight: 600 !important;
        line-height: 1.25 !important;
        margin: 0 0 16px 0 !important;
      }

      h1 {
        font-size: 28px !important;
      }

      h2 {
        font-size: 24px !important;
      }

      h3 {
        font-size: 20px !important;
      }

      p {
        color: #4b5563 !important;
        line-height: 1.6 !important;
        margin: 0 0 16px 0 !important;
        font-size: 16px !important;
      }

      .text-small {
        font-size: 14px !important;
        color: #6b7280 !important;
      }

      /* List styling */
      ul, ol {
        color: #4b5563 !important;
        line-height: 1.6 !important;
        margin: 0 0 16px 0 !important;
        padding-left: 20px !important;
      }

      li {
        margin-bottom: 8px !important;
      }

      /* Link styling */
      a {
        color: #6e55cf !important;
        text-decoration: none !important;
      }

      a:hover {
        text-decoration: underline !important;
      }

      /* Mobile responsive styles */
      @media only screen and (max-width: 600px) {
        .email-container {
          width: 100% !important;
          max-width: 100% !important;
        }

        .content-padding {
          padding: 20px 16px !important;
        }

        .header-padding {
          padding: 32px 16px !important;
        }

        .footer-padding {
          padding: 24px 16px !important;
        }

        h1 {
          font-size: 24px !important;
        }

        h2 {
          font-size: 20px !important;
        }

        h3 {
          font-size: 18px !important;
        }

        .button-primary,
        .button-secondary {
          width: 100% !important;
          padding: 12px 16px !important;
        }

        .button-text {
          font-size: 16px !important;
        }
      }

      /* Dark mode support - minimal changes to maintain brand consistency */
      @media (prefers-color-scheme: dark) {
        body {
          background-color: #f8fafc !important;
        }
        
        .email-container {
          background-color: #ffffff !important;
        }
        
        .content-section {
          background-color: #ffffff !important;
          color: #374151 !important;
        }
      }
    `;
  }

  /**
   * Get the email header template with professional branding
   */
  protected getHeader(): string {
    return `
      <tr>
        <td align="center" class="header-section header-padding" style="background-color: #6e55cf; color: #ffffff; padding: 40px 24px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
            <tr>
              <td align="center">
                <div style="font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 8px; line-height: 1.2;">
                  Teamcast
                </div>
                <div style="font-size: 14px; color: #e9d5ff; font-weight: 400; letter-spacing: 0.5px;">
                  INTELLIGENT HIRING PLATFORM
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  /**
   * Get the email footer template with clean design
   */
  protected getFooter(): string {
    return `
      <tr>
        <td align="center">
          <!-- Email Footer Section -->
          <div class="u-row-container" style="padding: 0px;background-color: transparent">
            <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
              <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                
                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                  <div style="background-color: #f8fafc;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                    <div class="v-col-border" style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                      
                      <!-- Social Media Icons - Modern Outline Icons -->
                      <table style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:24px 8px 8px;font-family:'Raleway',sans-serif;" align="left">
                              <div align="center" style="direction: ltr;" aria-label="social">
                                <div style="display: table; max-width:187px;">
                                  
                                  <!-- Twitter/X -->
                                  <table role="presentation" aria-label="Twitter icon" border="0" cellspacing="0" cellpadding="0" width="24" height="24" style="width: 24px !important;height: 24px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 15px">
                                    <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                      <a href="https://x.com/teamcastai" title="Twitter" target="_blank" rel="noopener noreferrer" style="color: #10b981; text-decoration: underline; line-height: inherit;">
                                        <!--[if mso]>
                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://x.com/teamcastai" style="height:24px;v-text-anchor:middle;width:24px;" arcsize="50%" stroke="f" fillcolor="#000000">
                                          <w:anchorlock/>
                                          <center style="color:#ffffff;font-family:sans-serif;font-size:12px;font-weight:bold;">X</center>
                                        </v:roundrect>
                                        <![endif]-->
                                        <!--[if !mso]><!-->
                                        <img src="https://img.icons8.com/ios/50/twitter.png" alt="Twitter" title="Twitter" width="24" height="24" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: 24px !important;width: 24px !important;max-width: 24px !important;mso-line-height-rule: exactly;">
                                        <!--<![endif]-->
                                      </a>
                                    </td></tr>
                                    </tbody></table>
                                  
                                  <!-- LinkedIn -->
                                  <table role="presentation" aria-label="LinkedIn icon" border="0" cellspacing="0" cellpadding="0" width="24" height="24" style="width: 24px !important;height: 24px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 15px">
                                    <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                      <a href="https://www.linkedin.com/company/teamcast-ai/" title="LinkedIn" target="_blank" rel="noopener noreferrer" style="color: #10b981; text-decoration: underline; line-height: inherit;">
                                        <!--[if mso]>
                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.linkedin.com/company/teamcast-ai/" style="height:24px;v-text-anchor:middle;width:24px;" arcsize="50%" stroke="f" fillcolor="#0077B5">
                                          <w:anchorlock/>
                                          <center style="color:#ffffff;font-family:sans-serif;font-size:12px;font-weight:bold;">in</center>
                                        </v:roundrect>
                                        <![endif]-->
                                        <!--[if !mso]><!-->
                                        <img src="https://img.icons8.com/ios/50/linkedin.png" alt="LinkedIn" title="LinkedIn" width="24" height="24" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: 24px !important;width: 24px !important;max-width: 24px !important;mso-line-height-rule: exactly;">
                                        <!--<![endif]-->
                                      </a>
                                    </td></tr>
                                    </tbody></table>
                                  
                                  <!-- GitHub -->
                                  <table role="presentation" aria-label="GitHub icon" border="0" cellspacing="0" cellpadding="0" width="24" height="24" style="width: 24px !important;height: 24px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 15px">
                                    <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                      <a href="https://github.com/orgs/teamcastai/" title="GitHub" target="_blank" rel="noopener noreferrer" style="color: #10b981; text-decoration: underline; line-height: inherit;">
                                        <!--[if mso]>
                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://github.com/orgs/teamcastai/" style="height:24px;v-text-anchor:middle;width:24px;" arcsize="50%" stroke="f" fillcolor="#333333">
                                          <w:anchorlock/>
                                          <center style="color:#ffffff;font-family:sans-serif;font-size:12px;font-weight:bold;">GH</center>
                                        </v:roundrect>
                                        <![endif]-->
                                        <!--[if !mso]><!-->
                                        <img src="https://img.icons8.com/ios/50/github.png" alt="GitHub" title="GitHub" width="24" height="24" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: 24px !important;width: 24px !important;max-width: 24px !important;mso-line-height-rule: exactly;">
                                        <!--<![endif]-->
                                      </a>
                                    </td></tr>
                                    </tbody></table>
                                  
                                  <!-- Facebook -->
                                  <table role="presentation" aria-label="Facebook icon" border="0" cellspacing="0" cellpadding="0" width="24" height="24" style="width: 24px !important;height: 24px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 0px">
                                    <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                      <a href="https://www.facebook.com/profile.php?id=61576755284323" title="Facebook" target="_blank" rel="noopener noreferrer" style="color: #10b981; text-decoration: underline; line-height: inherit;">
                                        <!--[if mso]>
                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.facebook.com/profile.php?id=61576755284323" style="height:24px;v-text-anchor:middle;width:24px;" arcsize="50%" stroke="f" fillcolor="#1877F2">
                                          <w:anchorlock/>
                                          <center style="color:#ffffff;font-family:sans-serif;font-size:12px;font-weight:bold;">f</center>
                                        </v:roundrect>
                                        <![endif]-->
                                        <!--[if !mso]><!-->
                                        <img src="https://img.icons8.com/ios/50/facebook-new.png" alt="Facebook" title="Facebook" width="24" height="24" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: 24px !important;width: 24px !important;max-width: 24px !important;mso-line-height-rule: exactly;">
                                        <!--<![endif]-->
                                      </a>
                                    </td></tr>
                                    </tbody></table>
                                  
                    </div>
                  </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                  
                      <!-- Navigation Menu -->
                      <table style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:8px;font-family:'Raleway',sans-serif;" align="left">
                              <div aria-label="menu" class="menu" style="text-align:center;">
                                <a aria-label="Menu item - Home" href="https://teamcast.ai" target="_blank" rel="noopener noreferrer" style="padding: 5px 15px; display: inline-block; color: #374151; font-size: 14px; text-decoration: none; line-height: inherit;" class="v-padding v-font-size">Home</a>
                                <span aria-label="menu separator" style="padding:5px 15px;display:inline-block;color:#374151;font-size:14px;" class="v-padding v-font-size hide-mobile">|</span>
                                <a aria-label="Menu item - About" href="https://teamcast.ai/about" target="_blank" rel="noopener noreferrer" style="padding: 5px 15px; display: inline-block; color: #374151; font-size: 14px; text-decoration: none; line-height: inherit;" class="v-padding v-font-size">About</a>
                                <span aria-label="menu separator" style="padding:5px 15px;display:inline-block;color:#374151;font-size:14px;" class="v-padding v-font-size hide-mobile">|</span>
                                <a aria-label="Menu item - Contact" href="https://teamcast.ai/contact" target="_blank" rel="noopener noreferrer" style="padding: 5px 15px; display: inline-block; color: #374151; font-size: 14px; text-decoration: none; line-height: inherit;" class="v-padding v-font-size">Contact</a>
                  </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                  
                      <!-- Footer Text/Legal -->
                      <table style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:8px 10px 24px;font-family:'Raleway',sans-serif;" align="left">
                              <div class="v-text-align v-line-height v-font-size" style="font-size: 14px; color: #374151; line-height: 160%; text-align: center; word-wrap: break-word;">
                                <p style="font-size: 14px; line-height: 160%; margin: 0px;">If you have any questions, please email us at <a rel="noopener" href="mailto:hello@teamcast.ai" target="_blank" style="color: #10b981; text-decoration: underline; line-height: inherit;">hello@teamcast.ai</a> or <a rel="noopener" href="mailto:support@teamcast.ai" target="_blank" style="color: #10b981; text-decoration: underline; line-height: inherit;">support@teamcast.ai</a>.</p>
                                <p style="font-size: 14px; line-height: 160%; margin: 0px;">© ${new Date().getFullYear()} Teamcast. All rights reserved.</p>
                    </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Get the main email container structure with professional design
   */
  protected getEmailContainer(content: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
        <title>${this.getSubject()} - Teamcast</title>
        <!--[if !mso]><!-->
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <!--<![endif]-->
        <style type="text/css">
          ${this.getBaseStyles()}
        </style>
      </head>
      <body style="height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        <!-- Preview text -->
        <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
          ${this.getSubject()}
        </div>
        <!-- Hidden preheader spacer -->
        <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
          &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
        </div>
        
        <!-- Email container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; background-color: #f8fafc;">
          <tr>
            <td align="center" valign="top" style="padding: 20px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px; width: 100%; background-color: #ffffff; border-collapse: collapse; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                ${this.getHeader()}
                <tr>
                  <td class="content-section" style="background-color: #ffffff; color: #374151;">
                    ${content}
                  </td>
                </tr>
                ${this.getFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Create a professional styled button
   */
  protected createButton(
    text: string,
    url: string,
    buttonType: 'primary' | 'secondary' = 'primary'
  ): string {
    const buttonClass =
      buttonType === 'primary' ? 'button-primary' : 'button-secondary';
    const backgroundColor = buttonType === 'primary' ? '#6e55cf' : '#10b981';

    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              <tr>
                <td align="center" class="${buttonClass}" style="background-color: ${backgroundColor}; border: none; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                  <a href="${url}" class="button-text" style="color: #ffffff !important; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 24px; display: inline-block; padding: 14px 28px; border-radius: 6px;">${text}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  /**
   * Create a professional status container
   */
  protected createStatusContainer(
    icon: string,
    title: string,
    description: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): string {
    const containerClass =
      type === 'success'
        ? 'success-container'
        : type === 'warning'
          ? 'warning-container'
          : type === 'error'
            ? 'error-container'
            : 'status-container';

    const colors = {
      info: {
        bg: '#f5f3ff',
        border: '#e9d5ff',
        icon: '#6e55cf',
        title: '#5b21b6',
        text: '#1f2937',
      },
      success: {
        bg: '#f0fdf4',
        border: '#bbf7d0',
        icon: '#10b981',
        title: '#059669',
        text: '#1f2937',
      },
      warning: {
        bg: '#fffbeb',
        border: '#fde68a',
        icon: '#f59e0b',
        title: '#d97706',
        text: '#1f2937',
      },
      error: {
        bg: '#fef2f2',
        border: '#fecaca',
        icon: '#ef4444',
        title: '#dc2626',
        text: '#1f2937',
      },
    };

    const color = colors[type];

    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="${containerClass}" style="border-collapse: collapse; background-color: ${color.bg}; border: 1px solid ${color.border}; border-radius: 8px; margin: 24px 0; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
        <tr>
          <td align="center" style="padding: 24px;">
            <div style="color: ${color.icon}; font-size: 24px; margin-bottom: 12px; line-height: 1;">
              ${icon}
            </div>
            <div style="color: ${color.title}; font-size: 18px; font-weight: 600; margin-bottom: 8px; line-height: 1.3;">
              ${title}
            </div>
            <div style="color: ${color.text}; font-size: 14px; line-height: 1.5; text-align: center;">
              ${description}
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  /**
   * Create a professional info card
   */
  protected createInfoCard(
    title: string,
    content: string,
    type: 'default' | 'highlight' = 'default'
  ): string {
    const backgroundColor = type === 'highlight' ? '#f5f3ff' : '#f9fafb';
    const borderColor = type === 'highlight' ? '#e9d5ff' : '#e5e7eb';

    return `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card" style="border-collapse: collapse; background-color: ${backgroundColor}; border: 1px solid ${borderColor}; border-radius: 6px; margin: 20px 0; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
        <tr>
          <td style="padding: 20px;">
            <div style="color: #1f2937; font-size: 16px; font-weight: 600; margin-bottom: 12px;">
              ${title}
            </div>
            <div style="color: #4b5563; font-size: 14px; line-height: 1.6;">
              ${content}
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  /**
   * Create a "What's Next" section for user guidance - Gmail compatible
   *
   * @param steps Array of steps. Each step must have:
   *   - icon: string (emoji)
   *   - title: string
   *   - description: string
   *
   * Example:
   *   createWhatsNextSection([
   *     { icon: '✅', title: 'Accept Invitation', description: 'Click the invitation button...' },
   *     { icon: '👤', title: 'Create Account', description: 'Set up your profile...' }
   *   ])
   */
  protected createWhatsNextSection(
    steps: Array<{ icon: string; title: string; description: string }>
  ): string {
    const stepItems = steps
      .map(
        (step, index) => `
     <tr>
       <td style="padding: 12px 0; border-bottom: ${index < steps.length - 1 ? '1px solid #f3f4f6' : 'none'};">
         <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
           <tr>
             <td width="40" valign="top" align="center">
               <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                 <tr>
                   <td width="30" height="30" align="center" valign="middle" style="width: 30px; height: 30px; border-radius: 50px; background-color: #f5f3ff; border: 2px solid #e9d5ff; font-size: 16px; color: #6e55cf; line-height: 30px; text-align: center; vertical-align: middle; mso-line-height-rule: exactly;">
                     ${step.icon}
                   </td>
                 </tr>
               </table>
             </td>
             <td valign="top" style="padding-left: 16px;">
               <div style="color: #1f2937; font-size: 15px; font-weight: 600; margin-bottom: 4px; line-height: 1.3;">
                 ${step.title}
               </div>
               <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                 ${step.description}
               </div>
             </td>
           </tr>
         </table>
       </td>
     </tr>
   `
      )
      .join('');

    return `
     <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; background-color: #f5f3ff; border: 1px solid #e9d5ff; border-radius: 8px; margin: 24px 0;">
       <tr>
         <td style="padding: 20px;">
           <div style="color: #5b21b6; font-size: 18px; font-weight: 600; margin-bottom: 16px; text-align: center;">
             <span style='font-size:18px;vertical-align:middle;margin-right:6px;'>🎯</span> What's Next?
           </div>
           <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
             ${stepItems}
           </table>
          </td>
        </tr>
      </table>
    `;
  }
}
