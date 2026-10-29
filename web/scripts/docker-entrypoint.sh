#!/bin/sh
#
# Docker Entrypoint for Web Container (Next.js Application)
#
# This script runs INSIDE the web container on startup and handles:
#   1. Waiting for the database container to be ready to accept connections
#   2. Running Prisma migrations to update the web database schema
#   3. Starting the Next.js application
#
# Why this script exists:
#   - Docker Compose 'depends_on' only waits for containers to start, not for
#     services to be ready. MariaDB takes ~2-5 seconds after container start
#     to accept connections.
#   - Without waiting, 'prisma migrate deploy' fails with connection errors
#   - Inline commands in package.json cannot handle retry logic or proper
#     error handling
#   - Using 'exec' ensures Node.js becomes PID 1 for proper signal handling
#     and graceful shutdown
#
# When this runs:
#   - On container startup (defined in Dockerfile CMD)
#   - After deployments when containers restart
#   - During local development with Docker Compose
#
# Related files:
#   - web/Dockerfile: Copies this script and sets it as CMD
#   - web/prisma/migrations/: Contains all migration files
#   - scripts/deploy.sh: Also runs migrations during deployment for visibility
#

set -e

cd /app/web

echo "Waiting for database to be ready..."

MAX_RETRIES=30
RETRY_COUNT=0

until npx prisma db execute --schema=./prisma/schema.prisma --stdin <<'EOF' || [ $RETRY_COUNT -eq $MAX_RETRIES ]
SELECT 1;
EOF
do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Database not ready (attempt $RETRY_COUNT/$MAX_RETRIES), retrying in 2 seconds..."
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Failed to connect to database after $MAX_RETRIES attempts"
  exit 1
fi

echo "Database is ready"

echo "Running database migrations..."
prisma migrate deploy --schema=./prisma/schema.prisma

echo "Starting application..."
mkdir -p /app/web/uploads 2>/dev/null || true
cd /app
echo "Running as $(id)"
exec node web/server.js
