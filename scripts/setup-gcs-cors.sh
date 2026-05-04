#!/bin/bash

# Setup CORS configuration for GCS buckets to enable video playback
# This script applies CORS settings to allow video players to load content from GCS

set -e

echo "🔧 Setting up CORS configuration for GCS buckets..."

# Get the GCP project from environment or use default
GCP_PROJECT="${GCP_PROJECT:-teamcastai}"

# Get the bucket name from environment or use default
BUCKET_NAME="${BUCKET_NAME:-teamcast-local-storage}"

echo "📋 GCP Project: ${GCP_PROJECT}"
echo "📦 Bucket: ${BUCKET_NAME}"

# Check if cors.json exists
if [ ! -f "cors.json" ]; then
  echo "❌ Error: cors.json not found in current directory"
  echo "Please run this script from the teamcast-backend directory"
  exit 1
fi

# Verify bucket exists and belongs to the project
echo ""
echo "🔍 Verifying bucket exists in project ${GCP_PROJECT}..."
if ! gsutil ls -p ${GCP_PROJECT} gs://${BUCKET_NAME} &>/dev/null; then
  echo "❌ Error: Bucket gs://${BUCKET_NAME} not found in project ${GCP_PROJECT}"
  echo ""
  echo "Available buckets in project ${GCP_PROJECT}:"
  gsutil ls -p ${GCP_PROJECT} 2>/dev/null || echo "  (Unable to list buckets - check project access)"
  exit 1
fi

echo "✅ Bucket verified in project ${GCP_PROJECT}"
echo ""
echo "📦 Applying CORS configuration to bucket: gs://${BUCKET_NAME}"

# Apply CORS configuration
gsutil cors set cors.json gs://${BUCKET_NAME}

echo "✅ CORS configuration applied successfully!"

# Verify CORS configuration
echo ""
echo "📋 Current CORS configuration:"
gsutil cors get gs://${BUCKET_NAME}

echo ""
echo "✅ Setup complete! Video playback from ${BUCKET_NAME} should now work."
echo ""
echo "📝 Notes:"
echo "   - Applied to project: ${GCP_PROJECT}"
echo "   - Applied to bucket: gs://${BUCKET_NAME}"
echo ""
echo "🔧 For other buckets/projects, run:"
echo "   GCP_PROJECT=teamcastai BUCKET_NAME=teamcast-prod-recordings ./scripts/setup-gcs-cors.sh"
