#!/bin/sh
# Processes the application sync queue by calling the web cron endpoint.
# Used by the sync-worker Docker Compose service (or host cron via docker exec).

set -eu

APP_URL="${APP_URL:-http://web:3000}"
INTERVAL_MINUTES="${SYNC_INTERVAL_MINUTES:-5}"
CRON_SECRET="${CRON_SECRET:-}"

echo "[$(date -Iseconds)] sync-applications-cron started (APP_URL=${APP_URL}, interval=${INTERVAL_MINUTES}m)"

health_check() {
  curl -fsS --max-time 10 -X HEAD "${APP_URL}/api/cron/sync-applications" >/dev/null 2>&1 && echo "ok" || echo "fail"
}

echo "[$(date -Iseconds)] Waiting for web application..."
while [ "$(health_check)" != "ok" ]; do
  sleep 10
done
echo "[$(date -Iseconds)] Web application is ready"

while true; do
  echo "[$(date -Iseconds)] Processing sync queue..."

  if [ -n "$CRON_SECRET" ]; then
    RESPONSE=$(curl -sS --max-time 300 -w "\n%{http_code}" -X POST \
      -H "Authorization: Bearer ${CRON_SECRET}" \
      "${APP_URL}/api/cron/sync-applications" || printf '\n000')
  else
    RESPONSE=$(curl -sS --max-time 300 -w "\n%{http_code}" -X POST \
      "${APP_URL}/api/cron/sync-applications" || printf '\n000')
  fi

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    echo "[$(date -Iseconds)] Sync OK: ${BODY}"
  else
    echo "[$(date -Iseconds)] Sync failed (HTTP ${HTTP_CODE}): ${BODY}"
  fi

  echo "[$(date -Iseconds)] Pulling Drupal status into portal..."

  if [ -n "$CRON_SECRET" ]; then
    STATUS_RESPONSE=$(curl -sS --max-time 300 -w "\n%{http_code}" -X POST \
      -H "Authorization: Bearer ${CRON_SECRET}" \
      "${APP_URL}/api/cron/sync-status-from-drupal" || printf '\n000')
  else
    STATUS_RESPONSE=$(curl -sS --max-time 300 -w "\n%{http_code}" -X POST \
      "${APP_URL}/api/cron/sync-status-from-drupal" || printf '\n000')
  fi

  STATUS_HTTP=$(echo "$STATUS_RESPONSE" | tail -n1)
  STATUS_BODY=$(echo "$STATUS_RESPONSE" | sed '$d')

  if [ "$STATUS_HTTP" = "200" ]; then
    echo "[$(date -Iseconds)] Status pull OK: ${STATUS_BODY}"
  else
    echo "[$(date -Iseconds)] Status pull failed (HTTP ${STATUS_HTTP}): ${STATUS_BODY}"
  fi

  sleep $((INTERVAL_MINUTES * 60))
done
