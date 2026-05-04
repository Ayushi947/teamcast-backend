# Teamcast Backend - Technical Architecture

## Overview

Teamcast is an AI-powered hiring and talent management platform that transforms how organizations discover, assess, and manage candidates through cutting-edge artificial intelligence. The backend service is built using modern TypeScript/Node.js technologies with comprehensive AI/ML integration.

## High-Level System Architecture

The system follows a microservices-oriented architecture with clear separation of concerns, leveraging cloud-native technologies and AI services for scalable talent management.

### Key Components

- **Backend API Service**: Express.js/TypeScript REST API
- **Database Layer**: PostgreSQL with Prisma ORM
- **AI/ML Services**: Google Cloud Vertex AI integration
- **Queue System**: BullMQ with Redis for background processing
- **Authentication**: JWT with OAuth integration
- **File Storage**: Google Cloud Storage
- **Monitoring**: Prometheus with custom metrics
- **Real-time Communication**: WebSocket service
- **Integration Layer**: ATS and Job Board connectors

## Technology Stack

### Core Technologies

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis 6.x
- **Queue System**: BullMQ
- **Container**: Docker with Kubernetes

### AI/ML Services

- **Google Cloud Vertex AI**: Main AI platform
- **Models Used**: Gemini Pro, Text Embedding 005
- **Capabilities**:
  - Resume parsing and assessment
  - Job posting analysis
  - Candidate-job matching
  - Video interview analysis
  - Conversational assessments

### External Integrations

- **Authentication**: Google OAuth, GitHub OAuth
- **Notifications**: Brevo, SMTP/Nodemailer
- **Payments**: Stripe
- **File Storage**: Google Cloud Storage
- **Speech Services**: Google Speech-to-Text/Text-to-Speech
- **Monitoring**: Prometheus, Grafana

## Architecture Patterns

### 1. Three-Layer Architecture

The system implements a clean three-layer architecture:

```text
┌─────────────────┐
│   API Layer     │  ← Request/Response DTOs, Validation, Routing
├─────────────────┤
│  Domain Layer   │  ← Business Logic, Core Entities, Services
├─────────────────┤
│   Data Layer    │  ← Database Models, External API Integrations
└─────────────────┘
```

**API Layer** (`src/shared/models/api/`):

- Request/response interfaces
- API validation schemas
- HTTP-specific logic

**Domain Layer** (`src/shared/models/domain/`):

- Core business entities
- Business rules and logic
- Service interfaces

**Data Layer** (`src/shared/models/data/`):

- Database schema mappings
- External service DTOs
- Data transformation logic

### 2. Singleton Pattern

Core services implement the singleton pattern for resource management:

```typescript
@singleton
export class ServiceName {
  constructor() {
    // Single instance initialization
  }
}
```

**Key Singleton Services**:

- Database connections (Prisma)
- AI service providers
- Cache managers
- Queue services
- WebSocket handlers

### 3. Factory Pattern

Provider selection using factory pattern for pluggable services:

```typescript
export class ProviderFactory {
  getProvider(): IProvider {
    switch (ENV.PROVIDER_TYPE) {
      case 'gcp-vertex':
        return new GcpVertexProvider();
      case 'local':
        return new LocalProvider();
    }
  }
}
```

## System Components

### Core Application Components

#### 1. Express Application (`src/app.ts`)

- Middleware configuration
- Route registration
- Security headers
- Performance optimizations
- Error handling

#### 2. Controllers (`src/controllers/`)

- Request validation
- Business logic delegation
- Response formatting
- Error handling

#### 3. Services (`src/services/`)

- Business logic implementation
- External service integration
- Data transformation
- Transaction management

#### 4. Routes (`src/routes/`)

- API endpoint definitions
- Middleware application
- Request routing
- OpenAPI documentation

### AI/ML Integration Layer

#### 1. AI Service Providers

**Resume Processing**:

- **Parser Provider**: Extracts structured data from resume documents
- **Assessment Provider**: Evaluates candidate qualifications and fit

**Job Processing**:

- **Parser Provider**: Analyzes job descriptions for requirements
- **Assessment Provider**: Evaluates job posting quality and completeness

**Assessment Services**:

- **Onboarding Assessment**: AI-driven candidate onboarding interviews
- **Job AI Assessment**: Role-specific technical and behavioral assessments
- **Video Analysis**: Automated video interview evaluation

**Recommendation Engine**:

- **Job Recommendations**: AI-powered job matching for candidates
- **Candidate Recommendations**: Intelligent candidate sourcing for jobs
- **RAG Provider**: Retrieval Augmented Generation for contextual insights

#### 2. Provider Architecture

```typescript
interface IAssessmentProvider {
  initializeAssessment(data: InitRequest): Promise<TaskResponse>;
  getNextQuestion(taskId: string): Promise<QuestionResponse>;
  submitAnswer(taskId: string, answer: Answer): Promise<SubmissionResponse>;
  doAssessment(taskId: string): Promise<AssessmentResult>;
}
```

### Data Architecture

#### 1. Database Schema Structure

**Core Entities**:

- **Users**: Multi-role user system (Candidates, Clients, Partners, Support)
- **Companies**: Organizational profiles with verification status
- **Jobs**: Job postings with assessment configurations
- **Applications**: Candidate applications with status tracking
- **Assessments**: AI-powered evaluation system

**Assessment System**:

- **AI Assessments**: Job-specific candidate evaluations
- **Onboarding Assessments**: Candidate skill and culture fit evaluation
- **Resume Assessments**: Automated resume analysis and scoring
- **Video Analysis**: Automated video interview assessment

**Integration Framework**:

- **Integration Providers**: ATS and Job Board connector registry
- **Client Integrations**: Company-specific integration configurations
- **Sync Tasks**: Background synchronization job management

#### 2. Relationship Patterns

**User Hierarchy**:

```text
user (base) → candidate / client_user / partner_user / support_user
company → client / partner
job_posting → applications → assessments
```

**Assessment Flow**:

```text
candidate → resume_assessment → onboarding_assessment → job_ai_assessment
job_posting → job_posting_assessment → candidate_matching
```

### Queue and Background Processing

#### 1. BullMQ Implementation

**Queue Types**:

- **Assessment Queues**: AI processing for various assessment types
- **Parsing Queues**: Document and job description processing
- **Recommendation Queues**: Candidate and job matching
- **Notification Queues**: Email and communication processing

**Queue Configuration**:

```typescript
export const QUEUE_NAMES = {
  ONBOARDING_ASSESSMENT_INITIALIZE: 'onboarding-assessment-initialize',
  JOB_AI_ASSESSMENT_SUBMIT: 'job-ai-assessment-submit',
  RESUME_PARSING: 'resume-parsing',
  JOB_RECOMMENDATION_PROCESSING: 'job-recommendation-processing',
  // ... more queues
} as const;
```

#### 2. Worker Management

- **Concurrent Processing**: Configurable worker concurrency
- **Retry Logic**: Exponential backoff for failed jobs
- **Error Handling**: Dead letter queues for failed processing
- **Monitoring**: Job status tracking and metrics

### Caching Strategy

#### 1. Redis Implementation

**Cache Patterns**:

- **Task Caching**: AI assessment task state management
- **User Status**: Active user status caching
- **Session Management**: WebSocket connection state
- **API Response Caching**: Frequently accessed data

**Cache Configuration**:

```typescript
private redis = new Redis({
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
  keyPrefix: `${ENV.ENV_NAME}:service_name:`,
  retryStrategy: (times: number) => Math.min(times * 100, 3000)
});
```

#### 2. Fallback Strategy

- **Primary**: Redis distributed cache
- **Fallback**: In-memory Map storage
- **Graceful Degradation**: Automatic fallback on Redis failure

### Security Architecture

#### 1. Authentication & Authorization

**JWT Implementation**:

- **Access Tokens**: Short-lived authentication tokens
- **Refresh Tokens**: Long-lived token renewal
- **Role-Based Access**: User type and role validation

**OAuth Integration**:

- **Google OAuth**: Social authentication
- **GitHub OAuth**: Developer authentication

#### 2. Security Middleware

- **Helmet**: Security headers configuration
- **CORS**: Cross-origin request handling
- **Rate Limiting**: API endpoint protection
- **Request Validation**: Input sanitization and validation

### Integration Architecture

#### 1. ATS Integration Framework

**Supported Systems**:

- **Workday**: Enterprise HCM integration
- **BambooHR**: SMB HRIS integration
- **Workable**: Modern ATS integration

**Integration Patterns**:

- **OAuth Authentication**: Secure API access
- **Webhook Support**: Real-time data synchronization
- **Batch Processing**: Bulk data operations
- **Error Recovery**: Retry and fallback mechanisms

#### 2. Job Board Integration

**Supported Platforms**:

- **Indeed**: Job posting and candidate sourcing
- **Local Job Boards**: Custom integration framework

**Synchronization Features**:

- **Job Publishing**: Automated job posting distribution
- **Candidate Import**: Resume and application data import
- **Status Synchronization**: Application status updates
- **Analytics Integration**: Performance tracking

## Deployment Architecture

### Container Strategy

#### 1. Docker Configuration

**Multi-stage Build**:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
# ... build process

# Runtime stage
FROM node:18-alpine AS runtime
# ... runtime configuration
```

**Optimization Features**:

- **Layer Caching**: Efficient build times
- **Security**: Non-root user execution
- **Health Checks**: Container health monitoring
- **Resource Limits**: Memory and CPU constraints

#### 2. Kubernetes Deployment

**Production Configuration**:

- **Replicas**: Horizontal pod autoscaling
- **Resource Management**: CPU and memory limits
- **Service Discovery**: Internal service communication
- **ConfigMaps**: Environment-specific configuration
- **Secrets Management**: Secure credential handling

### Process Management

#### 1. PM2 Configuration

**Cluster Mode**:

- **Multi-instance**: CPU core utilization
- **Load Balancing**: Request distribution
- **Zero Downtime**: Rolling deployments
- **Memory Management**: Automatic restart on memory limits

#### 2. Monitoring Integration

**Health Checks**:

- **Application Health**: Service availability monitoring
- **Database Connectivity**: Connection pool monitoring
- **External Service Health**: Integration status tracking

## API Design

### RESTful Architecture

#### 1. Resource Organization

**API Structure**:

```text
/api/auth          - Authentication endpoints
/api/client        - Client management
/api/candidate     - Candidate operations
/api/partner       - Partner services
/api/support       - Support functions
/api/common        - Shared resources
```

#### 2. OpenAPI Documentation

**Swagger Integration**:

- **Automatic Generation**: Route-based documentation
- **Interactive Testing**: Built-in API explorer
- **Schema Validation**: Request/response validation
- **Version Management**: API versioning support

### WebSocket Implementation

#### 1. Real-time Features

**Use Cases**:

- **Assessment Progress**: Live assessment updates
- **Application Status**: Real-time status changes
- **Notification Delivery**: Instant notifications
- **System Health**: Live monitoring data

#### 2. Connection Management

**Scalability Features**:

- **Connection Pooling**: Efficient resource usage
- **Message Broadcasting**: Multi-client updates
- **Authentication**: Secure WebSocket connections
- **Failover**: Connection recovery mechanisms

## Performance Optimizations

### Database Optimization

#### 1. Prisma Configuration

**Performance Features**:

- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Generated efficient SQL
- **Transaction Management**: ACID compliance
- **Migration System**: Schema version control

#### 2. Index Strategy

**Optimized Queries**:

- **Composite Indexes**: Multi-column query optimization
- **Partial Indexes**: Conditional index creation
- **Foreign Key Indexes**: Relationship query optimization

### Caching Strategy

#### 1. Multi-level Caching

**Cache Hierarchy**:

- **Application Cache**: In-memory data caching
- **Redis Cache**: Distributed session storage
- **CDN Cache**: Static asset delivery
- **Database Cache**: Query result caching

#### 2. Cache Invalidation

**Strategies**:

- **TTL-based**: Time-based expiration
- **Event-driven**: Data change invalidation
- **Manual**: Explicit cache clearing
- **Versioned**: Cache key versioning

### Resource Management

#### 1. Memory Optimization

**Strategies**:

- **Garbage Collection**: Manual GC triggering
- **Memory Monitoring**: Usage tracking and alerts
- **Resource Cleanup**: Automatic resource disposal
- **Leak Detection**: Memory leak identification

#### 2. CPU Optimization

**Techniques**:

- **Async Processing**: Non-blocking operations
- **Worker Threads**: CPU-intensive task delegation
- **Load Balancing**: Request distribution
- **Compression**: Response size optimization

## Monitoring and Observability

### Metrics Collection

#### 1. Prometheus Integration

**Metric Types**:

- **Request Metrics**: API endpoint performance
- **Business Metrics**: Assessment completion rates
- **System Metrics**: Resource utilization
- **Error Metrics**: Failure rate tracking

#### 2. Custom Metrics

**Application-specific**:

- **Assessment Duration**: AI processing times
- **Queue Length**: Background job monitoring
- **Integration Health**: External service status
- **User Activity**: Platform engagement metrics

### Logging Strategy

#### 1. Structured Logging

**Log Format**:

```typescript
logger.info('Operation completed', {
  context: 'ServiceName.methodName',
  userId: 'user-id',
  duration: 150,
  success: true,
});
```

#### 2. Log Levels

**Hierarchy**:

- **ERROR**: System failures and exceptions
- **WARN**: Non-critical issues and degradation
- **INFO**: Normal operation events
- **DEBUG**: Detailed diagnostic information

### Error Monitoring

#### 1. Error Tracking

**Features**:

- **Exception Capture**: Automatic error collection
- **Stack Trace**: Detailed error context
- **Error Grouping**: Similar error aggregation
- **Performance Impact**: Error effect analysis

#### 2. Alerting System

**Alert Types**:

- **Critical Errors**: Immediate attention required
- **Performance Degradation**: Response time issues
- **Resource Exhaustion**: System capacity alerts
- **Integration Failures**: External service issues

## Security Considerations

### Data Protection

#### 1. Encryption

**At Rest**:

- **Database Encryption**: PostgreSQL encryption
- **File Storage**: GCS server-side encryption
- **Configuration**: Environment variable encryption

**In Transit**:

- **HTTPS/TLS**: API communication security
- **Database SSL**: Secure database connections
- **Internal Communication**: Service-to-service encryption

#### 2. Access Control

**Authentication**:

- **Multi-factor**: MFA support through OAuth
- **Session Management**: Secure token handling
- **Password Policy**: Strong password requirements

**Authorization**:

- **Role-based**: User type and role validation
- **Resource-based**: Entity ownership validation
- **API-level**: Endpoint access control

### Compliance

#### 1. Data Privacy

**GDPR Compliance**:

- **Data Minimization**: Only necessary data collection
- **Right to Deletion**: User data removal capabilities
- **Data Portability**: User data export functionality
- **Consent Management**: Explicit user consent tracking

#### 2. Security Standards

**Implementation**:

- **Input Validation**: XSS and injection prevention
- **Output Encoding**: Safe data rendering
- **CSRF Protection**: Cross-site request forgery prevention
- **Security Headers**: Comprehensive header configuration

## Scalability Architecture

### Horizontal Scaling

#### 1. Stateless Design

**Principles**:

- **Session Externalization**: Redis-based session storage
- **Database Connection Pooling**: Shared connection management
- **File Storage**: External storage systems
- **Cache Distribution**: Shared cache infrastructure

#### 2. Load Distribution

**Strategies**:

- **API Load Balancing**: Request distribution across instances
- **Database Read Replicas**: Read operation scaling
- **Queue Distribution**: Background job spreading
- **CDN Integration**: Static asset distribution

### Vertical Scaling

#### 1. Resource Optimization

**Techniques**:

- **Memory Efficiency**: Optimal memory usage patterns
- **CPU Utilization**: Efficient algorithm implementation
- **I/O Optimization**: Reduced disk and network operations
- **Database Tuning**: Query and index optimization

#### 2. Capacity Planning

**Monitoring**:

- **Resource Usage Trends**: Historical analysis
- **Peak Load Handling**: Traffic spike preparation
- **Growth Projections**: Scaling timeline planning
- **Bottleneck Identification**: Performance constraint analysis

## Future Architecture Considerations

### Microservices Evolution

#### 1. Service Decomposition

**Potential Services**:

- **Assessment Service**: Dedicated AI assessment processing
- **Integration Service**: External system connectivity
- **Notification Service**: Communication management
- **Analytics Service**: Data analysis and reporting

#### 2. Service Communication

**Patterns**:

- **Event-driven**: Asynchronous service communication
- **API Gateway**: Centralized request routing
- **Service Mesh**: Advanced traffic management
- **Circuit Breakers**: Failure isolation mechanisms

### Technology Evolution

#### 1. AI/ML Advancement

**Opportunities**:

- **Model Specialization**: Domain-specific AI models
- **Real-time Processing**: Streaming AI capabilities
- **Edge Computing**: Distributed AI processing
- **AutoML Integration**: Automated model optimization

#### 2. Infrastructure Modernization

**Directions**:

- **Serverless Computing**: Function-as-a-Service adoption
- **Event Streaming**: Apache Kafka integration
- **GraphQL**: Flexible API query capabilities
- **Container Orchestration**: Advanced Kubernetes features

---

This technical architecture provides a comprehensive foundation for the Teamcast backend service, enabling scalable, secure, and efficient AI-powered talent management capabilities. The architecture supports current requirements while maintaining flexibility for future enhancements and technological evolution.
