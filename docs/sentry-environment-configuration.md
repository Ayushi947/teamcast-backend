# Sentry Environment-Specific Configuration

## Overview

This guide shows how to configure Sentry differently for each environment (Development, QA, Production) to optimize error tracking and performance.

**Important Note**: Sentry is only enabled for specific environments: `development`, `production`, and `qa`. Other environments like `local` will automatically disable Sentry to prevent unnecessary overhead and data collection.

## Environment Variables

## Environment Restrictions

Sentry is automatically disabled for environments not in the allowed list:

```typescript
const allowedEnvironments = ['development', 'production', 'qa'];

// These environments will disable Sentry:
// - local
// - test
// - staging (unless you add it to the list)
// - any other custom environment names
```

### Development Environment (.env.development)

```bash
# Sentry Configuration for Development
SENTRY_DSN=https://635afb487b2a47e4ea9f4cbfa61a68c9@sentry.teamcast.ai/2
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=1.0
SENTRY_ENABLE=true

# Environment (uses NODE_ENV automatically)
NODE_ENV=development
APP_NAME=Teamcast Backend (Dev)
```

**Features:**

- **100% Error Capture**: All errors are sent to Sentry
- **Debug Mode**: Enabled for detailed logging
- **Full Context**: Complete request and system information
- **High Sampling**: All transactions and profiles captured
- **Development Filtering**: Minimal error filtering

### QA Environment (.env.qa)

```bash
# Sentry Configuration for QA
SENTRY_DSN=https://635afb487b2a47e4ea9f4cbfa61a68c9@sentry.teamcast.ai/2
SENTRY_TRACES_SAMPLE_RATE=0.5
SENTRY_PROFILES_SAMPLE_RATE=0.5
SENTRY_ENABLE=true

# Environment (uses NODE_ENV automatically)
NODE_ENV=qa
APP_NAME=Teamcast Backend (QA)
```

**Features:**

- **50% Error Capture**: Half of all errors are sent to Sentry
- **Moderate Sampling**: Balanced performance and monitoring
- **QA-Specific Filtering**: Filter out development-specific errors
- **Performance Monitoring**: Track key metrics without overwhelming

### Production Environment (.env.production)

```bash
# Sentry Configuration for Production
SENTRY_DSN=https://635afb487b2a47e4ea9f4cbfa61a68c9@sentry.teamcast.ai/2
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_ENABLE=true

# Environment (uses NODE_ENV automatically)
NODE_ENV=production
APP_NAME=Teamcast Backend
```

**Features:**

- **10% Error Capture**: Only 1 in 10 errors sent to Sentry
- **Minimal Sampling**: Focus on critical errors only
- **Production Filtering**: Filter out development and network errors
- **Performance Optimized**: Minimal impact on production performance

## Environment-Specific Behavior

### Error Filtering

#### Development

```typescript
// All errors are captured
beforeSend(event) {
  return event; // No filtering
}
```

#### QA

```typescript
// Filter out some development errors
beforeSend(event) {
  if (event.exception?.values?.[0]?.value?.includes('localhost')) {
    return null; // Don't send localhost errors
  }
  return event;
}
```

#### Production

```typescript
// Aggressive filtering for production
beforeSend(event) {
  if (event.exception?.values) {
    const errorMessage = event.exception.values[0]?.value || '';
    // Filter out common development/network errors
    if (errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('localhost') ||
        errorMessage.includes('127.0.0.1')) {
      return null;
    }
  }
  return event;
}
```

### Sampling Rates

#### Development

- **Error Capture**: 100%
- **Transaction Sampling**: 100%
- **Profile Sampling**: 100%
- **Breadcrumbs**: 100

#### QA

- **Error Capture**: 50%
- **Transaction Sampling**: 50%
- **Profile Sampling**: 50%
- **Breadcrumbs**: 75

#### Production

- **Error Capture**: 10%
- **Transaction Sampling**: 10%
- **Profile Sampling**: 10%
- **Breadcrumbs**: 50

## Context Information Captured

### All Environments

```typescript
// System Information
{
  nodeVersion: "v18.17.0",
  platform: "win32",
  architecture: "x64",
  pid: 12345,
  uptime: 3600,
  memoryUsage: { rss: 123456, heapUsed: 98765 }
}

// Application Information
{
  appName: "Teamcast Backend",
  version: "1.0.0",
  environment: "development|qa|production"
}
```

### Request Context (When Available)

```typescript
{
  method: "GET",
  url: "/api/client/job-postings/public/test-sentry",
  ip: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  user: {
    id: "user123",
    email: "user@example.com",
    username: "testuser"
  }
}
```

## Performance Impact

### Development

- **High Impact**: Full monitoring for debugging
- **Memory Usage**: Higher due to full context
- **Network**: All events sent to Sentry

### QA

- **Medium Impact**: Balanced monitoring
- **Memory Usage**: Moderate
- **Network**: 50% of events sent

### Production

- **Low Impact**: Minimal monitoring overhead
- **Memory Usage**: Low
- **Network**: 10% of events sent

## Monitoring and Alerts

### Development

- **Alert Level**: Low (informational)
- **Frequency**: Real-time
- **Focus**: All errors for debugging

### QA

- **Alert Level**: Medium
- **Frequency**: Near real-time
- **Focus**: Important errors and performance issues

### Production

- **Alert Level**: High (critical)
- **Frequency**: Batched
- **Focus**: Critical errors and system failures

## Best Practices

### 1. Environment-Specific DSNs

Consider using different DSNs for different environments:

```bash
# Development
SENTRY_DSN=https://dev-key@sentry.teamcast.ai/dev-project

# QA
SENTRY_DSN=https://qa-key@sentry.teamcast.ai/qa-project

# Production
SENTRY_DSN=https://prod-key@sentry.teamcast.ai/prod-project
```

### 2. Sample Rate Tuning

Adjust sample rates based on error volume:

```bash
# High error volume
SENTRY_TRACES_SAMPLE_RATE=0.05  # 5%

# Low error volume
SENTRY_TRACES_SAMPLE_RATE=0.2   # 20%
```

### 3. Error Filtering

Customize filtering based on environment needs:

```typescript
// Add environment-specific filters
if (ENV.SENTRY_ENVIRONMENT === 'production') {
  // Production-specific filtering logic
}
```

### 4. Performance Monitoring

Monitor Sentry's impact on your application:

```typescript
// Track Sentry performance
const startTime = Date.now();
sentryService.captureException(error);
const endTime = Date.now();
logger.info(`Sentry capture took ${endTime - startTime}ms`);
```
