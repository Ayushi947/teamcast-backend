# MCP Interview Feature - Integration Guide

This guide explains how to use the MCP (Model Context Protocol) Interview feature to request skill-based interviews for candidates through AI agents.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup](#setup)
4. [MCP Tools Reference](#mcp-tools-reference)
5. [Candidate Flow](#candidate-flow)
6. [Webhook Events](#webhook-events)
7. [API Endpoints](#api-endpoints)
8. [Examples](#examples)
9. [Error Handling](#error-handling)

---

## Overview

The MCP Interview feature allows external AI agents to:

- Request interviews for candidates to assess specific skills
- Support both existing Teamcast candidates and external candidates (not in the system)
- Track interview status and retrieve results
- Receive webhook notifications for status changes

**Key Points:**

- From the candidate's perspective, this appears as a normal "Interview Invitation"
- The system internally tracks it as an agent-initiated skill assessment
- Candidates can accept or decline invitations through a landing page

---

## Prerequisites

1. **MCP Client Setup**: You need an active MCP client with API credentials
2. **Required Scopes**:
   - `invites:write` - For requesting interviews and canceling
   - `applications:read` - For checking status and retrieving results
3. **Webhook Configuration** (optional but recommended): Configure webhook URL to receive status updates

---

## Setup

### Step 1: Run Database Migration

```bash
cd teamcast-backend
npx prisma migrate dev --name add_mcp_interview
```

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

### Step 3: Configure MCP Client

Ensure your MCP client has the required scopes enabled:

```json
{
  "scopes": ["candidates:read", "invites:write", "applications:read"]
}
```

### Step 4: Configure Webhooks (Optional)

Set up webhook URL in your MCP client settings to receive real-time notifications.

---

## MCP Tools Reference

### 1. Request Interview

**Tool Name:** `teamcast.interviews.request`

**Description:** Request an interview for a candidate to assess specific skills.

**Required Scope:** `invites:write`

#### Input Parameters

| Parameter             | Type          | Required | Description                                                          |
| --------------------- | ------------- | -------- | -------------------------------------------------------------------- |
| `candidateId`         | string (UUID) | No\*     | Existing Teamcast candidate ID                                       |
| `candidate`           | object        | No\*     | External candidate details                                           |
| `skillsToAssess`      | string[]      | Yes      | Skills to assess (1-10 skills)                                       |
| `assessmentLevel`     | enum          | No       | `JUNIOR`, `INTERMEDIATE`, `SENIOR`, `LEAD` (default: `INTERMEDIATE`) |
| `jobContext`          | object        | No       | Job information shown to candidate                                   |
| `customInstructions`  | string        | No       | Custom instructions for AI assessment                                |
| `externalReferenceId` | string        | No       | Your reference ID for tracking                                       |
| `expiryDays`          | number        | No       | Days until invite expires (1-30, default: 7)                         |
| `inviteMessage`       | string        | No       | Custom message for invite email                                      |

\*Either `candidateId` OR `candidate` is required, not both.

#### External Candidate Object

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "currentTitle": "Senior Developer",
  "currentCompany": "TechCorp",
  "yearsOfExperience": 5,
  "linkedInUrl": "https://linkedin.com/in/johndoe",
  "githubUrl": "https://github.com/johndoe",
  "portfolioUrl": "https://johndoe.dev",
  "resumeUrl": "https://example.com/resume.pdf",
  "location": "San Francisco, CA",
  "externalCandidateId": "your-candidate-id-123",
  "sourceSystem": "your-ats-name"
}
```

#### Job Context Object

```json
{
  "title": "Senior Software Engineer",
  "company": "TechCorp Inc.",
  "description": "Join our team to build innovative solutions...",
  "location": "Remote / San Francisco"
}
```

#### Response

```json
{
  "success": true,
  "interviewId": "uuid-of-interview",
  "status": "INVITED",
  "candidateType": "EXISTING" | "EXTERNAL",
  "candidateEmail": "candidate@example.com",
  "inviteUrl": "https://app.teamcast.ai/interview/accept/uuid",
  "expiresAt": "2024-01-30T00:00:00.000Z",
  "message": "Interview invite sent to candidate@example.com..."
}
```

---

### 2. Get Interview Status

**Tool Name:** `teamcast.interviews.getStatus`

**Description:** Check the current status of an interview request.

**Required Scope:** `applications:read`

#### Input Parameters

| Parameter             | Type          | Required | Description                |
| --------------------- | ------------- | -------- | -------------------------- |
| `interviewId`         | string (UUID) | No\*     | Interview ID               |
| `externalReferenceId` | string        | No\*     | Your external reference ID |
| `candidateEmail`      | string        | No\*     | Candidate's email          |

\*At least one filter is required.

#### Response

```json
{
  "success": true,
  "data": {
    "interviewId": "uuid",
    "status": "ACCEPTED",
    "externalReferenceId": "your-ref-123",
    "externalCandidateId": "your-candidate-123",
    "candidateEmail": "john@example.com",
    "candidateName": "John Doe",
    "skillsToAssess": ["Python", "React", "AWS"],
    "invitedAt": "2024-01-23T10:00:00.000Z",
    "acceptedAt": "2024-01-23T11:00:00.000Z",
    "startedAt": null,
    "completedAt": null,
    "expiresAt": "2024-01-30T00:00:00.000Z",
    "hasResults": false
  }
}
```

---

### 3. Get Interview Results

**Tool Name:** `teamcast.interviews.getResults`

**Description:** Get detailed results of a completed interview.

**Required Scope:** `applications:read`

#### Input Parameters

| Parameter     | Type          | Required | Description  |
| ------------- | ------------- | -------- | ------------ |
| `interviewId` | string (UUID) | Yes      | Interview ID |

#### Response (when results ready)

```json
{
  "success": true,
  "data": {
    "interviewId": "uuid",
    "externalReferenceId": "your-ref-123",
    "externalCandidateId": "your-candidate-123",
    "candidate": {
      "name": "John Doe",
      "email": "john@example.com",
      "teamcastCandidateId": "uuid-or-null"
    },
    "status": "RESULTS_READY",
    "completedAt": "2024-01-24T15:00:00.000Z",
    "overall": {
      "score": 85,
      "recommendation": "STRONG_HIRE",
      "summary": "John demonstrated strong proficiency..."
    },
    "skillAssessments": [
      {
        "skill": "Python",
        "score": 90,
        "level": "ADVANCED",
        "strengths": ["Clean code", "Algorithm design"],
        "improvements": ["Could improve error handling"],
        "notes": "Excellent performance on Python challenges"
      },
      {
        "skill": "React",
        "score": 80,
        "level": "INTERMEDIATE",
        "strengths": ["Component architecture"],
        "improvements": ["State management patterns"],
        "notes": null
      }
    ],
    "sections": [
      {
        "name": "Python Fundamentals",
        "skillName": "Python",
        "score": 92,
        "timeSpent": "15:30",
        "questionsAnswered": 10,
        "questionsTotal": 10
      }
    ]
  }
}
```

---

### 4. List Interviews

**Tool Name:** `teamcast.interviews.list`

**Description:** List all interviews requested by your agent.

**Required Scope:** `applications:read`

#### Input Parameters

| Parameter             | Type   | Required | Description                         |
| --------------------- | ------ | -------- | ----------------------------------- |
| `status`              | enum   | No       | Filter by status                    |
| `externalReferenceId` | string | No       | Filter by your reference ID         |
| `externalCandidateId` | string | No       | Filter by your candidate ID         |
| `candidateEmail`      | string | No       | Filter by email                     |
| `page`                | number | No       | Page number (default: 1)            |
| `limit`               | number | No       | Items per page (1-100, default: 20) |

#### Response

```json
{
  "success": true,
  "data": {
    "interviews": [
      {
        "interviewId": "uuid-1",
        "status": "RESULTS_READY",
        "candidateEmail": "john@example.com",
        "candidateName": "John Doe",
        "skillsToAssess": ["Python", "React"],
        "invitedAt": "2024-01-23T10:00:00.000Z",
        "completedAt": "2024-01-24T15:00:00.000Z",
        "overallScore": 85
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 5. Cancel Interview

**Tool Name:** `teamcast.interviews.cancel`

**Description:** Cancel a pending interview request.

**Required Scope:** `invites:write`

#### Input Parameters

| Parameter     | Type          | Required | Description            |
| ------------- | ------------- | -------- | ---------------------- |
| `interviewId` | string (UUID) | Yes      | Interview ID to cancel |

#### Response

```json
{
  "success": true,
  "message": "Interview cancelled successfully"
}
```

**Note:** Cannot cancel interviews that are `COMPLETED`, `EVALUATING`, `RESULTS_READY`, or already `CANCELLED`.

---

## Candidate Flow

### For Existing Teamcast Candidates

1. Agent requests interview with `candidateId`
2. System sends email to candidate
3. Candidate clicks link and lands on acceptance page
4. Candidate accepts or declines
5. If accepted, candidate is redirected to start assessment

### For External Candidates (New to Teamcast)

1. Agent requests interview with `candidate` object containing details
2. System sends email to candidate
3. Candidate clicks link and lands on acceptance page
4. **Candidate creates account** (password + terms acceptance)
5. System creates user account and candidate profile
6. Candidate is redirected to start assessment

### Interview Status Flow

```text
INVITED → ACCEPTED → IN_PROGRESS → COMPLETED → EVALUATING → RESULTS_READY
    ↓         ↓
 DECLINED   EXPIRED (if not responded within expiry period)
    ↓
CANCELLED (by agent)
```

---

## Webhook Events

Configure webhook URL to receive these events:

### interview.invited

Triggered when interview request is created.

```json
{
  "event": "interview.invited",
  "timestamp": "2024-01-23T10:00:00.000Z",
  "data": {
    "interviewId": "uuid",
    "candidateType": "EXTERNAL",
    "candidateEmail": "john@example.com",
    "candidateName": "John Doe",
    "skillsToAssess": ["Python", "React"],
    "externalReferenceId": "your-ref-123",
    "externalCandidateId": "your-candidate-123",
    "expiresAt": "2024-01-30T00:00:00.000Z"
  }
}
```

### interview.accepted

Triggered when candidate accepts the invitation.

```json
{
  "event": "interview.accepted",
  "timestamp": "2024-01-23T11:00:00.000Z",
  "data": {
    "interviewId": "uuid",
    "candidateType": "EXTERNAL",
    "candidateEmail": "john@example.com",
    "candidateName": "John Doe",
    "externalReferenceId": "your-ref-123",
    "externalCandidateId": "your-candidate-123",
    "newUserId": "uuid-of-new-user",
    "newCandidateId": "uuid-of-new-candidate",
    "acceptedAt": "2024-01-23T11:00:00.000Z"
  }
}
```

### interview.declined

Triggered when candidate declines the invitation.

```json
{
  "event": "interview.declined",
  "timestamp": "2024-01-23T11:00:00.000Z",
  "data": {
    "interviewId": "uuid",
    "candidateEmail": "john@example.com",
    "externalReferenceId": "your-ref-123",
    "externalCandidateId": "your-candidate-123",
    "declinedAt": "2024-01-23T11:00:00.000Z",
    "reason": "Not interested at this time"
  }
}
```

### interview.results_ready

Triggered when assessment results are available.

```json
{
  "event": "interview.results_ready",
  "timestamp": "2024-01-24T16:00:00.000Z",
  "data": {
    "interviewId": "uuid",
    "externalReferenceId": "your-ref-123",
    "externalCandidateId": "your-candidate-123",
    "candidateEmail": "john@example.com",
    "overallScore": 85,
    "recommendation": "STRONG_HIRE",
    "skillsSummary": [
      { "skill": "Python", "score": 90, "level": "ADVANCED" },
      { "skill": "React", "score": 80, "level": "INTERMEDIATE" }
    ]
  }
}
```

---

## API Endpoints (Public)

These endpoints are used by the candidate-facing landing page:

### GET /api/public/interviews/:interviewId

Get interview landing page data.

**Response:**

```json
{
  "success": true,
  "data": {
    "interviewId": "uuid",
    "status": "INVITED",
    "isExpired": false,
    "candidateName": "John Doe",
    "candidateEmail": "john@example.com",
    "isNewCandidate": true,
    "jobTitle": "Senior Software Engineer",
    "companyName": "TechCorp",
    "jobDescription": "...",
    "jobLocation": "Remote",
    "skillsCount": 3,
    "estimatedDuration": 45,
    "expiresAt": "2024-01-30T00:00:00.000Z"
  }
}
```

### POST /api/public/interviews/:interviewId/accept

Accept interview invitation.

**Request Body (for new candidates):**

```json
{
  "password": "securePassword123",
  "acceptTerms": true
}
```

**Request Body (for existing candidates):**

```json
{}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "redirectUrl": "/interview/start/uuid"
  },
  "message": "Interview accepted successfully"
}
```

### POST /api/public/interviews/:interviewId/decline

Decline interview invitation.

**Request Body:**

```json
{
  "reason": "Not interested at this time"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Interview declined"
}
```

---

## Examples

### Example 1: Request Interview for Existing Candidate

```javascript
// Using MCP tool
const result = await mcpClient.callTool('teamcast.interviews.request', {
  candidateId: 'existing-candidate-uuid',
  skillsToAssess: ['Python', 'Django', 'PostgreSQL'],
  assessmentLevel: 'SENIOR',
  jobContext: {
    title: 'Senior Backend Engineer',
    company: 'TechCorp',
    description: 'Building scalable APIs',
    location: 'Remote',
  },
  externalReferenceId: 'job-req-2024-001',
  expiryDays: 14,
});

console.log(`Interview created: ${result.interviewId}`);
console.log(`Invite URL: ${result.inviteUrl}`);
```

### Example 2: Request Interview for External Candidate

```javascript
const result = await mcpClient.callTool('teamcast.interviews.request', {
  candidate: {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    currentTitle: 'Full Stack Developer',
    currentCompany: 'StartupXYZ',
    yearsOfExperience: 4,
    linkedInUrl: 'https://linkedin.com/in/janesmith',
    githubUrl: 'https://github.com/janesmith',
    location: 'New York, NY',
    externalCandidateId: 'ats-candidate-456',
  },
  skillsToAssess: ['React', 'Node.js', 'TypeScript'],
  assessmentLevel: 'INTERMEDIATE',
  jobContext: {
    title: 'Full Stack Engineer',
    company: 'TechCorp',
    location: 'New York / Remote',
  },
  externalReferenceId: 'job-req-2024-002',
});
```

### Example 3: Poll for Results

```javascript
async function waitForResults(interviewId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await mcpClient.callTool('teamcast.interviews.getStatus', {
      interviewId,
    });

    if (status.data.status === 'RESULTS_READY') {
      const results = await mcpClient.callTool(
        'teamcast.interviews.getResults',
        {
          interviewId,
        }
      );
      return results.data;
    }

    if (['DECLINED', 'EXPIRED', 'CANCELLED'].includes(status.data.status)) {
      throw new Error(`Interview ended with status: ${status.data.status}`);
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, 60000)); // 1 minute
  }

  throw new Error('Timeout waiting for results');
}
```

---

## Error Handling

### Common Error Responses

**Candidate not found:**

```json
{
  "error": "Candidate not found: uuid"
}
```

**Unpublished candidate:**

```json
{
  "error": "Cannot request interview for unpublished candidate"
}
```

**Duplicate interview:**

```json
{
  "error": "Interview already pending for this candidate. Interview ID: uuid"
}
```

**Invalid input:**

```json
{
  "error": "Either candidateId or candidate data is required"
}
```

**Interview expired:**

```json
{
  "error": "Interview invitation has expired"
}
```

**Invalid status transition:**

```json
{
  "error": "Cannot cancel interview in COMPLETED status"
}
```

---

## Best Practices

1. **Always provide job context** - Improves candidate experience and acceptance rates
2. **Use external reference IDs** - Makes tracking easier in your system
3. **Configure webhooks** - Get real-time updates instead of polling
4. **Handle all statuses** - Account for declined, expired, and cancelled states
5. **Set appropriate expiry** - Balance urgency with candidate convenience
6. **Specify assessment level** - Match difficulty to the role requirements

---

## Support

For issues or questions:

- Check MCP client logs for detailed error messages
- Verify API key and scopes are correctly configured
- Ensure webhook URL is accessible and returns 2xx status
