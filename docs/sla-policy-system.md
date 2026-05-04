# SLA Policy System Documentation

## Overview

The SLA (Service Level Agreement) Policy System provides automated assignment and management of service level agreements for support tickets. It ensures that tickets are automatically assigned appropriate SLA policies based on their entity type, category, and priority.

## Features

- **Automatic SLA Assignment**: Tickets are automatically assigned SLA policies when created
- **Flexible Policy Matching**: Policies can be matched based on entity type, category, and priority
- **Business Rules Support**: Support for business hours, working days, and holiday exclusions
- **Default Policy Management**: Ability to set default policies for specific combinations
- **Comprehensive API**: Full CRUD operations for SLA policy management
- **Statistics and Reporting**: Detailed statistics on policy usage and performance

## Architecture

### Core Components

1. **SLA Policy Service** (`SlaPolicyService`)

   - Manages SLA policy CRUD operations
   - Handles policy matching logic
   - Calculates SLA breach times
   - Provides statistics and reporting

2. **Support Ticket Service** (`SupportTicketService`)

   - Automatically assigns SLA policies when creating tickets
   - Integrates with SLA policy service for assignment logic

3. **API Layer**
   - RESTful endpoints for SLA policy management
   - Comprehensive validation and error handling
   - Swagger documentation

### Database Schema

The SLA policy system uses the `support_sla_policy` table with the following key fields:

- `entityType`: Type of entity (CANDIDATE, CLIENT, PARTNER, SUPPORT)
- `category`: Ticket category (TECHNICAL, BILLING, ACCOUNT, etc.)
- `priority`: Ticket priority (LOW, MEDIUM, HIGH, URGENT, CRITICAL)
- `responseTime`: Time to first response in minutes
- `resolutionTime`: Time to resolution in minutes
- `escalationTime`: Time before escalation in minutes
- `businessHoursOnly`: Whether SLA only applies during business hours
- `workingDaysOnly`: Whether SLA excludes weekends
- `excludeHolidays`: Whether SLA excludes public holidays
- `isDefault`: Whether this is the default policy for the combination

## API Endpoints

### SLA Policy Management

#### Create SLA Policy

```http
POST /api/support/sla-policies
Content-Type: application/json

{
  "data": {
    "name": "Client High Priority Technical Issues",
    "description": "SLA policy for high priority technical issues from clients",
    "entityType": "CLIENT",
    "category": "TECHNICAL",
    "priority": "HIGH",
    "responseTime": 60,
    "resolutionTime": 480,
    "escalationTime": 240,
    "businessHoursOnly": true,
    "workingDaysOnly": true,
    "excludeHolidays": true,
    "isActive": true,
    "isDefault": false
  }
}
```

#### List SLA Policies

```http
GET /api/support/sla-policies?page=1&limit=20&filters[isActive]=true&sort[field]=name&sort[direction]=asc
```

#### Get SLA Policy by ID

```http
GET /api/support/sla-policies/{id}
```

#### Update SLA Policy

```http
PUT /api/support/sla-policies/{id}
Content-Type: application/json

{
  "data": {
    "name": "Updated Policy Name",
    "responseTime": 90
  }
}
```

#### Delete SLA Policy

```http
DELETE /api/support/sla-policies/{id}
```

#### Find Matching Policy

```http
POST /api/support/sla-policies/match
Content-Type: application/json

{
  "data": {
    "entityType": "CLIENT",
    "category": "TECHNICAL",
    "priority": "HIGH"
  }
}
```

#### Get Statistics

```http
GET /api/support/sla-policies/statistics
```

## Policy Matching Logic

The system uses a hierarchical matching approach:

1. **Exact Match**: Find policy with exact entity type, category, and priority
2. **Default Policy**: If no exact match, find default policy for the entity type
3. **Fallback Policy**: If no default, find any active policy for the entity type

### Matching Priority

1. Policies with `isDefault: true` are preferred
2. Older policies (by `createdAt`) are preferred when multiple matches exist
3. Only active policies (`isActive: true`) are considered

## Automatic Assignment

When a support ticket is created:

1. The system extracts the ticket's entity type, category, and priority
2. It searches for a matching SLA policy using the matching logic
3. If a policy is found, it's automatically assigned to the ticket
4. SLA breach time is calculated based on the policy settings
5. The ticket is updated with SLA information

### SLA Calculation

The SLA breach time is calculated based on:

- **Resolution Time**: The primary SLA metric
- **Business Hours**: If enabled, only counts business hours
- **Working Days**: If enabled, excludes weekends
- **Holidays**: If enabled, excludes public holidays

## Usage Examples

### Creating a Policy for Client Technical Issues

```typescript
const policy = await slaPolicyService.createPolicy({
  name: 'Client Technical Issues',
  description: 'Standard SLA for client technical support',
  entityType: SupportTicketEntityTypeEnum.CLIENT,
  category: SupportTicketCategoryEnum.TECHNICAL,
  priority: SupportTicketPriorityEnum.MEDIUM,
  responseTime: 120, // 2 hours
  resolutionTime: 1440, // 24 hours
  businessHoursOnly: true,
  workingDaysOnly: true,
  excludeHolidays: true,
  isActive: true,
  isDefault: true,
});
```

### Creating a Ticket with Auto SLA Assignment

```typescript
const ticket = await supportTicketService.createTicket(
  {
    title: 'Login issue',
    description: 'Unable to login to the system',
    ticketType: 'TECHNICAL_ISSUE',
    category: SupportTicketCategoryEnum.TECHNICAL,
    priority: SupportTicketPriorityEnum.HIGH,
    entityType: SupportTicketEntityTypeEnum.CLIENT,
    targetId: 'user-123',
  },
  'creator-user-id'
);

// SLA policy is automatically assigned
console.log('SLA Policy ID:', ticket.slaPolicyId);
console.log('SLA Breach At:', ticket.slaBreachAt);
```

### Finding Matching Policy

```typescript
const matchingPolicy = await slaPolicyService.findMatchingPolicy({
  entityType: SupportTicketEntityTypeEnum.CLIENT,
  category: SupportTicketCategoryEnum.TECHNICAL,
  priority: SupportTicketPriorityEnum.HIGH,
});

if (matchingPolicy) {
  console.log('Found policy:', matchingPolicy.name);
  console.log('Response time:', matchingPolicy.responseTime, 'minutes');
  console.log('Resolution time:', matchingPolicy.resolutionTime, 'minutes');
}
```

## Configuration

### Environment Variables

No specific environment variables are required for the SLA policy system. It uses the existing database connection and authentication system.

### Database Setup

The SLA policy system requires the `support_sla_policy` table to be created. This is handled by the Prisma schema migration.

## Testing

A test script is provided to demonstrate the SLA policy functionality:

```bash
npx ts-node scripts/test-sla-policy.ts
```

This script:

1. Creates sample SLA policies
2. Tests policy matching logic
3. Creates a support ticket with auto SLA assignment
4. Displays statistics and policy information

## Best Practices

### Policy Design

1. **Start with Default Policies**: Create default policies for each entity type
2. **Use Specific Policies**: Create specific policies for high-priority or critical issues
3. **Consider Business Hours**: Use business hours settings for customer-facing policies
4. **Set Realistic Timeframes**: Ensure SLA timeframes are achievable

### Policy Management

1. **Regular Review**: Periodically review and update policies based on performance
2. **Monitor Breaches**: Track SLA breach rates and adjust policies accordingly
3. **Document Changes**: Keep clear documentation of policy changes and reasons
4. **Test Changes**: Test policy changes in a staging environment first

### Performance Considerations

1. **Index Usage**: The system uses database indexes for efficient policy matching
2. **Caching**: Consider implementing caching for frequently accessed policies
3. **Batch Operations**: Use batch operations when creating multiple policies

## Troubleshooting

### Common Issues

1. **No Policy Assigned**: Check if active policies exist for the entity type
2. **Wrong Policy Assigned**: Verify policy matching criteria and default settings
3. **SLA Calculation Errors**: Check business hours and holiday configurations

### Debugging

Enable debug logging to trace policy matching:

```typescript
// The service logs policy matching decisions
logger.info('SLA policy auto-assigned to ticket', {
  ticketId: ticket.id,
  policyId: slaAssignment.policyId,
  slaBreachAt: slaAssignment.slaBreachAt,
});
```

## Future Enhancements

1. **Advanced Business Rules**: Support for more complex business hour calculations
2. **Policy Templates**: Pre-defined policy templates for common scenarios
3. **SLA Monitoring**: Real-time SLA breach monitoring and alerts
4. **Performance Analytics**: Detailed analytics on SLA performance and trends
5. **Integration**: Integration with external SLA monitoring tools
