# A2A (Agent-to-Agent) Integration Guide

This guide explains how to integrate with TeamCast's A2A protocol for agent-to-agent communication. A2A enables external recruiting platforms with AI agents to use TeamCast as an interviewing platform.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Agent Discovery](#agent-discovery)
4. [Skills Available](#skills-available)
5. [API Reference](#api-reference)
6. [Code Examples](#code-examples)
7. [Error Handling](#error-handling)
8. [Architecture](#architecture)

---

## Overview

### What is A2A?

A2A (Agent-to-Agent) is Google's protocol for horizontal agent-to-agent communication. While MCP (Model Context Protocol) handles vertical communication between agents and tools, A2A enables peer-to-peer communication between autonomous agents.

### Use Case

External recruiting platforms (e.g., LinkedIn, Greenhouse, Lever) with their own AI agents can use TeamCast's A2A interface to:

- Request technical interviews for candidates
- Check interview status
- Retrieve interview results
- List and manage interviews
- Cancel pending interviews

### Protocol

- **Transport**: HTTP/HTTPS
- **Format**: JSON-RPC 2.0
- **Discovery**: Agent Card at `/.well-known/agent.json`

---

## Authentication

### API Key Authentication

All A2A requests (except discovery endpoints) require authentication using API keys.

#### Option 1: Authorization Header

```http
Authorization: Bearer your-api-key
```

or

```http
Authorization: ApiKey your-api-key
```

#### Option 2: X-API-Key Header

```http
X-API-Key: your-api-key
```

### Getting an API Key

API keys are managed through the MCP Client system. Contact your TeamCast administrator or use the client dashboard to generate an API key with appropriate scopes.

### Required Scopes

| Skill               | Required Scope      |
| ------------------- | ------------------- |
| `interview.request` | `invites:write`     |
| `interview.status`  | `applications:read` |
| `interview.results` | `applications:read` |
| `interview.list`    | `applications:read` |
| `interview.cancel`  | `invites:write`     |

---

## Agent Discovery

### Agent Card

Discover TeamCast's A2A capabilities by fetching the Agent Card:

```http
GET /.well-known/agent.json
```

Response:

```json
{
  "agentId": "teamcast-interview-agent",
  "name": "TeamCast Interview Agent",
  "description": "AI-powered technical interview and assessment platform for recruiting agents",
  "url": "https://api.teamcast.io/api/a2a",
  "protocolVersions": ["0.2.1", "0.2"],
  "capabilities": {
    "streaming": true,
    "pushNotifications": true,
    "taskManagement": true
  },
  "skills": [...],
  "securitySchemes": {
    "apiKey": { "type": "apiKey", "name": "X-API-Key", "in": "header" },
    "bearerAuth": { "type": "http", "scheme": "bearer" }
  }
}
```

---

## Skills Available

### 1. interview.request

Request a technical interview for a candidate.

**Input Schema:**

```json
{
  "candidateEmail": "john@example.com", // Required
  "candidateName": "John Doe", // Required
  "skillsToAssess": ["JavaScript", "React"], // Required, 1-10 skills
  "assessmentLevel": "SENIOR", // Optional: JUNIOR, INTERMEDIATE, SENIOR, LEAD
  "jobTitle": "Senior Frontend Engineer", // Optional
  "jobDescription": "...", // Optional
  "externalCandidateId": "cand_123", // Optional: Your system's candidate ID
  "externalReferenceId": "ref_456", // Optional: Your system's reference ID
  "expiryDays": 7 // Optional: 1-30 days, default 7
}
```

**Output:**

```json
{
  "interviewId": "int_abc123",
  "status": "INVITED",
  "inviteUrl": "https://app.teamcast.io/interview/...",
  "expiresAt": "2025-01-30T00:00:00.000Z"
}
```

### 2. interview.status

Check the current status of an interview.

**Input Schema:**

```json
{
  "interviewId": "int_abc123", // One of these is required
  "externalReferenceId": "ref_456", // One of these is required
  "candidateEmail": "john@example.com" // One of these is required
}
```

**Output:**

```json
{
  "interviewId": "int_abc123",
  "status": "IN_PROGRESS",
  "candidateName": "John Doe",
  "candidateEmail": "john@example.com",
  "skillsAssessed": ["JavaScript", "React"],
  "invitedAt": "2025-01-23T10:00:00.000Z",
  "acceptedAt": "2025-01-23T11:00:00.000Z",
  "resultsReady": false
}
```

**Status Values:**

- `INVITED` - Interview invitation sent
- `ACCEPTED` - Candidate accepted the invite
- `DECLINED` - Candidate declined
- `IN_PROGRESS` - Interview is ongoing
- `COMPLETED` - Interview finished, evaluating
- `EVALUATING` - AI is evaluating responses
- `RESULTS_READY` - Results available
- `EXPIRED` - Invitation expired
- `CANCELLED` - Interview cancelled

### 3. interview.results

Retrieve detailed interview results (only when status is `RESULTS_READY`).

**Input Schema:**

```json
{
  "interviewId": "int_abc123", // One of these is required
  "externalReferenceId": "ref_456" // One of these is required
}
```

**Output:**

```json
{
  "interviewId": "int_abc123",
  "candidateName": "John Doe",
  "overallScore": 85,
  "recommendation": "STRONG_HIRE",
  "resultSummary": "Excellent performance...",
  "skillResults": [
    {
      "skillName": "JavaScript",
      "score": 90,
      "proficiencyLevel": "Expert",
      "strengths": ["Async programming", "ES6+ features"],
      "improvements": ["Error handling patterns"],
      "feedback": "Demonstrated strong JavaScript skills..."
    }
  ],
  "completedAt": "2025-01-23T15:00:00.000Z",
  "duration": 45
}
```

### 4. interview.list

List interviews with optional filtering.

**Input Schema:**

```json
{
  "status": ["INVITED", "IN_PROGRESS"], // Optional: Filter by status
  "candidateEmail": "john@example.com", // Optional
  "externalReferenceId": "ref_456", // Optional
  "fromDate": "2025-01-01", // Optional
  "toDate": "2025-01-31", // Optional
  "limit": 20, // Optional: 1-100, default 20
  "offset": 0 // Optional: default 0
}
```

### 5. interview.cancel

Cancel a pending interview.

**Input Schema:**

```json
{
  "interviewId": "int_abc123", // Required
  "reason": "Position filled" // Optional
}
```

---

## API Reference

### Base URL

```text
https://api.teamcast.io/api/a2a
```

### Endpoints

| Method | Path                            | Description                  |
| ------ | ------------------------------- | ---------------------------- |
| GET    | `/.well-known/agent.json`       | Agent Card discovery         |
| GET    | `/api/a2a/health`               | Health check                 |
| POST   | `/api/a2a/`                     | JSON-RPC endpoint            |
| POST   | `/api/a2a/message`              | Alternative message endpoint |
| GET    | `/api/a2a/tasks`                | List tasks                   |
| GET    | `/api/a2a/tasks/:taskId`        | Get task details             |
| POST   | `/api/a2a/tasks/:taskId/cancel` | Cancel task                  |
| GET    | `/api/a2a/skills`               | List available skills        |
| GET    | `/api/a2a/skills/:skillId`      | Get skill details            |

### JSON-RPC Methods

| Method         | Description                       |
| -------------- | --------------------------------- |
| `message/send` | Send a message to execute a skill |
| `tasks/get`    | Get task by ID                    |
| `tasks/list`   | List tasks with filtering         |
| `tasks/cancel` | Cancel a task                     |
| `agent/info`   | Get agent information             |

---

## Code Examples

### Python Example

```python
import requests
import json

class TeamCastA2AClient:
    def __init__(self, api_key: str, base_url: str = "https://api.teamcast.io"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def _send_rpc(self, method: str, params: dict) -> dict:
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": f"req-{int(time.time())}"
        }
        response = requests.post(
            f"{self.base_url}/api/a2a/",
            headers=self.headers,
            json=payload
        )
        return response.json()

    def request_interview(
        self,
        candidate_email: str,
        candidate_name: str,
        skills: list[str],
        level: str = "INTERMEDIATE"
    ) -> dict:
        return self._send_rpc("message/send", {
            "message": {
                "role": "user",
                "parts": [
                    {
                        "type": "data",
                        "data": {
                            "skillId": "interview.request",
                            "candidateEmail": candidate_email,
                            "candidateName": candidate_name,
                            "skillsToAssess": skills,
                            "assessmentLevel": level
                        }
                    }
                ]
            }
        })

    def get_status(self, interview_id: str) -> dict:
        return self._send_rpc("message/send", {
            "message": {
                "role": "user",
                "parts": [
                    {
                        "type": "data",
                        "data": {
                            "skillId": "interview.status",
                            "interviewId": interview_id
                        }
                    }
                ]
            }
        })

    def get_results(self, interview_id: str) -> dict:
        return self._send_rpc("message/send", {
            "message": {
                "role": "user",
                "parts": [
                    {
                        "type": "data",
                        "data": {
                            "skillId": "interview.results",
                            "interviewId": interview_id
                        }
                    }
                ]
            }
        })

# Usage
client = TeamCastA2AClient("your-api-key")

# Request an interview
result = client.request_interview(
    candidate_email="john@example.com",
    candidate_name="John Doe",
    skills=["JavaScript", "React", "Node.js"],
    level="SENIOR"
)
print(f"Interview ID: {result['result']['task']['artifacts'][0]['parts'][1]['data']['interviewId']}")
```

### TypeScript/Node.js Example

```typescript
import axios from 'axios';

interface A2AClient {
  apiKey: string;
  baseUrl: string;
}

class TeamCastA2AClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.teamcast.io') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async sendRpc(method: string, params: Record<string, unknown>) {
    const response = await axios.post(
      `${this.baseUrl}/api/a2a/`,
      {
        jsonrpc: '2.0',
        method,
        params,
        id: `req-${Date.now()}`,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  async requestInterview(params: {
    candidateEmail: string;
    candidateName: string;
    skillsToAssess: string[];
    assessmentLevel?: 'JUNIOR' | 'INTERMEDIATE' | 'SENIOR' | 'LEAD';
    jobTitle?: string;
    externalReferenceId?: string;
  }) {
    return this.sendRpc('message/send', {
      message: {
        role: 'user',
        parts: [
          {
            type: 'data',
            data: {
              skillId: 'interview.request',
              ...params,
            },
          },
        ],
      },
    });
  }

  async getStatus(interviewId: string) {
    return this.sendRpc('message/send', {
      message: {
        role: 'user',
        parts: [
          {
            type: 'data',
            data: {
              skillId: 'interview.status',
              interviewId,
            },
          },
        ],
      },
    });
  }

  async getResults(interviewId: string) {
    return this.sendRpc('message/send', {
      message: {
        role: 'user',
        parts: [
          {
            type: 'data',
            data: {
              skillId: 'interview.results',
              interviewId,
            },
          },
        ],
      },
    });
  }

  async listInterviews(filters?: {
    status?: string[];
    limit?: number;
    offset?: number;
  }) {
    return this.sendRpc('message/send', {
      message: {
        role: 'user',
        parts: [
          {
            type: 'data',
            data: {
              skillId: 'interview.list',
              ...filters,
            },
          },
        ],
      },
    });
  }

  async cancelInterview(interviewId: string, reason?: string) {
    return this.sendRpc('message/send', {
      message: {
        role: 'user',
        parts: [
          {
            type: 'data',
            data: {
              skillId: 'interview.cancel',
              interviewId,
              reason,
            },
          },
        ],
      },
    });
  }
}

// Usage
const client = new TeamCastA2AClient('your-api-key');

async function main() {
  // Request interview
  const result = await client.requestInterview({
    candidateEmail: 'john@example.com',
    candidateName: 'John Doe',
    skillsToAssess: ['JavaScript', 'React', 'Node.js'],
    assessmentLevel: 'SENIOR',
    externalReferenceId: 'my-system-ref-123',
  });

  console.log('Interview requested:', result);

  // Check status later
  const status = await client.getStatus(result.result.task.taskId);
  console.log('Status:', status);
}

main();
```

### cURL Examples

**Request Interview:**

```bash
curl -X POST https://api.teamcast.io/api/a2a/ \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [
          {
            "type": "data",
            "data": {
              "skillId": "interview.request",
              "candidateEmail": "john@example.com",
              "candidateName": "John Doe",
              "skillsToAssess": ["JavaScript", "React"],
              "assessmentLevel": "SENIOR"
            }
          }
        ]
      }
    },
    "id": "req-1"
  }'
```

**Get Interview Status:**

```bash
curl -X POST https://api.teamcast.io/api/a2a/ \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [
          {
            "type": "data",
            "data": {
              "skillId": "interview.status",
              "interviewId": "int_abc123"
            }
          }
        ]
      }
    },
    "id": "req-2"
  }'
```

**Using Natural Language:**

```bash
curl -X POST https://api.teamcast.io/api/a2a/ \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [
          {
            "type": "text",
            "text": "Request an interview for John Doe (john@example.com) to assess JavaScript and React skills"
          },
          {
            "type": "data",
            "data": {
              "candidateEmail": "john@example.com",
              "candidateName": "John Doe",
              "skillsToAssess": ["JavaScript", "React"]
            }
          }
        ]
      }
    },
    "id": "req-3"
  }'
```

---

## Error Handling

### JSON-RPC Error Codes

| Code   | Name                  | Description                                 |
| ------ | --------------------- | ------------------------------------------- |
| -32700 | Parse Error           | Invalid JSON                                |
| -32600 | Invalid Request       | Invalid JSON-RPC request                    |
| -32601 | Method Not Found      | Method does not exist                       |
| -32602 | Invalid Params        | Invalid method parameters                   |
| -32603 | Internal Error        | Internal server error                       |
| -32001 | Unauthorized          | Missing or invalid API key                  |
| -32002 | Forbidden             | Client inactive or insufficient permissions |
| -32003 | Rate Limited          | Too many requests                           |
| -32004 | Task Not Found        | Task ID not found                           |
| -32005 | Unsupported Operation | Operation not supported                     |

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "Authentication required",
    "data": {
      "retryAfter": 60
    }
  },
  "id": "req-1"
}
```

### Rate Limiting

- Default: 60 requests per minute per client
- When rate limited, check `Retry-After` header
- Error code: `-32003`

---

## Architecture

### Component Overview

```text
External Agent
     |
     | JSON-RPC 2.0 over HTTPS
     v
+------------------+
|   A2A Routes     |  /api/a2a/*
+------------------+
     |
     v
+------------------+
|   Auth Middleware|  API Key validation
+------------------+
     |
     v
+------------------+
|   A2A Server     |  JSON-RPC routing
+------------------+
     |
     v
+------------------+
| Skill Registry   |  Skill lookup & execution
+------------------+
     |
     v
+------------------+
| Interview Skills |  interview.request, etc.
+------------------+
     |
     v
+------------------+
| MCP Interview    |  Actual interview logic
|    Service       |
+------------------+
     |
     v
+------------------+
|   Database       |  PostgreSQL
+------------------+
```

### Key Files

| File                                        | Description                      |
| ------------------------------------------- | -------------------------------- |
| `src/a2a/core/a2a.types.ts`                 | A2A protocol type definitions    |
| `src/a2a/core/a2a.server.ts`                | JSON-RPC server implementation   |
| `src/a2a/core/a2a.task.manager.ts`          | Task lifecycle management        |
| `src/a2a/config/a2a.config.ts`              | Agent Card and configuration     |
| `src/a2a/skills/skill.registry.ts`          | Skill registration and execution |
| `src/a2a/skills/interview.skills.ts`        | Interview skill handlers         |
| `src/a2a/middleware/a2a.auth.middleware.ts` | Authentication & rate limiting   |
| `src/a2a/routes/a2a.routes.ts`              | HTTP route definitions           |

### Adding New Skills

1. Define skill in `src/a2a/config/a2a.config.ts`:

```typescript
{
  id: 'myskill.action',
  name: 'My Skill Action',
  description: 'Does something useful',
  inputSchema: { ... },
  outputSchema: { ... },
  tags: ['myskill'],
}
```

2. Create handler in `src/a2a/skills/`:

```typescript
const mySkillHandler: A2ASkillHandler = async (params, context) => {
  // Your logic here
  return {
    state: A2ATaskState.COMPLETED,
    message: A2ATaskManager.createDataMessage(
      A2AMessageRole.AGENT,
      { result: 'success' },
      'Operation completed'
    ),
  };
};
```

3. Register in skill registration function:

```typescript
registry.registerHandler('myskill.action', mySkillHandler, ['required:scope']);
```

---

## Support

For issues or questions:

- Documentation: https://docs.teamcast.io/a2a
- Email: support@teamcast.io
- API Status: https://status.teamcast.io
