# Teamcast Backend Project Structure

## Overview

Teamcast is an AI-powered platform for hiring and team management. This document outlines the structure of the backend codebase, which is built using Express.js, TypeScript, and Prisma ORM.

## Directory Structure

```text
teamcast-backend/
├── src/                   # Source code directory
│   ├── controllers/       # Request handlers and business logic
│   ├── services/          # Business services and data processing
│   ├── routes/            # API route definitions
│   ├── config/            # Configuration files
│   ├── middleware/        # Express middleware
│   ├── utils/             # Utility functions
│   ├── shared/            # Shared code and constants
│   ├── types/             # TypeScript type definitions
│   ├── decorators/        # Custom TypeScript decorators
│   ├── health/            # Health check endpoints
│   ├── @types/            # Custom type declarations
│   ├── components/        # Reusable components
│   └── __tests__/         # Test files
├── prisma/                # Database schema and migrations
├── docs/                  # Documentation
├── scripts/               # Utility scripts
├── uploads/               # File uploads directory
├── dist/                  # Compiled JavaScript output
└── tests/                 # Test files
```

## Key Components

### 1. Source Code (`src/`)

#### Controllers (`src/controllers/`)

- Handle HTTP requests
- Implement business logic
- Interact with services
- Return responses to clients

#### Services (`src/services/`)

- Core business logic
- Data processing
- External service integrations
- Complex operations

#### Routes (`src/routes/`)

- API endpoint definitions
- Route middleware
- Request validation
- Route grouping

#### Middleware (`src/middleware/`)

- Authentication
- Authorization
- Request validation
- Error handling
- Logging

#### Utils (`src/utils/`)

- Helper functions
- Common utilities
- Data transformation
- Date formatting

### 2. Database (`prisma/`)

#### Schema (`prisma/schema.prisma`)

- Database models
- Relationships
- Enums
- Indexes

#### Migrations (`prisma/migrations/`)

- Database schema changes
- Version control
- Rollback support

### 3. Configuration

#### Environment Files

- `.env` - Production environment variables
- `.env.dev` - Development environment variables
- `.env.test` - Testing environment variables

#### TypeScript Configuration

- `tsconfig.json` - TypeScript compiler options
- `tsconfig.scripts.json` - Script-specific TypeScript config

### 4. Testing

#### Test Directories

- `src/__tests__/` - Unit tests
- `tests/` - Integration and E2E tests

#### Test Configuration

- `jest.config.ts` - Jest configuration
- `jest.e2e.config.ts` - E2E test configuration

### 5. Documentation

#### Documentation Files

- `docs/` - Project documentation
- `README.md` - Project overview
- `CONTRIBUTING.md` - Contribution guidelines

## Data Models

The application uses several key data models:

1. **User Management**

   - Users (with different types: Support, Candidate, Client, Partner)
   - User roles and permissions
   - User settings and preferences

2. **Company Management**

   - Company profiles
   - Company settings
   - Social media links
   - Company culture

3. **Job Management**

   - Job postings
   - Job requirements
   - Work types and commitments
   - Job applications

4. **Candidate Management**

   - Candidate profiles
   - Resumes
   - Education and experience
   - Certifications

5. **Assessment System**

   - AI assessments
   - Onboarding assessments
   - Practice assessments
   - Assessment results

6. **Subscription Management**
   - Client subscriptions
   - Candidate subscriptions
   - Credit management
   - Payment processing

## Development Tools

- **TypeScript** - Type-safe JavaScript
- **Prisma** - Database ORM
- **Express.js** - Web framework
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Docker** - Containerization

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `npx prisma migrate dev`
5. Start development server: `npm run dev`

## Contributing

Please refer to `CONTRIBUTING.md` for guidelines on:

- Code style
- Git workflow
- Pull requests
- Testing requirements
