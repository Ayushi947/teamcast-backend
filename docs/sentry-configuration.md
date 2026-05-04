# Sentry Configuration

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Sentry Configuration
SENTRY_DSN=https://635afb487b2a47e4ea9f4cbfa61a68c9@sentry.teamcast.ai/2
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=1.0
SENTRY_ENABLE=true

# Environment (uses NODE_ENV automatically)
# Note: Sentry is only enabled for: development, production, qa
# Other environments (like 'local') will disable Sentry automatically
NODE_ENV=development
```

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=1.0
SENTRY_ENABLE=true
```

### Production

```bash
NODE_ENV=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_ENABLE=true
```

### QA

```bash
NODE_ENV=qa
SENTRY_TRACES_SAMPLE_RATE=0.5
SENTRY_PROFILES_SAMPLE_RATE=0.5
SENTRY_ENABLE=true
```

## Testing Sentry

1. **Check Sentry Dashboard**: Verify the error appears in your Sentry project
2. **Monitor Logs**: Check application logs for Sentry initialization messages
3. **Test with Real Errors**: Trigger errors in your application to test Sentry integration
