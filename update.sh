#!/bin/bash

# Display commands as they are executed
set -x

# Get the current git SHA
GIT_SHA=$(git rev-parse --short HEAD)

# Stash any changes
git stash

# Pull the latest changes from the repository
git pull

# Create a temporary build directory
TEMP_BUILD_DIR="temp_build_${GIT_SHA}"
echo "Creating temporary build directory: $TEMP_BUILD_DIR"
mkdir -p $TEMP_BUILD_DIR

# Copy necessary files to temp directory
echo "Copying files to temporary directory..."
cp -r src prisma package.json package-lock.json tsconfig.json jest.config.ts jest.e2e.config.ts .env $TEMP_BUILD_DIR/

# Move to temp directory
cd $TEMP_BUILD_DIR

# Install dependencies in temp directory
echo "Installing dependencies in temporary directory..."
npm install

# Generate Prisma client
npm run generate

# Build the project in temp directory
echo "Building project in temporary directory..."
if npm run build; then
    echo "Build successful, replacing current build..."

    # Move back to main directory
    cd ..

    # PM2 stop the application
    pm2 stop teamcast

    # Create a backup directory if it doesn't exist
    BACKUP_DIR="build_backups"
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "Creating backup directory: $BACKUP_DIR"
        mkdir -p $BACKUP_DIR
    fi

    # Backup current build directory if it exists
    if [ -d "build" ]; then
        mv build "${BACKUP_DIR}/build_backup_${GIT_SHA}"
    fi

    # Move new build to main directory
    mv $TEMP_BUILD_DIR build

    # Move to build directory
    cd build

    # Migrate the database
    # npm run migrate

    # Restart the application using PM2
    pm2 restart teamcast

    # Print the status of the application
    pm2 status teamcast

    # Print the logs of the application
    pm2 logs teamcast

    # Move back to main directory
    cd ..

else
    echo "Build failed, cleaning up temporary directory..."
    cd ..
    rm -rf $TEMP_BUILD_DIR
    exit 1
fi
