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
LOG_FILE="subscription_cron_api_log_$(date +'%Y-%m-%d').log"

# Client Subscription Expiry
echo "[Client Subscription Expiry] $(date): Starting..." >> "$LOG_FILE"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:4300/api/cron/subscription-expiry" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $CRON_API_KEY" \
  -d '{"type": "CLIENT_SUBSCRIPTION_EXPIRY", "batchSize": 10}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)
echo "$RESPONSE_BODY" >> "$LOG_FILE"
echo "[Client Subscription Expiry] HTTP Status: $HTTP_CODE" >> "$LOG_FILE"
echo -e "\n" >> "$LOG_FILE"

# Candidate Subscription Expiry
echo "[Candidate Subscription Expiry] $(date): Starting..." >> "$LOG_FILE"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:4300/api/cron/subscription-expiry" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $CRON_API_KEY" \
  -d '{"type": "CANDIDATE_SUBSCRIPTION_EXPIRY", "batchSize": 10}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)
echo "$RESPONSE_BODY" >> "$LOG_FILE"
echo "[Candidate Subscription Expiry] HTTP Status: $HTTP_CODE" >> "$LOG_FILE"
echo -e "\n" >> "$LOG_FILE"

echo "Subscription expiry cron jobs completed at $(date)" >> "$LOG_FILE"
