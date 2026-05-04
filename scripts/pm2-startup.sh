#!/bin/bash

# PM2 Startup Configuration Script
# This script configures PM2 to start automatically on system boot

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "Configuring PM2 startup..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Please install it first:"
    print_error "npm install -g pm2"
    exit 1
fi

# Check if running as root (required for startup configuration)
if [ "$EUID" -ne 0 ]; then
    print_warning "This script should be run as root to configure system startup"
    print_warning "You can run it with: sudo ./scripts/pm2-startup.sh"
    exit 1
fi

# Generate startup script
print_status "Generating PM2 startup script..."
pm2 startup

print_success "PM2 startup configuration completed!"
print_status "The startup script has been generated."
print_status "PM2 will now start automatically on system boot."
print_status ""
print_status "To save your current PM2 configuration:"
print_status "  pm2 save"
print_status ""
print_status "To disable startup:"
print_status "  pm2 unstartup" 
