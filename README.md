# Teamcast Backend

🚀 Teamcast is an AI-powered platform for hiring and team management. Our intelligent platform helps organizations discover top candidates, streamline interviews, and build high-performing teams with the power of cutting-edge AI.

## What is Teamcast?

Teamcast transforms the way organizations hire and manage talent through:

### For Clients

- Create job listings by uploading a Job Description (JD)
- Search for matching candidates using AI
- Invite candidates and send AI-powered interview links

### For Candidates

- Sign up (INDIVIDUAL)
- Create a profile, upload a resume, and apply for jobs
- Go through AI-based screening and interviews
- Participate in online AI-driven interviews and move forward if selected

### For Partners

- Consulting firms can register and upload available consultants for contract opportunities, they will invite candidate with role as PARTNER_RESOURCES

## Project Structure

```bash
├── src/
│ ├── __tests__/         # Test files
│ ├── @types/            # TypeScript type definitions
│ ├── config/            # Configuration files
│ ├── controllers/       # Route controllers
│ ├── middleware/        # Express middleware
│ ├── routes/            # API routes
│ ├── services/          # Business logic
│ ├── shared/
│   ├── models/
│     ├── api/           # API request/response models
│     ├── domain/        # Domain models
│     ├── data/          # Data models
│   ├── validators/      # Request validation schemas
│   ├── utils/           # Shared utility functions
│ ├── utils/             # Utility functions
│ ├── app.ts             # Express app setup
│ └── index.ts           # Application entry point
├── prisma/              # Prisma schema and migrations
└── requests/            # REST client files
```

## Guidelines for Adding New APIs

When adding new APIs to the Teamcast backend, follow these standards:

### 1. Dependency Injection

- Use the local singleton decorator from `src/decorators/singleton` for dependency injection
- Do NOT use external DI libraries like tsyringe
- Example usage:

```typescript
import { singleton } from '../../decorators/singleton';

@singleton
export class MyService {
  constructor(private readonly myRepository: MyRepository) {}
}
```

### 2. Request and Response Models

- Create domain models in `src/shared/models/domain` first
- Then create API request/response models in `src/shared/models/api`
- Create directory based on the route name if needed
- API models should extend from:
  - `IApiResponse` - For standard API responses
  - `IApiRequest` - For request objects
  - `IPaginatedResponse` - For paginated responses

Example of domain model:

```typescript
// src/shared/models/domain/candidate/candidate.domain.ts
export interface ICandidateDomain {
  id: string;
  name: string;
  email: string;
  // other properties
}

export type ICandidateCreate = Omit<
  ICandidateDomain,
  'id' | 'createdAt' | 'updatedAt'
>;

export type ICandidateCreated = ICandidateDomain;
```

Example of API models using domain model:

```typescript
// src/shared/models/api/candidate/candidate.api.ts
import { IApiRequest } from '../common/common';
import {
  ICandidateDomain,
  ICandidateCreate,
  ICandidateCreated,
} from '../../domain/candidate/candidate.domain';

export type ICandidateCreateApiRequest = IApiRequest<ICandidateCreate>;
export type ICandidateCreateApiResponse = IApiResponse<ICandidateCreated>;
```

### 3. Stages for Adding a Simple API Endpoint

To add a new API endpoint, follow these stages:

1. **Create Domain Model**

   - Create a domain model in `src/shared/models/domain/` with require folder struture
   - Define properties representing the business entity
   - Add OpenAPI documentation

2. **Create API Models**

   - Create Request model in `src/shared/models/api/` with require folder struture and filename
   - Create Response model in `src/shared/models/api/` with require folder struture and filename
   - Extend from appropriate base interfaces (`IApiRequest`, `IApiResponse`)
   - Add OpenAPI documentation

3. **Create Validator**

   - Create validator to `src/shared/validators/` with require folder struture and filename
   - Use Zod for validation with appropriate error messages

4. **Create Service**

   - Create service in `src/services/` with require folder struture and filename
   - Implement methods that accept and return domain models
   - Handle business logic and data access

5. **Create Controller**

   - Create controller in `src/controllers/` with require folder struture and filename
   - Extend from `BaseController`
   - Use `handleRequest` and `createIApiRequest` helpers
   - Pass domain models to service methods

6. **Create Route**

   - Create route file in `src/routes/` with require folder struture and filename
   - Apply middleware (auth, validation)
   - Add OpenAPI documentation
   - Connect to controller methods

7. **Register Route**

   - Add new route to `src/routes/` with valid folder and filename or update existing route file to include the new route
   - Also, if needed update `src/routes/app.ts` to include the new route

8. **Test Endpoint**
   - Create a tests file in `src/__tests__/`
   - Test success and error cases

### 3. Pagination for API Endpoints

For endpoints that return lists of items, following this pattern:

```typescript
// 1. Create a validator for the list endpoint in src/shared/validators
import { z } from "zod";

export const candidateListValidator = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, { message: "Page must be a number" })
      .transform(Number)
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, { message: "Limit must be a number" })
      .transform(Number)
      .optional(),
    sortBy: z.string().optional(),
    sortOrder: z
      .enum(["asc", "desc"], {
        message: "Sort order must be either 'asc' or 'desc'"
      })
      .optional(),
    search: z.string().optional(),
    status: z.string().optional(),
  }),
});

// 2. In your controller, use the createIApiRequest helper
import { createIApiRequest } from "@/utils/api";
import { ICandidateListApiResponse, ICandidateListApiRequest } from "@/shared/models/api/candidate/candidate.response";

listCandidates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  this.handleRequest<ICandidateListApiResponse>(
    req,
    res,
    next,
    async () => {
      const listCandidatesRequest = createIApiRequest<ICandidateListApiRequest>(req);

      const result = await this.candidateService.listCandidates(
        listCandidatesRequest.filters,
        listCandidatesRequest.pagination
      );

      return result;
    }
  );
};

// 3. In your service, work with domain models
import { ICandidateDomain } from "@/shared/models/domain/candidate/candidate.domain";
import { ICandidateFilterQuery } from "@/shared/models/api/candidate/candidate.request";
import { ICandididateListApiResponse } from "@/shared/models/api/common/common.api";

async listCandidates(
  filter: ICandidateFilterQuery,
  paginationRequest: IPaginationRequest
): Promise<IPaginatedResponse<ICandidateDomain>> {
  // Implementation logic

  // Return properly structured paginated response
  return {
    items: candidates, // Array of ICandidateDomain objects
    pagination: {
      total: totalCount,
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      totalPages: Math.ceil(totalCount / (pagination.limit || 10))
    }
  };
}
```

### 4. Validators

- Add validators in `src/shared/validators`
- Create directory based on the route name if needed
- Include proper validation messages

Example:

```typescript
// src/shared/validators/candidate/createCandidateValidator.ts
import { z } from 'zod';

export const createCandidateValidator = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  // other validations
});
```

### 5. Database Models and Selection

- Prisma schema is defined in `prisma/schema.prisma`
- When fetching objects (findUnique, findFirst), create selection models in `src/models/internal`

### 6. Swagger Documentation

- Add OpenAPI annotations directly in route files using JSDoc comments
- Document all endpoints, parameters, request bodies, and responses
- Use schema references for reusable components
- Ensure security requirements are documented
- Start with domain documenting models and way up to api models (except Request models) and then routes.

Example of route documentation:

```typescript
/**
 * @openapi
 * /api/candidates:
 *   post:
 *     summary: Create a new candidate
 *     description: Creates a new candidate in the system
 *     tags:
 *       - Candidates
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCandidateRequest'
 *     responses:
 *       201:
 *         description: Candidate created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateResponse'
 *       400:
 *         description: Invalid input dataErrorResponse'
 *       401:
 *         description: Invalid input data
 */
```

For paginated endpoints, include standard pagination parameters:

```typescript
/**
 * @openapi
 * /api/candidates:
 *   get:
 *     summary: List candidates
 *     description: Retrieves a paginated list of candidates
 *     tags:
 *       - Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortOrderParam'
 *       - name: status
 *         in: query
 *         description: Filter by candidate status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PENDING, REJECTED]
 *       - name: search
 *         in: query
 *         description: Search term for candidate name or email
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of candidates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ICandidateListResponse'
 */
```

Define schema components separately for reuse:

```typescript
/**
 * @openapi
 * components:
 *   schemas:
 *     ICreateCandidateRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           description: The candidate's full name
 *         email:
 *           type: string
 *           format: email
 *           description: The candidate's email address
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: List of candidate skills
 */
```

Common parameters and responses should be defined once and referenced:

```typescript
/**
 * @openapi
 * components:
 *   parameters:
 *     PageParam:
 *       name: page
 *       in: query
 *       description: Page number for pagination
 *       schema:
 *         type: integer
 *         default: 1
 *         minimum: 1
 *     LimitParam:
 *       name: limit
 *       in: query
 *       description: Number of items per page
 *       schema:
 *         type: integer
 *         default: 10
 *         minimum: 1
 *         maximum: 100
 *   responses:
 *     Unauthorized:
 *       description: Authentication required or token expired
 */
```

## Architecture

Teamcast follows a layered architecture with clear separation of concerns:

### Model Layers

1. **Data Models**

   - Generated from Prisma schema
   - Located in the database layer
   - Should never be modified directly
   - Represent the database structure

2. **Domain Models**

   - Located in `src/shared/models/domain`
   - Core data structures used throughout the application
   - Independent of external concerns (database, API)
   - Define the business objects and their relationships

3. **API Models**
   - Located in `src/shared/models/api`
   - Extend from common interfaces (`IApiResponse`, `IApiRequest`, `IPaginatedResponse`)
   - Define the contract between clients and the API
   - Separate request and response models

### Component Interaction

1. **Controllers**

   - Use `handleRequest` and `createIApiRequest` helpers
   - Convert API requests to domain models
   - Pass domain models to services
   - Return API responses

2. **Services**

   - Handle business logic using domain models
   - Interact with the database through repositories
   - Return domain models to controllers
   - Follow the relationship structures defined in `schema.prisma`
   - Implement helper methods like `toClientUserDomain` to convert database models to domain models
   - Ensure proper handling of one-to-many and many-to-many relationships

3. **Routes**
   - Define API endpoints
   - Apply middleware (authentication, validation)
   - Document API using OpenAPI annotations

## Database Relationship Handling

When working with database models and relationships, follow these guidelines:

### 1. Follow Prisma Schema Relationships

Always follow the relationship structures defined in `schema.prisma` when implementing services. For example, if you have a one-to-many relationship between `Client` and `ClientUser`, and a one-to-one relationship between `ClientUser` and `User`:

```typescript
// Example Prisma Schema Relationship
model Client {
  id          String       @id @default(uuid())
  // other fields
  clientUsers ClientUser[] // one-to-many relationship
}

model ClientUser {
  id       String @id @default(uuid())
  clientId String
  userId   String @unique
  // other fields
  client   Client @relation(fields: [clientId], references: [id])
  user     User   @relation(fields: [userId], references: [id])
}

model User {
  id         String      @id @default(uuid())
  // other fields
  clientUser ClientUser?
}
```

Then your service should properly maintain these relationships in all operations:

```typescript
// Creating a new user with client relationship
await this.prisma.$transaction(async (tx) => {
  // First create the user
  const user = await tx.user.create({
    data: {
      email: userData.email,
      name: userData.name,
      // other user fields
    },
  });

  // Then create the client_user association
  const clientUser = await tx.client_user.create({
    data: {
      userId: user.id,
      clientId: clientId,
    },
  });

  return { user, clientUser };
});
```

### 2. Implement Domain Model Conversion Helpers

For each domain model, implement a conversion helper method (like `toClientUserDomain`) to convert database entities to domain models:

```typescript
// src/shared/models/domain/client/user.domain.ts
export function toClientUserDomain(
  user: any,
  clientUser?: any
): IClientUserDomain {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    // other fields mapping
    clientId: clientUser?.clientId || '',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
```

Use these helpers in your services when returning data:

```typescript
// In your service method
const result = await this.prisma.$transaction(/* transaction code */);
return toClientUserDomain(result.user, result.clientUser);
```

### 3. Handle Relationship Queries Efficiently

When querying related data, use Prisma's relationship queries to minimize database roundtrips:

```typescript
// Inefficient - requires multiple queries
const clientUsers = await this.prisma.client_user.findMany({
  where: { clientId },
});
const users = await Promise.all(
  clientUsers.map((cu) =>
    this.prisma.user.findUnique({ where: { id: cu.userId } })
  )
);

// Efficient - single query with relationship loading
const clientUsers = await this.prisma.client_user.findMany({
  where: { clientId },
  include: { user: true },
});
const users = clientUsers.map((cu) => cu.user);
```

### 4. Use Transactions for Multi-Entity Operations

For operations that involve multiple related entities, use transactions to ensure data consistency:

```typescript
// Delete related entities in a transaction
await this.prisma.$transaction(async (tx) => {
  // First delete the client_user association
  await tx.client_user.delete({
    where: { id: clientUser.id },
  });

  // Then delete the user
  await tx.user.delete({
    where: { id: userId },
  });
});
```

## Reference API Examples

### ClientUserInvitations

This example demonstrates how to implement user invitation functionality in Teamcast, following the recommended architecture.

#### 1. Domain Models

First, create domain models that represent the core business entities:

```typescript
// src/shared/models/domain/client/user.invitation.domain.ts
import { IClientUserInvitationData } from '@/shared/models/data/client.user.invitation';
import {
  ClientUserInvitationStatusEnum,
  UserRoleEnum,
} from '../../data/enums.data';
import { IAuthToken } from '../auth/auth.token.domain';
import { IAuthUser } from '../auth/auth.user.domain';

// Domain model (excludes sensitive fields from data model)
export type IClientUserInvitation = Omit<
  IClientUserInvitationData,
  'token' | 'expiresAt'
>;

// Request payload for sending an invitation
export interface IClientUserInvitationSend {
  email: string;
  name: string;
  jobTitle?: string;
  role: UserRoleEnum;
}

// Request for accepting an invitation
export interface IClientUserInvitationAccept {
  token?: string;
}

// Response after accepting an invitation
export interface IClientUserInvitationAccepted {
  user: IAuthUser;
  authToken: IAuthToken;
}

// Filter parameters for listing invitations
export interface IClientUserInvitationFilterQuery {
  email?: string;
  name?: string;
  role?: UserRoleEnum;
  status?: ClientUserInvitationStatusEnum;
}

// Route parameter interface with invitation ID
export interface IInvitationIdParams {
  clientUserInvitationId: string;
}
```

#### 2. API Models

Next, create API request/response models that extend from the base interfaces:

```typescript
// src/shared/models/api/client/user.invitation.api.ts
import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
  IPaginatedResponse,
} from '../common/common';
import {
  IClientUserInvitationSend,
  IClientUserInvitationFilterQuery,
  IInvitationIdParams,
  IClientUserInvitation,
  IClientUserInvitationAccepted,
} from '../../domain/client/user.invitation.domain';

// Send invitation request/response
export type IClientUserInvitationSendApiRequest =
  IApiRequest<IClientUserInvitationSend>;
export type IClientUserInvitationSendApiResponse =
  IApiResponse<IClientUserInvitation>;

// Get invitation request/response
export type IClientUserInvitationGetApiRequest = IApiRequest<
  void,
  void,
  IInvitationIdParams
>;
export type IClientUserInvitationGetApiResponse =
  IApiResponse<IClientUserInvitation>;

// Withdraw invitation request/response
export type IClientUserInvitationWithdrawApiRequest = IApiRequest<
  void,
  void,
  IInvitationIdParams
>;
export type IClientUserInvitationWithdrawApiResponse =
  IApiResponse<IClientUserInvitation>;

// Resend invitation request/response
export type IClientUserInvitationResendApiRequest = IApiRequest<
  void,
  void,
  IInvitationIdParams
>;
export type IClientUserInvitationResendApiResponse =
  IApiResponse<IClientUserInvitation>;

// Accept invitation request/response
export type IClientUserInvitationAcceptApiRequest = IApiRequest<
  void,
  void,
  { token: string }
>;
export type IClientUserInvitationAcceptApiResponse =
  IApiResponse<IClientUserInvitationAccepted>;

// List invitations request/response
export type IClientUserInvitationListApiRequest = IApiPaginatedRequest<
  void,
  IClientUserInvitationFilterQuery,
  void
>;
export type IClientUserInvitationListApiResponse =
  IPaginatedResponse<IClientUserInvitation>;
```

#### 3. Validators

Create validators using Zod for request validation:

```typescript
// src/shared/validators/client/user.invitation.validator.ts
import { z } from 'zod';
import {
  UserRoleEnum,
  ClientUserInvitationStatusEnum,
} from '../../models/data/enums';

// Validator for sending an invitation
export const clientUserInvitationSendValidator = z.object({
  body: z.object({
    email: z
      .string()
      .email({ message: 'Invalid email address format' })
      .max(255, { message: 'Email must be at most 255 characters long' }),
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .max(100, { message: 'Name must be at most 100 characters long' }),
    jobTitle: z
      .string()
      .min(2, { message: 'Job title must be at least 2 characters long' })
      .max(100, { message: 'Job title must be at most 100 characters long' })
      .optional(),
    role: z.nativeEnum(UserRoleEnum, {
      message: 'Invalid role. Must be one of the valid user roles',
    }),
  }),
});

// Validator for invitation ID in route parameters
export const invitationIdValidator = z.object({
  params: z.object({
    clientUserInvitationId: z
      .string()
      .uuid({ message: 'Invalid invitation ID format' }),
  }),
});

// Validator for listing invitations with filtering
export const clientUserInvitationListValidator = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, { message: 'Page must be a number' })
      .transform(Number)
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, { message: 'Limit must be a number' })
      .transform(Number)
      .optional(),
    sortBy: z.string().optional(),
    sortOrder: z
      .enum(['asc', 'desc'], {
        message: "Sort order must be either 'asc' or 'desc'",
      })
      .optional(),
    search: z
      .string()
      .max(256, {
        message: 'Search term must be at most 256 characters long',
      })
      .optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    role: z.nativeEnum(UserRoleEnum).optional(),
    status: z.nativeEnum(ClientUserInvitationStatusEnum).optional(),
  }),
});

// Validator for accepting an invitation with a token
export const clientUserInvitationAcceptValidator = z.object({
  params: z.object({
    token: z.string().min(1, { message: 'Invitation token is required' }),
  }),
});
```

#### 4. Service Implementation

Implement the business logic in a service class:

```typescript
// src/services/client/user.invitation.service.ts
import { PrismaClient } from '@prisma/client';
import { singleton } from '../../decorators/singleton';
import { NotificationService } from '../notification/notification.service';
import { AuthService } from '../auth/auth.service';
import {
  IClientUserInvitation,
  IClientUserInvitationSend,
} from '@/shared/models/domain/client/user.invitation.domain';
import { ClientUserInvitationStatusEnum } from '@/shared/models/data/enums.data';
import { AppError, ErrorCode } from '@/utils/errors';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '@/shared/models/api/common/common.api';
import { getPaginationInfo } from '@/utils/pagination';
import { ENV } from '@/config/env';
import * as crypto from 'crypto';

@singleton
export class ClientUserInvitationService {
  private readonly prisma: PrismaClient;
  private readonly invitationExpiryHours = 72; // 3 days

  constructor(
    private readonly notificationService: NotificationService,
    private readonly authService: AuthService
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Send invitation to a user to join a client team
   */
  async sendInvitation(
    clientId: string,
    inviterUserId: string,
    invitationData: IClientUserInvitationSend
  ): Promise<IClientUserInvitation> {
    try {
      // Implementation details for sending invitation
      // - Check if client exists
      // - Check if email is already registered
      // - Check for existing invitations
      // - Generate unique token
      // - Create invitation record
      // - Send notification email

      // Return invitation object (without sensitive data)
      return toIClientUserInvitation(invitation);
    } catch (error) {
      // Error handling
      throw error;
    }
  }

  /**
   * List all invitations for a client with optional filtering
   */
  async listInvitations(
    clientId: string,
    userId: string,
    filter: IClientUserInvitationFilterQuery,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<IClientUserInvitation>> {
    try {
      // Build query filters
      const where = {
        clientId,
        ...(filter.email
          ? { email: { contains: filter.email, mode: 'insensitive' as const } }
          : {}),
        ...(filter.name
          ? { name: { contains: filter.name, mode: 'insensitive' as const } }
          : {}),
        ...(filter.role ? { role: filter.role } : {}),
        ...(filter.status ? { status: filter.status } : {}),
      };

      // Count total matching records
      const total = await this.prisma.client_user_invitation.count({ where });

      // Get pagination info
      const paginationInfo = getPaginationInfo(paginationRequest);

      // Get paginated results
      const invitations = await this.prisma.client_user_invitation.findMany({
        where,
        ...paginationInfo,
      });

      // Return paginated response
      return {
        items: invitations.map(toIClientUserInvitation),
        pagination: {
          total,
          page: paginationRequest.page ?? ENV.DEFAULT_PAGE,
          limit: paginationRequest.limit ?? ENV.DEFAULT_LIMIT,
          totalPages: Math.ceil(
            total / (paginationRequest.limit ?? ENV.DEFAULT_LIMIT)
          ),
        },
      };
    } catch (error) {
      // Error handling
      throw error;
    }
  }

  // Other methods: getInvitation, withdrawInvitation, resendInvitation, acceptInvitation
}

// Helper function to convert data model to domain model
function toIClientUserInvitation(invitation: any): IClientUserInvitation {
  const { token, expiresAt, ...rest } = invitation;
  return rest;
}
```

#### 5. Controller Implementation

Create a controller that uses the service:

```typescript
// src/controllers/client/user.invitation.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ClientUserInvitationService } from '@/services/client/user.invitation.service';
import { BaseController } from '../base.controller';
import { createIApiRequest } from '@/utils/api.data';
import {
  IClientUserInvitationSendApiRequest,
  IClientUserInvitationSendApiResponse,
  IClientUserInvitationGetApiRequest,
  IClientUserInvitationGetApiResponse,
  IClientUserInvitationWithdrawApiRequest,
  IClientUserInvitationWithdrawApiResponse,
  IClientUserInvitationResendApiRequest,
  IClientUserInvitationResendApiResponse,
  IClientUserInvitationAcceptApiRequest,
  IClientUserInvitationAcceptApiResponse,
  IClientUserInvitationListApiRequest,
  IClientUserInvitationListApiResponse,
} from '@/shared/models/api/client/user.invitation.api';
import { logger } from '@/utils/logger';

export class ClientUserInvitationController extends BaseController {
  constructor(
    private readonly clientUserInvitationService: ClientUserInvitationService
  ) {
    super();
  }

  /**
   * Send an invitation to a user to join a client team
   */
  sendInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserInvitationSendApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const userId = req.user.id;

        // Get the invitation data from the request body
        const invitationRequest =
          createIApiRequest<IClientUserInvitationSendApiRequest>(req);

        // Call service method with domain model
        return await this.clientUserInvitationService.sendInvitation(
          clientId,
          userId,
          invitationRequest.data
        );
      }
    );
  };

  /**
   * List invitations for a client
   */
  listInvitations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IClientUserInvitationListApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const userId = req.user.id;

        // Extract filter parameters
        const listInvitationsRequest =
          createIApiRequest<IClientUserInvitationListApiRequest>(req);

        // Call service method with domain models
        return await this.clientUserInvitationService.listInvitations(
          clientId,
          userId,
          listInvitationsRequest.filters,
          listInvitationsRequest.pagination
        );
      }
    );
  };

  // Other methods: getInvitation, withdrawInvitation, resendInvitation, acceptInvitation
}
```

#### 6. Route Configuration

Finally, set up the API routes with middleware and validation:

```typescript
// src/routes/client/user.invitation.routes.ts
import { Router } from 'express';
import { ClientUserInvitationController } from '@/controllers/client/user.invitation.controller';
import { ClientUserInvitationService } from '@/services/client/user.invitation.service';
import { AuthService } from '@/services/auth/auth.service';
import { NotificationFactory } from '@/services/notification/notification.factory';
import {
  requireAuth,
  requireActiveUser,
  requireRole,
  validateRequest,
  requireUserType,
} from '@/middleware';
import {
  clientUserInvitationSendValidator,
  invitationIdValidator,
  clientUserInvitationListValidator,
  clientUserInvitationAcceptValidator,
} from '@/shared/validators/client/user.invitation.validator';
import { UserRoleEnum, UserTypeEnum } from '@/shared/models/data/enums.data';

const router = Router();

// Initialize services and controller
const notificationService = new NotificationFactory().getNotificationService();
const authService = new AuthService(notificationService);
const clientUserInvitationService = new ClientUserInvitationService(
  notificationService,
  authService
);
const clientUserInvitationController = new ClientUserInvitationController(
  clientUserInvitationService
);

// Client roles that can manage invitations
const clientManagerRoles = [UserRoleEnum.ADMIN, UserRoleEnum.HR];

/**
 * @openapi
 * /client/users/invitations:
 *   post:
 *     summary: Send user invitation
 *     description: Invite a user to join a client organization
 *     tags:
 *       - Client User Invitations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientUserInvitationRequest'
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post(
  '/',
  requireAuth,
  requireActiveUser,
  requireUserType(UserTypeEnum.CLIENT),
  requireRole(clientManagerRoles),
  validateRequest(clientUserInvitationSendValidator),
  clientUserInvitationController.sendInvitation
);

/**
 * @openapi
 * /client/users/invitations:
 *   get:
 *     summary: List invitations
 *     description: List all user invitations for the client organization with pagination
 *     tags:
 *       - Client User Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, WITHDRAWN, EXPIRED]
 *     responses:
 *       200:
 *         description: List of invitations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get(
  '/',
  requireAuth,
  requireActiveUser,
  requireUserType(UserTypeEnum.CLIENT),
  requireRole(clientManagerRoles),
  validateRequest(clientUserInvitationListValidator),
  clientUserInvitationController.listInvitations
);

// Other routes: GET /:clientUserInvitationId, DELETE /:clientUserInvitationId,
// POST /:clientUserInvitationId/resend, GET /accept/:token

export default router;
```

#### 7. Registration in Main Routes File

```typescript
// src/routes/index.ts
import { Router } from 'express';
import clientUserInvitationRoutes from './client/user.invitation.routes';

const router = Router();

// Client routes
router.use('/client/users/invitations', clientUserInvitationRoutes);

// Other routes...

export default router;
```

This example demonstrates implementing a complete feature with proper separation of concerns using domain models, API models, services, controllers, and routes with validation and OpenAPI documentation.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Postgres (v8.0 or higher)
- Docker and Docker Compose (optional)

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/teamcastai/teamcast-backend.git
cd teamcast
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Set up the database:

```bash
npm run migrate:dev
npm run seed:dev
```

5. Start the development server:

```bash
npm run dev
```

### Docker Setup

Run the entire stack using Docker Compose:

```bash
# Start all services
npm run docker:dev

# View logs
npm run docker:dev:logs

# Rebuild and start services
npm run docker:dev:build

# Stop services and remove volumes
npm run docker:dev:down
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:e2e` - Run E2E tests
- `npm run test:coverage` - Generate test coverage
- `npm run migrate:dev` - Run database migrations
- `npm run seed:dev` - Seed database with test data

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Trivy Scan

Install Trivy by following the instructions at [https://trivy.dev/latest/](https://trivy.dev/latest/).

## Run Trivy Scan

Run Trivy to scan the project for vulnerabilities:

```bash
trivy fs .
```

---

## Pre-Commit Setup

1. Check the pre-commit version:

   ```bash
   pre-commit --version
   ```

2. Install pre-commit hooks:

   ```bash
   pre-commit install
   ```

3. Run pre-commit hooks on all files:
   ```bash
   pre-commit run --all-files
   ```

---
