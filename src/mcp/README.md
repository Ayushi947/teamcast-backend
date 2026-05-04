# Teamcast MCP Server

Model Context Protocol (MCP) server for AI agent integration with Teamcast.

## Overview

The Teamcast MCP Server allows external AI agents (like Claude, GPT, custom agents) to interact with Teamcast's recruitment platform programmatically. This enables:

- Creating job postings from external systems
- Sending job invites to candidates
- Automating recruitment workflows

## Quick Start

### 1. Create an MCP Client

First, create an MCP client via the Teamcast admin API to get an API key:

```bash
curl -X POST https://api.teamcast.ai/api/client/mcp-clients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My AI Agent",
    "description": "Custom recruitment assistant",
    "scopes": ["jobs:write", "invites:write"],
    "sourceSystem": "Custom Agent",
    "contactEmail": "admin@example.com"
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "mcp-client-uuid",
    "name": "My AI Agent",
    "apiKey": "mcp_abc123...",
    "scopes": ["jobs:write", "invites:write"]
  },
  "message": "MCP client created. Save the API key securely - it will not be shown again."
}
```

### 2. Connect to MCP Server

#### Discovery Endpoint

```bash
curl https://api.teamcast.ai/api/mcp/.well-known/mcp-configuration
```

Response:

```json
{
  "name": "teamcast-mcp-server",
  "version": "1.0.0",
  "protocolVersion": "2025-11-25",
  "capabilities": {
    "tools": true,
    "resources": false,
    "prompts": false
  },
  "transport": {
    "type": "http",
    "endpoint": "/api/mcp/v1"
  }
}
```

### 3. Initialize MCP Session

```bash
curl -X POST https://api.teamcast.ai/api/mcp/v1 \
  -H "Authorization: Bearer mcp_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "clientInfo": {
        "name": "My AI Agent",
        "version": "1.0.0"
      }
    }
  }'
```

### 4. List Available Tools

```bash
curl -X POST https://api.teamcast.ai/api/mcp/v1 \
  -H "Authorization: Bearer mcp_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'
```

## Available Tools

### teamcast.jobs.create

Create a new job posting on Teamcast platform.

**Required Scope:** `jobs:write`

**Input Schema:**

| Field            | Type     | Required | Description                          |
| ---------------- | -------- | -------- | ------------------------------------ |
| title            | string   | Yes      | Job title                            |
| description      | string   | Yes      | Job description                      |
| jobType          | enum     | No       | REMOTE, ONSITE, HYBRID               |
| jobCommitment    | enum     | No       | FULL_TIME, PART_TIME, CONTRACT, etc. |
| industry         | enum     | No       | TECHNOLOGY, FINANCE, etc.            |
| totalExperience  | number   | No       | Years of experience required         |
| minSalary        | number   | No       | Minimum salary                       |
| maxSalary        | number   | No       | Maximum salary                       |
| salaryCurrency   | string   | No       | Currency code (default: USD)         |
| requiredSkills   | string[] | No       | Required skills                      |
| preferredSkills  | string[] | No       | Preferred skills                     |
| responsibilities | string[] | No       | Job responsibilities                 |
| benefits         | string[] | No       | Benefits offered                     |
| isRemote         | boolean  | No       | Is position remote                   |
| isPublished      | boolean  | No       | Publish immediately                  |
| externalJobId    | string   | No       | External reference ID                |

**Example:**

```bash
curl -X POST https://api.teamcast.ai/api/mcp/v1 \
  -H "Authorization: Bearer mcp_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "teamcast.jobs.create",
      "arguments": {
        "title": "Senior Software Engineer",
        "description": "We are looking for a senior engineer to join our team...",
        "jobType": "REMOTE",
        "jobCommitment": "FULL_TIME",
        "industry": "TECHNOLOGY",
        "totalExperience": 5,
        "minSalary": 120000,
        "maxSalary": 180000,
        "salaryCurrency": "USD",
        "requiredSkills": ["TypeScript", "React", "Node.js"],
        "preferredSkills": ["AWS", "PostgreSQL"],
        "responsibilities": [
          "Design and implement features",
          "Code review",
          "Mentor junior developers"
        ],
        "isRemote": true,
        "isPublished": true,
        "externalJobId": "ext-job-123"
      }
    }
  }'
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\":true,\"jobPosting\":{\"id\":\"job-uuid\",\"title\":\"Senior Software Engineer\",\"status\":\"PUBLISHED\"},\"message\":\"Job posting created successfully\"}"
      }
    ],
    "isError": false
  }
}
```

---

### teamcast.jobs.sendInvite

Send job invites to candidates for a specific job posting.

**Required Scope:** `invites:write`

**Input Schema:**

| Field                          | Type          | Required | Description                  |
| ------------------------------ | ------------- | -------- | ---------------------------- |
| jobPostingId                   | string (UUID) | Yes      | ID of the job posting        |
| candidates                     | array         | Yes      | List of candidates (max 100) |
| candidates[].name              | string        | Yes      | Candidate name               |
| candidates[].email             | string        | Yes      | Candidate email              |
| candidates[].phone             | string        | No       | Phone number                 |
| candidates[].resumeUrl         | string        | No       | Resume URL                   |
| candidates[].linkedInUrl       | string        | No       | LinkedIn profile             |
| candidates[].skills            | string[]      | No       | Candidate skills             |
| candidates[].currentTitle      | string        | No       | Current job title            |
| candidates[].yearsOfExperience | number        | No       | Years of experience          |
| sendEmail                      | boolean       | No       | Send email notifications     |
| customMessage                  | string        | No       | Custom invitation message    |
| inviteExpiryHours              | number        | No       | Hours until expiry (24-720)  |

**Example:**

```bash
curl -X POST https://api.teamcast.ai/api/mcp/v1 \
  -H "Authorization: Bearer mcp_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "teamcast.jobs.sendInvite",
      "arguments": {
        "jobPostingId": "job-uuid-from-create",
        "candidates": [
          {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "currentTitle": "Software Engineer",
            "yearsOfExperience": 5,
            "skills": ["TypeScript", "React"],
            "linkedInUrl": "https://linkedin.com/in/johndoe"
          },
          {
            "name": "Jane Smith",
            "email": "jane.smith@example.com",
            "currentTitle": "Senior Developer",
            "yearsOfExperience": 7,
            "skills": ["Node.js", "AWS"]
          }
        ],
        "sendEmail": true,
        "customMessage": "We think you would be a great fit for this role!",
        "inviteExpiryHours": 72
      }
    }
  }'
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\":true,\"jobPosting\":{\"id\":\"job-uuid\",\"title\":\"Senior Software Engineer\"},\"summary\":{\"total\":2,\"successful\":2,\"failed\":0},\"results\":[{\"email\":\"john.doe@example.com\",\"success\":true,\"inviteId\":\"invite-uuid-1\"},{\"email\":\"jane.smith@example.com\",\"success\":true,\"inviteId\":\"invite-uuid-2\"}]}"
      }
    ],
    "isError": false
  }
}
```

## Permission Scopes

| Scope                | Description                    |
| -------------------- | ------------------------------ |
| `jobs:read`          | Read job postings              |
| `jobs:write`         | Create and update job postings |
| `candidates:read`    | Read candidate profiles        |
| `candidates:write`   | Update candidate data          |
| `invites:read`       | Read job invites               |
| `invites:write`      | Send job invites               |
| `applications:read`  | Read applications              |
| `applications:write` | Update applications            |

## Rate Limiting

- Default: 100 requests/minute, 1000 requests/hour
- Custom limits can be configured per MCP client
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Error Handling

MCP uses JSON-RPC 2.0 error format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32001,
    "message": "Unauthorized",
    "data": { "details": "Invalid API key" }
  }
}
```

**Error Codes:**

| Code   | Description          |
| ------ | -------------------- |
| -32700 | Parse error          |
| -32600 | Invalid request      |
| -32601 | Method not found     |
| -32602 | Invalid params       |
| -32603 | Internal error       |
| -32001 | Unauthorized         |
| -32002 | Rate limited         |
| -32003 | Tool execution error |
| -32004 | Resource not found   |

## MCP Client Management API

### Create MCP Client

```http
POST /api/client/mcp-clients
```

### List MCP Clients

```http
GET /api/client/mcp-clients
```

### Get MCP Client

```http
GET /api/client/mcp-clients/{mcpClientId}
```

### Update MCP Client

```http
PATCH /api/client/mcp-clients/{mcpClientId}
```

### Regenerate API Key

```http
POST /api/client/mcp-clients/{mcpClientId}/regenerate-key
```

### Delete MCP Client

```http
DELETE /api/client/mcp-clients/{mcpClientId}
```

### Get Activity Logs

```http
GET /api/client/mcp-clients/{mcpClientId}/activity
```

## Claude Desktop Integration

To integrate with Claude Desktop, add the following to your Claude config:

```json
{
  "mcpServers": {
    "teamcast": {
      "url": "https://api.teamcast.ai/api/mcp/v1",
      "headers": {
        "Authorization": "Bearer mcp_your_api_key_here"
      }
    }
  }
}
```

## Security Best Practices

1. **API Key Security**

   - Store API keys securely (environment variables, secrets manager)
   - Never commit API keys to version control
   - Rotate keys periodically

2. **Scope Minimization**

   - Only request scopes your agent actually needs
   - Use read-only scopes when write access isn't required

3. **Rate Limiting**

   - Implement exponential backoff on rate limit errors
   - Cache responses where appropriate

4. **Audit Logging**
   - Monitor activity logs for unusual patterns
   - Set up alerts for high error rates

## Support

For questions or issues, contact support@teamcast.ai
