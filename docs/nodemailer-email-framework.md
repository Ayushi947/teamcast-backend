# Nodemailer Email Framework Documentation

## Overview

The Teamcast backend includes a comprehensive Nodemailer-based email framework that supports dynamic HTML templates with professional styling. This framework replaces the previous Brevo template system and provides full control over email content and styling.

## Features

- ✅ **Dynamic HTML Templates**: Professional, responsive email templates
- ✅ **SMTP Configuration**: Full SMTP support with environment variables
- ✅ **Provider Selection**: Easy switching between Brevo and SMTP/Nodemailer
- ✅ **Template System**: Reusable email templates with dynamic data binding
- ✅ **Professional Styling**: Mobile-responsive design with consistent branding
- ✅ **Error Handling**: Comprehensive logging and error management
- ✅ **Type Safety**: Full TypeScript support with interfaces

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Email Provider Selection
NOTIFICATION_PROVIDER=smtp
SEND_NOTIFICATIONS=true

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@teamcast.ai
SMTP_FROM_NAME=Teamcast
```

### Provider Selection

The framework supports multiple email providers:

```typescript
export enum NotificationProvider {
  SMTP = 'smtp', // Nodemailer/SMTP
  BREVO = 'brevo', // Brevo service
}
```

Set `NOTIFICATION_PROVIDER=smtp` to use Nodemailer.

## Usage

### Basic Email Sending

```typescript
import { NotificationFactory } from '@/services/notification/notification.factory';

// Get the notification provider
const notificationProvider =
  new NotificationFactory().getNotificationProvider();

// Send a simple email
await notificationProvider.sendEmail({
  to: 'recipient@example.com',
  subject: 'Test Email',
  html: '<h1>Hello World!</h1>',
});
```

### Using Pre-built Templates

The framework includes many pre-built templates:

```typescript
// Verification email
await notificationProvider.sendVerificationEmail(
  'user@example.com',
  'John Doe',
  'https://app.teamcast.ai/verify?token=abc123'
);

// Password reset email
await notificationProvider.sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  'https://app.teamcast.ai/reset?token=xyz789'
);

// Client invitation email
await notificationProvider.sendClientUserInvitationEmail(
  'user@example.com',
  'John Doe',
  'Acme Corp',
  'Jane Manager',
  'https://app.teamcast.ai/invite?token=inv123',
  'HR Manager',
  48
);

// User password email (for invitation acceptance)
await notificationProvider.sendPartnerUserPasswordEmail(
  'user@example.com',
  'John Doe',
  'Acme Corp',
  'TempPass123!',
  'https://app.teamcast.ai/login'
);

// Support user creation email
await notificationProvider.sendSupportCandidateUserPasswordEmail(
  'candidate@example.com',
  'Jane Smith',
  'SecurePass456@',
  'https://app.teamcast.ai/login'
);

// Invitation acceptance notification
await notificationProvider.sendClientInvitationAcceptedEmail(
  'manager@acme.com',
  'Jane Manager',
  'John Doe',
  'Acme Corp',
  'HR Manager'
);
```

### Advanced Email Options

```typescript
await notificationProvider.sendEmail({
  from: 'custom@teamcast.ai',
  to: ['user1@example.com', 'user2@example.com'],
  cc: ['manager@example.com'],
  bcc: ['admin@teamcast.ai'],
  subject: 'Important Update',
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h1>Hello {{params.name}}!</h1>
      <p>Your account has been {{params.status}}.</p>
      <p>Company: {{params.company}}</p>
      <p>Role: {{params.role}}</p>
    </div>
  `,
  text: 'Hello! Your account has been updated.',
  attachments: [
    {
      filename: 'report.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    },
  ],
});
```

## Template System

### Available Templates

1. **VerificationEmailTemplate** - Email verification
2. **PasswordResetEmailTemplate** - Password reset
3. **InvitationEmailTemplate** - User invitations
4. **UserPasswordEmailTemplate** - Password emails for invitation acceptance
5. **SupportUserPasswordEmailTemplate** - Password emails for support-created accounts
6. **InvitationAcceptedEmailTemplate** - Notification when invitations are accepted
7. **JobRecommendationEmailTemplate** - Job recommendations
8. **PanelAssessmentSlotEmailTemplate** - Assessment scheduling
9. **PanelAssessmentConfirmationEmailTemplate** - Assessment confirmations
10. **JobAIAssessmentInviteEmailTemplate** - AI assessment invites
11. **ClientJobInviteEmailTemplate** - Client job invitations
12. **CandidateJobAppliedEmailTemplate** - Application notifications
13. **UserSignupInviteEmailTemplate** - Signup invitations
14. **UserSignupAcceptedEmailTemplate** - Signup confirmations
15. **CandidateApplicationStatusEmailTemplate** - Application status updates
16. **JobApplicationWithdrawEmailTemplate** - Application withdrawals
17. **UserWelcomeEmailTemplate** - Welcome emails
18. **RecommendedCandidatesEmailTemplate** - Candidate recommendations
19. **DailyDigestEmailTemplate** - Daily summaries

### Creating Custom Templates

```typescript
import {
  BaseEmailTemplate,
  EmailTemplateData,
} from '@/templates/email/base.template';

interface CustomEmailData extends EmailTemplateData {
  name: string;
  company: string;
  position: string;
  salary: string;
  location: string;
}

export class CustomEmailTemplate extends BaseEmailTemplate {
  constructor(data: CustomEmailData) {
    super(data);
  }

  protected getSubject(): string {
    return `Welcome to ${this.data.company}, ${this.data.name}!`;
  }

  protected getTemplate(): string {
    return `
      <tr>
        <td align="center" style="padding:40px 20px;" class="content-padding">
          <h1 style="color:#2c3e50;font-size:28px;margin-bottom:20px;">
            Welcome to {{params.company}}, {{params.name}}!
          </h1>
          <p style="color:#34495e;font-size:16px;line-height:1.6;margin-bottom:30px;">
            We're excited to have you join our team as a {{params.position}}.
          </p>
          <div style="background-color:#ecf0f1;padding:20px;border-radius:8px;margin:30px 0;">
            <h3 style="color:#2c3e50;margin-top:0;">Position Details:</h3>
            <ul style="color:#34495e;font-size:14px;">
              <li><strong>Position:</strong> {{params.position}}</li>
              <li><strong>Salary:</strong> {{params.salary}}</li>
              <li><strong>Location:</strong> {{params.location}}</li>
            </ul>
          </div>
          <p style="color:#34495e;font-size:16px;line-height:1.6;">
            We look forward to working with you!
          </p>
        </td>
      </tr>
    `;
  }
}
```

### Using Custom Templates

```typescript
import { CustomEmailTemplate } from '@/templates/email/custom.template';

const template = new CustomEmailTemplate({
  name: 'John Doe',
  company: 'Acme Corp',
  position: 'Senior Developer',
  salary: '$120,000/year',
  location: 'San Francisco, CA',
});

const { subject, html } = template.render();

await notificationProvider.sendEmail({
  to: 'john@example.com',
  subject,
  html,
});
```

## Template Variables

### Dynamic Data Binding

Templates use the `{{params.variableName}}` syntax for dynamic content:

```html
<h1>Hello {{params.name}}!</h1>
<p>Welcome to {{params.company}}.</p>
<p>Your role: {{params.role}}</p>
<p>Salary: {{params.salary}}</p>
```

### Supported Data Types

- **Strings**: `{{params.name}}`
- **Numbers**: `{{params.age}}`
- **Booleans**: `{{params.isActive}}`
- **Arrays**: `{{params.skills}}` (will be joined with commas)

## Styling Guidelines

### Base Styles

All templates inherit from `BaseEmailTemplate` which provides:

- Responsive design for mobile devices
- Professional color scheme
- Consistent typography
- Email client compatibility

### Custom Styling

```html
<!-- Use inline styles for email compatibility -->
<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
  <h2 style="color: #2c3e50; margin-top: 0;">Section Title</h2>
  <p style="color: #34495e; line-height: 1.6;">Content here</p>
</div>
```

### Color Palette

- **Primary**: `#667eea` (Header background)
- **Secondary**: `#10b981` (Buttons, success)
- **Text**: `#2c3e50` (Headings), `#34495e` (Body text)
- **Background**: `#f4f7fa` (Page background), `#ffffff` (Content area)
- **Footer**: `#2c3e50` (Dark footer)

## Error Handling

### Logging

The framework provides comprehensive logging:

```typescript
// Success logs
logger.info('Email sent via Nodemailer', {
  context: 'NodemailerProvider.sendEmail',
  to: options.to,
  subject: options.subject,
  messageId: info.messageId,
});

// Error logs
logger.error('Failed to send email via Nodemailer', {
  context: 'NodemailerProvider.sendEmail',
  error,
});
```

### Disabling Emails

Set `SEND_NOTIFICATIONS=false` to disable email sending (useful for development):

```typescript
if (!this.sendNotifications) {
  logger.info('Email sending is disabled by SEND_NOTIFICATIONS flag');
  return;
}
```

## Testing

### Test Script

Run the test script to verify your setup:

```bash
npm run ts-node scripts/test-nodemailer.ts
```

### Manual Testing

```typescript
// Test specific template
const template = new VerificationEmailTemplate({
  name: 'Test User',
  verificationUrl: 'https://test.com/verify',
  to: 'test@example.com',
});

const { subject, html } = template.render();
```

## Migration from Brevo

### Environment Changes

```env
# Old Brevo configuration
NOTIFICATION_PROVIDER=brevo
BREVO_API_KEY=your-api-key

# New SMTP configuration
NOTIFICATION_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Code Changes

```typescript
// No code changes needed - same interface
const notificationProvider =
  new NotificationFactory().getNotificationProvider();
await notificationProvider.sendVerificationEmail(to, name, url);
```

## Best Practices

1. **Always use inline styles** for email compatibility
2. **Test on multiple email clients** (Gmail, Outlook, Apple Mail)
3. **Keep images under 1MB** for better delivery
4. **Use alt text** for all images
5. **Test mobile responsiveness** on various screen sizes
6. **Monitor delivery rates** and bounce rates
7. **Use meaningful subject lines** to improve open rates
8. **Include plain text alternatives** for accessibility

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check SMTP credentials
   - Enable "Less secure app access" for Gmail
   - Use App Passwords for 2FA accounts

2. **Emails Not Sending**
   - Verify `SEND_NOTIFICATIONS=true`
   - Check SMTP host and port
   - Review firewall settings

3. **Template Variables Not Replacing**
   - Ensure data is passed correctly
   - Check variable names match template placeholders
   - Verify data types are supported

4. **Styling Issues**
   - Use inline styles only
   - Test in multiple email clients
   - Avoid CSS properties not supported by email clients

### Debug Mode

Enable debug logging:

```typescript
// In your environment
DEBUG=nodemailer:*
```

## Support

For issues or questions about the Nodemailer email framework:

1. Check the logs for error details
2. Verify environment configuration
3. Test with the provided test script
4. Review this documentation
5. Contact the development team
