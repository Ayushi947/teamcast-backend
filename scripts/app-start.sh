#!/bin/bash

# Application Startup Script for Teamcast Backend
# This script only starts the application - migrations should be handled separately

set -e

# Configuration
ENVIRONMENT="${NODE_ENV:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verify Prisma client is generated
verify_prisma_client() {
    log_info "Verifying Prisma client..."
    
    if [ ! -d "node_modules/.prisma" ] && [ ! -d "node_modules/@prisma/client" ]; then
        log_warn "Prisma client not found, generating..."
        npx prisma generate
    else
        log_info "Prisma client is available"
    fi
}

# Verify database connectivity
verify_database() {
    log_info "Verifying database connectivity..."
    
    # Simple connectivity check
    if npx prisma db push --accept-data-loss --dry-run > /dev/null 2>&1; then
        log_info "Database is accessible"
    else
        log_error "Cannot connect to database. Please ensure:"
        log_error "1. Database is running"
        log_error "2. DATABASE_URL is correctly configured"
        log_error "3. Migrations have been applied"
        exit 1
    fi
}

# Check if migrations are applied
check_migrations() {
    log_info "Checking migration status..."
    
    if npx prisma migrate status --short 2>/dev/null | grep -q "Database schema is up to date"; then
        log_info "Database schema is up to date"
    else
        log_warn "Database may need migrations. Run migrations separately before starting the app."
        log_warn "Use: ./scripts/db-migrate.sh"
    fi
}

# Main startup function
main() {
    log_info "Starting Teamcast Backend Application..."
    log_info "Environment: $ENVIRONMENT"
    
    # Pre-flight checks
    verify_prisma_client
    verify_database
    check_migrations
    
    log_info "All checks passed. Starting application..."
    log_info "Application will be available on port 4300"
    
    # Start the application
    exec node --expose-gc --trace-gc --trace-gc-ignore-scavenger --require perf_hooks dist/src/index.js
}

# Execute main function
main "$@" 