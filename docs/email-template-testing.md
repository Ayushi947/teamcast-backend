# Email Template Testing Utility

## Overview

The Email Template Testing Utility is a comprehensive tool for testing, previewing, and validating email templates before deploying them to production. It provides both a REST API and a modern web interface for developers and administrators to ensure email templates render correctly across different scenarios.

## Features

### 🎯 Core Features

- **Template Selection**: Browse and select from all available email templates
- **Real-time Preview**: Live preview of rendered templates in HTML and text formats
- **Data Customization**: Modify template data using JSON editor with syntax highlighting
- **Test Email Sending**: Send test emails to verify delivery and rendering
- **Category Filtering**: Filter templates by category (Authentication, Jobs, etc.)
- **Export Functionality**: Download rendered HTML templates or copy to clipboard
- **Error Handling**: Comprehensive error reporting and validation

### 🔧 Technical Features

- **REST API**: Full API for programmatic access
- **Modern UI**: React-based interface with Tailwind CSS
- **Form Validation**: Client-side and server-side validation
- **Responsive Design**: Works on desktop and mobile devices
- **Type Safety**: TypeScript interfaces for all template data

## API Endpoints

### Base URL

```http
http://localhost:5000/api/email-templates/test
```

### 1. Get Available Templates

```http
GET /available
```

**Response:**

```json
{
  "success": true,
  "templates": [
    {
      "id": "verification",
      "name": "Email Verification",
      "category": "Authentication",
      "description": "Verify user email address",
      "sampleData": {
        "name": "John Doe",
        "verificationUrl": "https://teamcast.ai/verify/sample-token"
      }
    }
  ],
  "categories": ["Authentication", "Account Management", "Jobs & Applications"]
}
```

### 2. Get Sample Data

```http
GET /sample-data/{templateType}
```

**Parameters:**

- `templateType` (path): Template identifier (e.g., "verification", "job-invite")

**Response:**

```json
{
  "success": true,
  "templateType": "verification",
  "sampleData": {
    "name": "John Doe",
    "verificationUrl": "https://teamcast.ai/verify/sample-token"
  }
}
```

### 3. Render Template

```http
POST /render
```

**Request Body:**

```json
{
  "templateType": "verification",
  "templateData": {
    "name": "Jane Smith",
    "verificationUrl": "https://teamcast.ai/verify/abc123"
  },
  "outputFormat": "both"
}
```

**Response:**

```json
{
  "success": true,
  "templateType": "verification",
  "subject": "Verify your email address",
  "html": "<html>...</html>",
  "text": "Plain text version..."
}
```

### 4. Send Test Email

```http
POST /send
```

**Request Body:**

```json
{
  "templateType": "verification",
  "templateData": {
    "name": "Jane Smith",
    "verificationUrl": "https://teamcast.ai/verify/abc123"
  },
  "recipientEmail": "test@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Test email sent to test@example.com",
  "templateType": "verification",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Available Templates

### Authentication Templates

- **verification**: Email address verification
- **password-reset**: Password reset requests
- **user-password**: Initial password creation

### Account Management Templates

- **client-signup**: New client company registration
- **invitation**: Team member invitations
- **user-activation**: Account activation/deactivation notifications

### Job & Application Templates

- **job-invite**: Job application invitations
- **job-ai-assessment**: AI assessment invitations
- **job-recommendation**: Job recommendations
- **application-status-candidate**: Application status for candidates
- **application-status-client**: Application status for clients

## Template Data Schemas

### Verification Template

```typescript
interface VerificationEmailData {
  name: string;
  verificationUrl: string;
}
```

### Job Invitation Template

```typescript
interface JobInviteEmailData {
  name: string;
  companyName: string;
  inviterName: string;
  jobTitle: string;
  invitationUrl: string;
  expiryHours: number;
}
```

### Application Status Template

```typescript
interface ApplicationStatusEmailData {
  candidateName?: string;
  jobTitle: string;
  companyName: string;
  status:
    | 'accepted'
    | 'rejected'
    | 'withdrawn'
    | 'submitted'
    | 'shortlisted'
    | 'interview_scheduled'
    | 'offer_extended';
  notes?: string;
  actionUrl?: string;
  isForCandidate?: boolean;
  isForClient?: boolean;
  nextSteps?: string;
  interviewDate?: string;
  offerDetails?: string;
}
```

## Usage Guide

### Web Interface

1. **Access the Tool**

   ```http
   http://localhost:3000/admin/email-templates
   ```

2. **Select a Template**
   - Browse templates by category
   - Click on a template to select it
   - View template description and sample data

3. **Customize Data**
   - Edit the JSON data in the Template Data field
   - Use the provided sample data as a starting point
   - Validate JSON syntax automatically

4. **Preview Template**
   - Click "Preview Template" to render the email
   - View HTML preview, source code, and text version
   - Copy HTML to clipboard or download as file

5. **Send Test Email**
   - Enter a test email address
   - Click "Send Test Email" to deliver the rendered template
   - Verify receipt and rendering in your email client

### Programmatic Usage

```javascript
// Fetch available templates
const templates = await fetch('/api/email-templates/test/available').then(
  (res) => res.json()
);

// Render a template
const rendered = await fetch('/api/email-templates/test/render', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateType: 'verification',
    templateData: {
      name: 'John Doe',
      verificationUrl: 'https://example.com/verify/123',
    },
    outputFormat: 'html',
  }),
}).then((res) => res.json());

// Send test email
const sent = await fetch('/api/email-templates/test/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateType: 'verification',
    templateData: {
      /* ... */
    },
    recipientEmail: 'test@example.com',
  }),
}).then((res) => res.json());
```

## Integration

### Backend Integration

Add the routes to your main app:

```typescript
// In your main route file
import emailTemplateTestRoutes from './routes/common/email-template-test.routes';

app.use('/api/email-templates/test', emailTemplateTestRoutes);
```

### Frontend Integration

The React component can be embedded in any admin interface:

```typescript
import EmailTemplateTester from '@/components/app/email-template-tester';

function AdminPanel() {
  return (
    <div>
      <h1>Admin Panel</h1>
      <EmailTemplateTester />
    </div>
  );
}
```

## Error Handling

### Common Errors

| Error                       | Cause                           | Solution                                |
| --------------------------- | ------------------------------- | --------------------------------------- |
| `Template type is required` | Missing templateType in request | Provide valid template identifier       |
| `Invalid JSON data`         | Malformed JSON in templateData  | Validate JSON syntax                    |
| `Unknown template type`     | Invalid template identifier     | Use valid template ID from `/available` |
| `Failed to render template` | Template rendering error        | Check template data structure           |
| `Failed to send test email` | Email service error             | Verify email configuration              |

### Error Response Format

```json
{
  "success": false,
  "error": "Error description",
  "details": "Additional error details"
}
```

## Security Considerations

- **Access Control**: Restrict access to admin users only
- **Rate Limiting**: Implement rate limiting for test email sending
- **Data Validation**: Validate all input data on server side
- **Email Limits**: Set reasonable limits on test email frequency
- **Sanitization**: Sanitize template data to prevent injection attacks

## Development Setup

### Prerequisites

- Node.js 18+
- TypeScript
- Express.js backend
- Next.js frontend

### Installation

1. Backend setup:

```bash
cd teamcast-backend
npm install
# Add email template test routes to your app
```

2. Frontend setup:

```bash
cd teamcast-ui
npm install
# Component is ready to use
```

3. Environment variables:

```bash
# teamcast-ui/.env.local
BACKEND_URL=http://localhost:5000
```

## Testing

### Unit Tests

```bash
# Test email template rendering
npm run test -- email-template-test.controller.spec.ts

# Test React component
npm run test -- email-template-tester.test.tsx
```

### Manual Testing

1. Start backend server
2. Start frontend development server
3. Navigate to `/admin/email-templates`
4. Test various templates with different data
5. Verify email delivery and rendering

## Troubleshooting

### Template Not Rendering

- Check template data structure matches interface
- Verify template exists in EmailTemplateFactory
- Check console for JavaScript errors

### Test Emails Not Sending

- Verify email service configuration
- Check backend logs for SMTP errors
- Ensure recipient email is valid

### UI Not Loading

- Check API proxy configuration
- Verify backend server is running
- Check browser console for errors

## Contributing

When adding new email templates:

1. Create template class extending `BaseEmailTemplate`
2. Add template to `EmailTemplateFactory`
3. Update controller with new template type
4. Add sample data to available templates list
5. Update documentation

## License

This utility is part of the Teamcast platform and follows the same licensing terms.
