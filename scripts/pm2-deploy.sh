#!/bin/bash

# PM2 Deployment Script for Teamcast Backend
# Usage: ./scripts/pm2-deploy.sh [environment]
# Environment options: development, production, qa

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default environment
ENVIRONMENT=${1:-development}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|production|qa)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Valid options: development, production, qa"
    exit 1
fi

print_status "Starting PM2 deployment for environment: $ENVIRONMENT"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Please install it first:"
    print_error "npm install -g pm2"
    exit 1
fi

# Check if the application is built
if [ ! -d "dist" ]; then
    print_warning "Build directory not found. Building the application..."
    npm run build
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop existing PM2 process if running
if pm2 list | grep -q "teamcast-backend"; then
    print_status "Stopping existing PM2 process..."
    pm2 stop teamcast-backend || true
    pm2 delete teamcast-backend || true
fi

# Start the application with PM2
print_status "Starting application with PM2..."
case $ENVIRONMENT in
    "production")
        pm2 start pm2.config.js --env production
        ;;
    "qa")
        pm2 start pm2.config.js --env qa
        ;;
    "development")
        pm2 start pm2.config.js --env development
        ;;
esac

# Wait a moment for the application to start
sleep 3

# Check if the application started successfully
if pm2 list | grep -q "teamcast-backend.*online"; then
    print_success "Application started successfully!"
    
    # Save PM2 configuration
    print_status "Saving PM2 configuration..."
    pm2 save
    
    # Display status
    print_status "Current PM2 status:"
    pm2 status
    
    print_success "Deployment completed successfully!"
    print_status "You can monitor the application with:"
    print_status "  npm run pm2:monit"
    print_status "  npm run pm2:logs"
    print_status "  npm run pm2:status"
else
    print_error "Application failed to start!"
    print_status "Checking PM2 logs..."
    pm2 logs teamcast-backend --lines 20
    exit 1
fi 
