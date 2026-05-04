# Teamcast API Implementation Guidelines

## 1. Project Structure

```bash
src/
├── __tests__/         # Test files
├── @types/            # TypeScript type definitions
├── config/            # Configuration files
├── controllers/       # Route controllers
├── middleware/        # Express middleware
├── routes/            # API routes
├── services/          # Business logic
├── shared/
│   ├── models/
│   │   ├── api/      # API request/response models
│   │   ├── domain/   # Domain models
│   │   └── data/     # Data models
│   ├── validators/   # Request validation schemas
│   └── utils/        # Shared utility functions
└── utils/            # Utility functions
```

## 2. API Implementation Flow

### 2.1 Domain Models (First Stage)

- Create domain models in `src/shared/models/domain/`
- Define core business entities and their relationships
- Use TypeScript interfaces/types
- Example:

```typescript
// src/shared/models/domain/client/user.invitation.domain.ts
export interface IClientUserInvitation {
  id: string;
  email: string;
  name: string;
  role: UserRoleEnum;
  status: ClientUserInvitationStatusEnum;
  // ... other properties
}
```

### 2.2 API Models

- Create in `src/shared/models/api/`
- Extend from base interfaces:
  - `IApiRequest` - For request objects
  - `IApiResponse` - For standard responses
  - `IPaginatedResponse` - For paginated responses
- Example:

```typescript
export type IClientUserInvitationSendApiRequest =
  IApiRequest<IClientUserInvitationSend>;
export type IClientUserInvitationSendApiResponse =
  IApiResponse<IClientUserInvitation>;
```

### 2.3 Validators

- Create in `src/shared/validators/`
- Use Zod for validation
- Include proper error messages
- Example:

```typescript
export const clientUserInvitationSendValidator = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(1, 'Name is required'),
  role: z.nativeEnum(UserRoleEnum),
});
```

### 2.4 Controllers

- Extend from `BaseController`
- Use `handleRequest` helper
- Use `createIApiRequest` for request parsing
- Implement proper error handling and logging
- Example:

```typescript
export class ClientUserInvitationController extends BaseController {
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
        const request =
          createIApiRequest<IClientUserInvitationSendApiRequest>(req);
        return await this.service.sendInvitation(request.data);
      }
    );
  };
}
```

### 2.5 Routes

- Define in `src/routes/`
- Apply middleware (auth, validation)
- Add OpenAPI documentation
- Example:

```typescript
/**
 * @openapi
 * /client/users-invitations:
 *   post:
 *     summary: Send a client user invitation
 *     description: Allows client admins to send invitations
 *     tags:
 *       - Client User Invitations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientUserInvitationSend'
 */
router.post(
  '/',
  [requireAuth, validateRequest(validator)],
  controller.sendInvitation
);
```

## 3. Middleware Usage

### 3.1 Authentication & Authorization

- `requireAuth` - Basic authentication check
- `requireActiveUser` - Check if user is active
- `requireRole` - Role-based access control
- `requireUserType` - User type validation

### 3.2 Validation

- Use `validateRequest` with Zod validators
- Apply validation before controller methods

## 4. Error Handling

- Use `handleRequest` helper in controllers
- Implement proper error logging
- Return appropriate HTTP status codes
- Include meaningful error messages

## 5. Logging

- Use the logger utility
- Include context and relevant data
- Log important operations and errors
- Example:

```typescript
logger.info({
  message: 'Operation description',
  context: 'Controller.method',
  relevantData: data,
});
```

## 6. OpenAPI Documentation

- Document all endpoints using JSDoc comments
- Include:
  - Summary and description
  - Security requirements
  - Request/response schemas
  - Error responses
  - Tags for grouping

## 7. Pagination

- Use standard pagination parameters:
  - `page`
  - `limit`
  - `sortBy`
  - `sortOrder`
  - `search`
- Return paginated responses using `IPaginatedResponse`

## 8. Best Practices

1. Follow the layered architecture
2. Keep controllers thin
3. Implement proper validation
4. Use TypeScript types consistently
5. Document all public APIs
6. Implement proper error handling
7. Use transactions for multi-entity operations
8. Follow RESTful principles
9. Use proper HTTP methods
10. Implement proper security measures

## 9. Swagger/OpenAPI Documentation

### 9.1 Basic Structure

- Use JSDoc comments with `@openapi` tag
- Document all endpoints, parameters, and responses
- Group related endpoints using tags
- Example:

```typescript
/**
 * @openapi
 * /api/resource:
 *   post:
 *     summary: Create a new resource
 *     description: Detailed description of the endpoint
 *     tags:
 *       - Resource Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICreateResourceRequest'
 *     responses:
 *       201:
 *         description: Resource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IResourceResponse'
 */
```

### 9.2 Schema Components

- Define reusable schemas in components section
- Reference schemas using `$ref`
- Example:

```typescript
/**
 * @openapi
 * components:
 *   schemas:
 *     IResource:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [TYPE1, TYPE2]
 */
```

### 9.3 Parameters

- Define common parameters for reuse
- Include pagination, sorting, and filtering parameters
- Example:

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
 */
```

### 9.4 Security Schemes

- Define authentication methods
- Example:

```typescript
/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
```

## 10. Singleton Pattern Usage

### 10.1 Service Factories

- Use Singleton pattern for service factories
- Ensure single instance of services that manage shared resources
- Example:

```typescript
export class NotificationFactory {
  private static instance: NotificationFactory;
  private notificationProvider: INotificationProvider;

  private constructor() {
    // Initialize notification provider
  }

  public static getInstance(): NotificationFactory {
    if (!NotificationFactory.instance) {
      NotificationFactory.instance = new NotificationFactory();
    }
    return NotificationFactory.instance;
  }

  public getNotificationProvider(): INotificationProvider {
    return this.notificationProvider;
  }
}

// Usage in routes
const notificationProvider =
  new NotificationFactory().getNotificationProvider();
```

### 10.2 Configuration Management

- Use Singleton for configuration management
- Ensure consistent configuration across the application
- Example:

```typescript
export class ConfigManager {
  private static instance: ConfigManager;
  private config: IAppConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): IAppConfig {
    return this.config;
  }
}
```

### 10.3 Database Connections

- Use Singleton for database connection management
- Maintain single connection pool
- Example:

```typescript
export class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getPrismaClient(): PrismaClient {
    return this.prisma;
  }
}
```

### 10.4 Best Practices for Singleton Usage

1. Use for shared resources that should have a single instance
2. Implement lazy initialization
3. Make constructor private
4. Provide static getInstance method
5. Consider thread safety if needed
6. Document the singleton nature of the class
7. Use dependency injection where possible
8. Avoid global state when possible
9. Consider using dependency injection containers
10. Test singleton behavior in unit tests

## 11. Domain Models Documentation

### 11.1 Structure and Location

- Create domain models in `src/shared/models/domain/`
- Use TypeScript interfaces/types
- Include OpenAPI documentation
- Example:

```typescript
/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUser:
 *       type: object
 *       description: Domain model representing a client user
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the client user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the client user
 *         name:
 *           type: string
 *           description: Full name of the client user
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role assigned to the client user
 *         status:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *           description: Current status of the client user account
 *       required:
 *         - id
 *         - email
 *         - name
 *         - role
 *         - status
 */
export interface IClientUser {
  id: string;
  email: string;
  name: string;
  role: UserRoleEnum;
  status: UserStatusEnum;
}
```

### 11.2 Best Practices

1. Document all properties with descriptions
2. Specify required fields
3. Use proper TypeScript types
4. Include format specifications (uuid, email, date-time)
5. Reference enums and other schemas using `$ref`
6. Group related models in the same file
7. Use consistent naming conventions
8. Include examples for complex types
9. Document relationships between models
10. Keep models focused and single-responsibility

## 12. API Models Documentation

### 12.1 Structure and Location

- Create API models in `src/shared/models/api/`
- Extend from base interfaces:
  - `IApiRequest` - For request objects
  - `IApiResponse` - For standard responses
  - `IPaginatedResponse` - For paginated responses
- Example:

```typescript
/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserCreateApiRequest:
 *       type: object
 *       description: Request to create a new client user
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IClientUserCreate'
 *         filters:
 *           type: object
 *         params:
 *           type: object
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 */
export type IClientUserCreateApiRequest = IApiRequest<IClientUserCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientUserCreateApiResponse:
 *       type: object
 *       description: Response after creating a client user
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IClientUser'
 *         message:
 *           type: string
 *           description: Success message
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 */
export type IClientUserCreateApiResponse = IApiResponse<IClientUser>;
```

### 12.2 Best Practices

1. Document all request/response models
2. Use proper inheritance from base interfaces
3. Include comprehensive descriptions
4. Reference domain models using `$ref`
5. Document all possible response codes
6. Include examples for complex requests
7. Document security requirements
8. Use consistent naming conventions
9. Group related API models together
10. Document validation rules

## 13. Routes Documentation

### 13.1 Structure and Location

- Create route files in `src/routes/`
- Include OpenAPI documentation
- Example:

```typescript
/**
 * @openapi
 * /client/users-invitations:
 *   post:
 *     summary: Send a client user invitation
 *     description: Allows client admins or HR to send invitations to users to join their organization
 *     tags:
 *       - Client User Invitations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IClientUserInvitationSend'
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IClientUserInvitationSendApiResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post(
  '/',
  [requireAuth, validateRequest(validator)],
  controller.sendInvitation
);
```

### 13.2 Best Practices

1. Document all endpoints with OpenAPI
2. Include comprehensive descriptions
3. Document all possible response codes
4. Specify security requirements
5. Document request/response schemas
6. Use proper HTTP methods
7. Group related endpoints with tags
8. Document path parameters
9. Document query parameters
10. Include examples for complex requests

### 13.3 Middleware Documentation

- Document middleware requirements
- Example:

```typescript
// Client auth middleware - applies to all profile routes
const clientAuthMiddleware = [
  requireAuth,
  requireActiveUser,
  requireUserType([UserTypeEnum.CLIENT]),
];

// Admin-only middleware - applies to all update routes
const roleHrAdminOnlyMiddleware = [
  ...clientAuthMiddleware,
  requireRole([UserRoleEnum.HR, UserRoleEnum.ADMIN]),
];
```

### 13.4 Validation Documentation

- Document validation requirements
- Example:

```typescript
/**
 * @openapi
 * components:
 *   schemas:
 *     ClientUserInvitationSendValidator:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the invitee
 *         name:
 *           type: string
 *           description: Full name of the invitee
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           description: Role to assign to the user
 *       required:
 *         - email
 *         - name
 *         - role
 */
export const clientUserInvitationSendValidator = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(1, 'Name is required'),
  role: z.nativeEnum(UserRoleEnum),
});
```

## 14. Service Implementation

### 14.1 Structure and Location

- Create services in `src/services/`
- Use the `@singleton` decorator for service classes
- Follow dependency injection pattern
- Example:

```typescript
@singleton
export class ClientUserInvitationService {
  private readonly prisma: PrismaClient;
  private readonly invitationExpiryHours = 72; // 3 days

  constructor(
    private readonly notificationProvider: INotificationProvider,
    private readonly subscriptionService: ClientSubscriptionService
  ) {
    this.prisma = new PrismaClient();
  }
}
```

### 14.2 Service Patterns

#### 14.2.1 Database Operations

- Use Prisma client for database operations
- Implement proper error handling
- Use transactions for multi-entity operations
- Example:

```typescript
async sendInvitation(
  clientId: string,
  inviterUserId: string,
  invitationData: IClientUserInvitationSend
): Promise<IClientUserInvitation> {
  try {
    // Check if client exists
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { company: true },
    });

    if (!client) {
      throw new AppError("Client not found", 404, ErrorCode.NOT_FOUND);
    }

    // Create invitation
    const invitation = await this.prisma.client_user_invitation.create({
      data: {
        clientId,
        email: invitationData.email,
        name: invitationData.name,
        role: invitationData.role,
        token,
        expiresAt,
        status: ClientUserInvitationStatusEnum.PENDING,
      },
    });

    return toIClientUserInvitation(invitation);
  } catch (error) {
    logger.error({
      message: "Failed to send client user invitation",
      context: "ClientUserInvitationService.sendInvitation",
      error: error instanceof Error ? error.message : "Unknown error",
      clientId,
      invitationData,
    });
    throw error;
  }
}
```

#### 14.2.2 Domain Model Conversion

- Implement helper methods for converting database models to domain models
- Keep conversion logic in service layer
- Example:

```typescript
private toClientProfileDomain(client: any): IClientProfile {
  return {
    id: client.id,
    companyId: client.companyId,
    basic: this.toClientProfileBasicDomain(client.company),
    address: this.toClientProfileAddressDomain(client.company),
    // ... other conversions
  };
}
```

#### 14.2.3 External Service Integration

- Use dependency injection for external services
- Implement proper error handling
- Example:

```typescript
constructor(
  private readonly notificationProvider: INotificationProvider,
  private readonly subscriptionService: ClientSubscriptionService
) {
  this.prisma = new PrismaClient();
}

async sendInvitation(...) {
  // ... other code ...

  // Send email notification
  await this.notificationProvider.sendClientUserInvitationEmail(
    invitationData.email,
    invitationData.name,
    client.company.name,
    inviter.name,
    invitationUrl,
    invitationData.role,
    this.invitationExpiryHours
  );
}
```

### 14.3 Best Practices

1. **Error Handling**

   - Use custom error classes (AppError)
   - Implement proper error logging
   - Return appropriate HTTP status codes
   - Include error codes for client handling

2. **Logging**

   - Use structured logging
   - Include context and relevant data
   - Log both success and error cases
   - Example:

   ```typescript
   logger.info({
     message: 'Operation completed successfully',
     context: 'ServiceName.methodName',
     relevantData: data,
   });
   ```

3. **Dependency Management**

   - Use constructor injection
   - Keep dependencies minimal
   - Use interfaces for external services
   - Example:

   ```typescript
   constructor(
     private readonly notificationProvider: INotificationProvider,
     private readonly subscriptionService: ClientSubscriptionService
   ) {}
   ```

4. **Data Validation**

   - Validate input data
   - Check business rules
   - Handle edge cases
   - Example:

   ```typescript
   // Check if client has available seats
   const hasSeats = await this.subscriptionService.hasAvailableSeats(clientId);
   if (!hasSeats) {
     throw new AppError(
       'No available seats in the current subscription',
       400,
       ErrorCode.SUBSCRIPTION_LIMIT_REACHED
     );
   }
   ```

5. **Transaction Management**

   - Use Prisma transactions for atomic operations
   - Handle rollback scenarios
   - Example:

   ```typescript
   await this.prisma.$transaction(async (tx) => {
     // First operation
     const user = await tx.user.create({...});

     // Second operation
     const clientUser = await tx.client_user.create({...});

     return { user, clientUser };
   });
   ```

6. **Service Composition**

   - Break down complex operations
   - Use helper methods
   - Keep methods focused
   - Example:

   ```typescript
   private async validateClientSeats(clientId: string): Promise<void> {
     const hasSeats = await this.subscriptionService.hasAvailableSeats(clientId);
     if (!hasSeats) {
       throw new AppError("No available seats", 400, ErrorCode.SUBSCRIPTION_LIMIT_REACHED);
     }
   }
   ```

7. **Configuration Management**

   - Use environment variables
   - Centralize configuration
   - Example:

   ```typescript
   private readonly invitationExpiryHours = 72; // 3 days
   const invitationUrl = `${ENV.FRONTEND_URL}/app/invitations/accept/${token}`;
   ```

8. **Testing Considerations**

   - Make services testable
   - Use dependency injection
   - Mock external services
   - Example:

   ```typescript
   // In test file
   const mockNotificationProvider = {
     sendClientUserInvitationEmail: jest.fn(),
   };
   const service = new ClientUserInvitationService(
     mockNotificationProvider,
     mockSubscriptionService
   );
   ```

9. **Documentation**

   - Document public methods
   - Include parameter descriptions
   - Document return types
   - Example:

   ```typescript
   /**
    * Send invitation to a user to join a client team
    * @param clientId - ID of the client organization
    * @param inviterUserId - ID of the user sending the invitation
    * @param invitationData - Invitation details
    * @returns Promise resolving to the created invitation
    */
   async sendInvitation(
     clientId: string,
     inviterUserId: string,
     invitationData: IClientUserInvitationSend
   ): Promise<IClientUserInvitation>
   ```

10. **Performance Considerations**
    - Optimize database queries
    - Use proper indexing
    - Implement caching where appropriate
    - Example:
    ```typescript
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { company: true }, // Eager loading
    });
    ```
