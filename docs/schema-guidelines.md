# Teamcast Database Schema Guidelines

## Table of Contents

1. [Core User Management](#1-core-user-management)
2. [Company and Organization Structure](#2-company-and-organization-structure)
3. [Job and Candidate Management](#3-job-and-candidate-management)
4. [Assessment System](#4-assessment-system)
5. [Subscription and Billing](#5-subscription-and-billing)
6. [Recommendation System](#6-recommendation-system)
7. [Settings and Configuration](#7-settings-and-configuration)
8. [Best Practices](#8-best-practices)
9. [Common Operations](#9-common-operations)
10. [Important Considerations](#10-important-considerations)
11. [Entity Relationship Diagram](#11-entity-relationship-diagram)

## 1. Core User Management

### User Types and Roles

- The system supports 4 user types (`user_type`):

  - SUPPORT
  - CANDIDATE
  - CLIENT
  - PARTNER

- Each user can have one of 7 roles (`user_role`):
  - ADMIN
  - HR
  - RECRUITER
  - ACCOUNTS
  - PARTNER_RESOURCE
  - INDIVIDUAL

### User Model Structure

- Base `user` model contains:
  - Authentication fields (email, password, tokens)
  - Profile fields (name, jobTitle, image)
  - Status tracking (emailVerified, status)
  - Timestamps (createdAt, updatedAt)
  - Relations to specific user types (candidate, clientUser, partnerUser, supportUser)

## 2. Company and Organization Structure

### Company Types and Categories

- Company types (`company_type`):

  - STARTUP
  - SCALE_UP
  - ENTERPRISE
  - AGENCY
  - CONSULTING

- Industries (`company_industry`):
  - TECHNOLOGY
  - HEALTHCARE
  - FINANCE
  - EDUCATION
  - RETAIL
  - OTHER

### Company Model Structure

- Core company information
- Multiple address types (main, shipping, billing)
- Social media presence
- Company culture and benefits
- Relations to client and partner entities

## 3. Job and Candidate Management

### Job Posting Structure

- Status tracking (`job_posting_status`)
- Work type and commitment enums
- Salary and benefits information
- Application tracking
- AI assessment settings

### Candidate Management

- Status tracking (`candidate_status`)
- Profile information
- Resume and experience tracking
- Application history
- Assessment results

## 4. Assessment System

### Assessment Types

1. AI Assessments

   - Technical assessments
   - Behavioral assessments
   - Cultural fit assessments
   - Video analysis
   - Proctoring

2. Onboarding Assessments
   - Profile completion
   - Skills assessment
   - Professional history
   - Education verification

### Assessment Structure

- Progress tracking
- Scoring system
- Feedback mechanisms
- Video analysis
- Proctoring features

## 5. Subscription and Billing

### Client Subscriptions

- Package management
- Credit system
- Usage tracking
- Payment provider integration

### Candidate Subscriptions

- Practice assessment credits
- Feature access levels
- Usage tracking

## 6. Recommendation System

### Recommendation Types

- Candidate to Job recommendations
- Job to Candidate recommendations
- Feedback tracking
- Match scoring

## 7. Settings and Configuration

### Global Settings

- Notification preferences
- UI preferences
- Communication channels
- Regional settings
- System limits

### User-Specific Settings

- Notification preferences
- UI preferences
- Communication preferences
- Privacy settings

## 8. Best Practices

### Data Relationships

1. Always use proper cascading deletes
2. Maintain referential integrity
3. Use appropriate indexes
4. Follow naming conventions

### Enum Usage

- Use enums for standardized fields
- Maintain consistency in enum values
- Document enum purposes

### Timestamps

- Always include createdAt and updatedAt
- Use appropriate default values
- Maintain consistency in timestamp usage

### Security

- Never store plain text passwords
- Use appropriate token management
- Implement proper access controls

### Performance

- Use appropriate indexes
- Optimize query patterns
- Consider data volume

## 9. Common Operations

### User Management

```prisma
// Create user
const user = await prisma.user.create({
  data: {
    name: "John Doe",
    email: "john@example.com",
    type: user_type.CANDIDATE,
  }
});

// Update user status
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: { status: user_status.ACTIVE }
});
```

### Company Management

```prisma
// Create company
const company = await prisma.company.create({
  data: {
    name: "Example Corp",
    companyType: company_type.STARTUP,
    industry: company_industry.TECHNOLOGY
  }
});

// Update company details
const updatedCompany = await prisma.company.update({
  where: { id: companyId },
  data: { stage: company_stage.GROWTH }
});
```

### Job Posting Management

```prisma
// Create job posting
const job = await prisma.job_posting.create({
  data: {
    title: "Senior Developer",
    description: "Job description",
    jobType: work_type.EMPLOYEE,
    jobCommitment: work_commitment.FULL_TIME
  }
});

// Update job status
const updatedJob = await prisma.job_posting.update({
  where: { id: jobId },
  data: { status: job_posting_status.PUBLISHED }
});
```

## 10. Important Considerations

1. **Data Integrity**

   - Always validate data before operations
   - Use transactions for complex operations
   - Maintain referential integrity

2. **Performance**

   - Use appropriate indexes
   - Optimize query patterns
   - Consider data volume

3. **Security**

   - Implement proper access controls
   - Use secure password handling
   - Protect sensitive data

4. **Scalability**
   - Consider data growth
   - Use appropriate data types
   - Optimize for performance

## 11. Entity Relationship Diagram

### Key Relationships

1. **User Relationships**

   - User → Candidate (One-to-One)
   - User → ClientUser (One-to-One)
   - User → PartnerUser (One-to-One)
   - User → SupportUser (One-to-One)

2. **Company Relationships**

   - Company → Client (One-to-One)
   - Company → Partner (One-to-One)
   - Company → CompanySocial (One-to-One)
   - Company → CompanyCulture (One-to-One)

3. **Job Relationships**

   - JobPosting → Client (Many-to-One)
   - JobPosting → Applications (One-to-Many)
   - JobPosting → AIAssessmentSettings (One-to-One)

4. **Candidate Relationships**

   - Candidate → User (One-to-One)
   - Candidate → Applications (One-to-Many)
   - Candidate → Assessments (One-to-Many)
   - Candidate → Resume (One-to-One)

5. **Assessment Relationships**

   - Assessment → Candidate (Many-to-One)
   - Assessment → Questions (One-to-Many)
   - Assessment → VideoAnalysis (One-to-One)
   - Assessment → Proctoring (One-to-One)

6. **Subscription Relationships**

   - ClientSubscription → Client (One-to-One)
   - ClientSubscription → Package (Many-to-One)
   - ClientSubscription → CreditPurchases (One-to-Many)

7. **Recommendation Relationships**
   - CandidateRecommendation → Candidate (Many-to-One)
   - CandidateRecommendation → JobPosting (Many-to-One)
   - JobRecommendation → JobPosting (Many-to-One)
   - JobRecommendation → Candidate (Many-to-One)

### Cardinality Rules

1. **One-to-One Relationships**

   - User ↔ Candidate
   - User ↔ ClientUser
   - User ↔ PartnerUser
   - User ↔ SupportUser
   - Company ↔ Client
   - Company ↔ Partner
   - Candidate ↔ Resume

2. **One-to-Many Relationships**

   - Company → JobPostings
   - Client → Applications
   - Candidate → Applications
   - Assessment → Questions
   - Subscription → CreditPurchases

3. **Many-to-Many Relationships**
   - Candidates ↔ JobPostings (through Applications)
   - Candidates ↔ Jobs (through Recommendations)
   - Jobs ↔ Candidates (through Recommendations)

### Important Constraints

1. **Unique Constraints**

   - User email must be unique
   - Company name must be unique
   - Job posting title within a client must be unique
   - Candidate email must be unique

2. **Required Fields**

   - User: name, email, type, role
   - Company: name, description, companyType, industry
   - JobPosting: title, description, jobType, status
   - Candidate: userId, status

3. **Cascade Rules**
   - User deletion cascades to related entities
   - Company deletion cascades to related entities
   - JobPosting deletion cascades to applications
   - Candidate deletion cascades to applications and assessments

This ER diagram and relationship documentation provides a clear overview of the database structure and its interconnections. Use this as a reference when designing queries and managing data relationships in the system.
