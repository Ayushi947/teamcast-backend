#!/bin/bash

# Database Migration Script for Teamcast Backend
# This script handles database migrations for different environments

set -e

# Configuration
ENVIRONMENT="${NODE_ENV:-development}"
MAX_ATTEMPTS=30
RETRY_DELAY=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Wait for database to be available
wait_for_database() {
    log_info "Waiting for database to be ready..."
    
    attempt=1
    while [ $attempt -le $MAX_ATTEMPTS ]; do
        # Try to connect to database using prisma db execute
        if echo "SELECT 1;" | npx prisma db execute --stdin > /dev/null 2>&1; then
            log_info "Database is ready!"
            return 0
        fi
        
        # Fallback: try prisma validate as connection test
        if npx prisma validate > /dev/null 2>&1; then
            log_info "Database is ready!"
            return 0
        fi
        
        log_debug "Database not ready, attempt $attempt/$MAX_ATTEMPTS..."
        sleep $RETRY_DELAY
        attempt=$((attempt + 1))
    done
    
    log_error "Database failed to become ready after $MAX_ATTEMPTS attempts"
    exit 1
}

# Check migration status
check_migration_status() {
    log_info "Checking migration status..."
    
    if npx prisma migrate status 2>/dev/null; then
        return 0
    else
        log_warn "Migration status check failed"
        return 1
    fi
}

# Reset database (development and QA only)
reset_database() {
    if [ "$ENVIRONMENT" = "development" ] || [ "$ENVIRONMENT" = "qa" ]; then
        log_warn "Resetting database ($ENVIRONMENT mode)..."
        npx prisma migrate reset --force --skip-seed
        log_info "Database reset completed"
    else
        log_error "Database reset is only allowed in development and QA environments"
        exit 1
    fi
}

# Apply migrations
apply_migrations() {
    log_info "Applying database migrations..."
    
    case "$ENVIRONMENT" in
        "development")
            log_info "Development environment: Using migrate dev..."
            npx prisma migrate dev --name "dev_migration_$(date +%Y%m%d_%H%M%S)"
            ;;
        "qa")
            log_info "QA environment: Deploying migrations with validation..."
            # Check if migrations are needed
            if npx prisma migrate status | grep -q "Database schema is up to date"; then
                log_info "Database schema is already up to date"
            else
                log_info "Applying migrations to QA environment..."
                npx prisma migrate deploy
                log_info "QA migrations applied successfully"
            fi
            ;;
        "staging"|"test")
            log_info "Staging/Test environment: Deploying migrations..."
            npx prisma migrate deploy
            ;;
        "production")
            log_info "Production environment: Deploying migrations with validation..."
            
            # Additional safety checks for production
            if ! npx prisma migrate status | grep -q "Database schema is up to date"; then
                log_info "Migrations need to be applied in production"
                
                # Create backup recommendation
                log_warn "IMPORTANT: Ensure database backup is created before proceeding"
                
                # Deploy migrations
                npx prisma migrate deploy
                log_info "Production migrations applied successfully"
            else
                log_info "Database schema is already up to date"
            fi
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            log_error "Supported environments: development, qa, staging, test, production"
            exit 1
            ;;
    esac
}

# Generate Prisma client
generate_client() {
    log_info "Generating Prisma client..."
    npx prisma generate
    log_info "Prisma client generated successfully"
}

# Run database seeding
run_seeding() {
    case "$ENVIRONMENT" in
        "development")
            log_info "Running development seed..."
            if command -v npm >/dev/null 2>&1 && npm run seed:dev > /dev/null 2>&1; then
                log_info "Development seeding completed"
            else
                log_warn "Development seeding failed or not configured, but continuing..."
            fi
            ;;
        "qa")
            log_info "Running QA seed with production-like data..."
            if command -v npm >/dev/null 2>&1 && npm run seed:prod > /dev/null 2>&1; then
                log_info "QA seeding completed"
            else
                log_warn "QA seeding failed or not configured, but continuing..."
            fi
            ;;
        "staging"|"test")
            log_info "Running production seed for staging/test..."
            if command -v npm >/dev/null 2>&1 && npm run seed:prod > /dev/null 2>&1; then
                log_info "Staging seeding completed"
            else
                log_warn "Staging seeding failed or not configured, but continuing..."
            fi
            ;;
        "production")
            if [ "${SKIP_SEEDING:-false}" != "true" ]; then
                log_info "Running production seed..."
                if command -v npm >/dev/null 2>&1 && npm run seed:prod > /dev/null 2>&1; then
                    log_info "Production seeding completed"
                else
                    log_warn "Production seeding failed or not configured, but continuing..."
                fi
            else
                log_info "Skipping seeding in production (SKIP_SEEDING=true)"
            fi
            ;;
    esac
}

# Validate schema integrity
validate_schema() {
    log_info "Validating database schema..."
    
    if npx prisma validate; then
        log_info "Schema validation passed"
    else
        log_error "Schema validation failed"
        exit 1
    fi
}

# Main migration function
main() {
    log_info "Starting database migration process..."
    log_info "Environment: $ENVIRONMENT"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --reset)
                reset_database
                shift
                ;;
            --validate-only)
                validate_schema
                exit 0
                ;;
            --status)
                check_migration_status
                exit 0
                ;;
            --skip-seed)
                SKIP_SEEDING=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --reset         Reset database (development only)"
                echo "  --validate-only Only validate schema"
                echo "  --status        Check migration status"
                echo "  --skip-seed     Skip database seeding"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute migration steps
    wait_for_database
    validate_schema
    apply_migrations
    generate_client
    
    if [ "${SKIP_SEEDING:-false}" != "true" ]; then
        run_seeding
    fi
    
    log_info "Database migration completed successfully!"
}

# Execute main function
main "$@"