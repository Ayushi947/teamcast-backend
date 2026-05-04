#!/bin/bash

# Test script to verify video upload and playback in Docker
echo "Testing video functionality in Docker..."

# Check if uploads directory exists and has proper permissions
echo "1. Checking uploads directory..."
if [ -d "./uploads" ]; then
    echo "✓ Uploads directory exists"
    ls -la ./uploads
else
    echo "✗ Uploads directory missing - creating it"
    mkdir -p ./uploads
    chmod 755 ./uploads
fi

# Check if assets directory exists
echo "2. Checking assets directory..."
if [ -d "./assets/fonts" ]; then
    echo "✓ Assets/fonts directory exists"
    ls -la ./assets/fonts/
else
    echo "✗ Assets/fonts directory missing"
fi

# Test Docker container file access
echo "3. Testing Docker container file access..."
if [ "$(docker ps -q -f name=teamcast-backend-api)" ]; then
    echo "✓ Docker container is running"
    
    # Check if uploads directory is accessible in container
    docker exec teamcast-backend-api ls -la /app/uploads
    docker exec teamcast-backend-api ls -la /app/assets/fonts
    
    # Test file creation in container
    docker exec teamcast-backend-api touch /app/uploads/test-file.txt
    if [ -f "./uploads/test-file.txt" ]; then
        echo "✓ Volume mount is working correctly"
        rm ./uploads/test-file.txt
    else
        echo "✗ Volume mount issue detected"
    fi
else
    echo "✗ Docker container not running"
fi

# Test API endpoints
echo "4. Testing API endpoints..."
API_URL="http://localhost:4300"

# Test health endpoint
if curl -s "$API_URL/health" > /dev/null; then
    echo "✓ Health endpoint is accessible"
else
    echo "✗ Health endpoint not accessible"
fi

# Test uploads endpoint
if curl -s "$API_URL/api/local/uploads" > /dev/null; then
    echo "✓ Uploads endpoint is accessible"
else
    echo "✗ Uploads endpoint not accessible"
fi

echo "Test completed!" 