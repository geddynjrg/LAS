#!/bin/bash

# Sync Queue Worker Script
# This script can run either the Node.js worker or call the API endpoint

echo "[$(date)] Sync worker script started"

# Get configuration from environment
WORKER_MODE=${WORKER_MODE:-nodejs}  # Options: nodejs, api
INTERVAL_MINUTES=${SYNC_INTERVAL_MINUTES:-5}
CRON_SECRET=${CRON_SECRET}
APP_URL="${APP_URL:-http://web:3000}"

# Health check function
health_check() {
    curl -f -s -o /dev/null -w "%{http_code}" -I -X HEAD "${APP_URL}/api/cron/sync-applications" || echo "0"
}

# Wait for the application to be ready
echo "[$(date)] Waiting for application to be ready..."
while [ "$(health_check)" != "200" ]; do
    echo "[$(date)] Application not ready yet, waiting..."
    sleep 10
done
echo "[$(date)] Application is ready!"

if [ "$WORKER_MODE" = "nodejs" ]; then
    echo "[$(date)] Running in Node.js worker mode"
    cd /app/apps/uwezo
    npm run worker
else
    echo "[$(date)] Running in API call mode"
    # Main loop for API calls
    while true; do
        echo "[$(date)] Processing sync queue..."
        
        # Call the sync endpoint
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Authorization: Bearer ${CRON_SECRET}" \
            "${APP_URL}/api/cron/sync-applications")
        
        # Extract HTTP status code
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" -eq 200 ]; then
            echo "[$(date)] Sync completed successfully: $body"
        else
            echo "[$(date)] Sync failed with HTTP $http_code: $body"
        fi
        
        # Sleep for the specified interval
        echo "[$(date)] Sleeping for ${INTERVAL_MINUTES} minutes..."
        sleep $((INTERVAL_MINUTES * 60))
    done
fi 