#!/bin/bash

# Set working directory to script's location
cd "$(dirname "$0")"

# Load CRON_API_KEY from .env file
if [ -f .env ]; then
  export CRON_API_KEY=$(grep '^CRON_API_KEY=' .env | cut -d '=' -f2-)
else
  echo "[ERROR] .env file not found!"
  exit 1
fi

# Validate API key
if [ -z "$CRON_API_KEY" ]; then
  echo "[ERROR] CRON_API_KEY not found in .env!"
  exit 1
fi

# Logging file
LOG_FILE="cron_api_log_$(date +'%Y-%m-%d').log"

# RAG
# echo "[RAG] $(date): Starting..." >> "$LOG_FILE"
# RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:4300/api/cron/rag" \
#   -H "Content-Type: application/json" \
#   -H "x-api-key: $CRON_API_KEY" \
#   -d '{"batchSize": 10}')
# HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)
# echo "$RESPONSE_BODY" >> "$LOG_FILE"
# echo "[RAG] HTTP Status: $HTTP_CODE" >> "$LOG_FILE"
# echo -e "\n" >> "$LOG_FILE"

# Candidate Recommendation
# echo "[Candidate Recommendation] $(date): Starting..." >> "$LOG_FILE"
# RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:4300/api/cron/candidate-recommendation" \
#   -H "Content-Type: application/json" \
#   -H "x-api-key: $CRON_API_KEY" \
#   -d '{"batchSize": 10}')
# HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)
# echo "$RESPONSE_BODY" >> "$LOG_FILE"
# echo "[Candidate Recommendation] HTTP Status: $HTTP_CODE" >> "$LOG_FILE"
# echo -e "\n" >> "$LOG_FILE"

# Job Recommendation
# echo "[Job Recommendation] $(date): Starting..." >> "$LOG_FILE"
# RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:4300/api/cron/job-recommendation" \
#   -H "Content-Type: application/json" \
#   -H "x-api-key: $CRON_API_KEY" \
#   -d '{"batchSize": 10}')
# HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)
# echo "$RESPONSE_BODY" >> "$LOG_FILE"
# echo "[Job Recommendation] HTTP Status: $HTTP_CODE" >> "$LOG_FILE"
# echo -e "\n" >> "$LOG_FILE"

# Daily Statistics
echo "[Daily Statistics] $(date): Starting..." >> "$LOG_FILE"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:4300/api/cron/daily-stats" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $CRON_API_KEY" \
  -d '{"data": {}}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)
echo "$RESPONSE_BODY" >> "$LOG_FILE"
echo "[Daily Statistics] HTTP Status: $HTTP_CODE" >> "$LOG_FILE"
echo -e "\n" >> "$LOG_FILE"

# Daily Digest
echo "[Daily Digest] $(date): Starting..." >> "$LOG_FILE"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:4300/api/cron/daily-digest" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $CRON_API_KEY" \
  -d '{"data": {}}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)
echo "$RESPONSE_BODY" >> "$LOG_FILE"
echo "[Daily Digest] HTTP Status: $HTTP_CODE" >> "$LOG_FILE"
echo -e "\n" >> "$LOG_FILE"
