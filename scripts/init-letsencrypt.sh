#!/bin/bash

# Script to initialize Let's Encrypt certificates
# Usage: ./scripts/init-letsencrypt.sh

set -e

# Get the script's directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Track if we created temporary certificates
CREATED_TEMP_CERT=false

# Cleanup function
cleanup() {
    # Clean up test file if nginx is running
    if docker compose ps nginx 2>/dev/null | grep -q "running"; then
        docker compose exec nginx rm -f /var/www/certbot/.well-known/acme-challenge/test.txt 2>/dev/null || true
    fi
    
    # Clean up temporary certificates if we created them
    if [ "$CREATED_TEMP_CERT" = true ]; then
        echo "Cleaning up temporary certificates..."
        rm -f "$PROJECT_ROOT/docker/nginx/certs/uwezo.crt"
        rm -f "$PROJECT_ROOT/docker/nginx/certs/uwezo.key"
    fi
}

# Set up trap to clean up on exit
trap cleanup EXIT

# Load environment variables from project root
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
fi

# Check if required environment variables are set
if [ -z "$WEB_DOMAIN" ]; then
    echo "❌ Error: WEB_DOMAIN is not set in your .env file"
    echo "   Example: WEB_DOMAIN=app.yourdomain.com"
    exit 1
fi

if [ -z "$ADMIN_DOMAIN" ]; then
    echo "❌ Error: ADMIN_DOMAIN is not set in your .env file"
    echo "   Example: ADMIN_DOMAIN=admin.yourdomain.com"
    exit 1
fi

if [ -z "$LETSENCRYPT_EMAIL" ]; then
    echo "❌ Error: LETSENCRYPT_EMAIL is not set in your .env file"
    echo "   Example: LETSENCRYPT_EMAIL=your-email@domain.com"
    exit 1
fi

echo "========================================"
echo "Let's Encrypt Certificate Initialization"
echo "========================================"
echo ""
echo "Domains:"
echo "  - Web: $WEB_DOMAIN"
echo "  - Admin: $ADMIN_DOMAIN"
echo "Email: $LETSENCRYPT_EMAIL"
echo ""

# Validate domain configuration
if [ "$WEB_DOMAIN" = "localhost" ]; then
    echo "❌ Error: WEB_DOMAIN cannot be 'localhost' for Let's Encrypt"
    echo "   Please set a real domain name in your .env file"
    exit 1
fi

if [ "$ADMIN_DOMAIN" = "admin.localhost" ]; then
    echo "❌ Error: ADMIN_DOMAIN cannot be 'admin.localhost' for Let's Encrypt"
    echo "   Please set a real domain name in your .env file"
    exit 1
fi

# Ask for confirmation
read -p "Do you want to request certificates for these domains? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Create necessary directories
echo "Creating certificate directories..."
mkdir -p "$PROJECT_ROOT/docker/nginx/certs"

# Check if we need temporary certificates
if [ ! -f "$PROJECT_ROOT/docker/nginx/certs/uwezo.crt" ]; then
    echo "Creating temporary self-signed certificate..."
    docker run --rm \
        -v "$PROJECT_ROOT/docker/nginx/certs:/certs" \
        alpine/openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
        -keyout /certs/uwezo.key \
        -out /certs/uwezo.crt \
        -subj "/CN=$WEB_DOMAIN"
    CREATED_TEMP_CERT=true
fi

# Change to project root for docker compose commands
cd "$PROJECT_ROOT"

# Start only nginx service (and its dependencies)
echo "Starting nginx service..."
docker compose up -d nginx

# Wait for nginx to be ready
echo "Waiting for nginx to be ready..."
sleep 10

# Check if nginx is running
if ! docker compose ps nginx | grep -q "running"; then
    echo "❌ Error: Nginx failed to start. Check logs with: docker compose logs nginx"
    exit 1
fi

# Test ACME challenge path
echo "Testing ACME challenge path..."
docker compose exec nginx mkdir -p /var/www/certbot/.well-known/acme-challenge
docker compose exec nginx sh -c 'echo "test-acme-challenge" > /var/www/certbot/.well-known/acme-challenge/test.txt'

# Test HTTP access to ACME challenge
echo "Verifying HTTP access to ACME challenge path..."
TEST_URL="http://$WEB_DOMAIN/.well-known/acme-challenge/test.txt"
echo "Testing URL: $TEST_URL"

# Try to fetch the test file
if command -v curl >/dev/null 2>&1; then
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$TEST_URL" || echo "failed")
elif command -v wget >/dev/null 2>&1; then
    RESPONSE=$(wget -q -O /dev/null --timeout=5 "$TEST_URL" && echo "200" || echo "failed")
else
    echo "Warning: Neither curl nor wget found. Skipping HTTP test."
    RESPONSE="skip"
fi

if [ "$RESPONSE" = "200" ]; then
    echo "✅ ACME challenge path is accessible"
elif [ "$RESPONSE" = "403" ]; then
    echo "❌ Error: ACME challenge path returned 403 Forbidden"
    echo "   This might be due to IP whitelist restrictions."
    echo "   Consider temporarily disabling ALLOWED_IPS in .env"
    exit 1
elif [ "$RESPONSE" = "skip" ]; then
    echo "⚠️  Could not test HTTP access (no curl/wget available)"
else
    echo "❌ Error: Could not access ACME challenge path (HTTP $RESPONSE)"
    echo "   Let's Encrypt needs HTTP access on port 80 to validate domain ownership"
    exit 1
fi

# Request certificates
echo ""
echo "Requesting Let's Encrypt certificates..."
echo "This will obtain certificates for both domains in a single certificate."
echo ""

# Run certbot
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $LETSENCRYPT_EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $WEB_DOMAIN \
    -d $ADMIN_DOMAIN

# Check if certificates were obtained
if [ $? -eq 0 ]; then
    echo "✅ Certificates obtained successfully!"
    
    # Update nginx certificate paths
    echo "Updating nginx to use Let's Encrypt certificates..."
    
    # Create proper symlinks
    docker compose exec nginx sh -c "
        rm -f /etc/nginx/certs/uwezo.crt /etc/nginx/certs/uwezo.key
        ln -sf /etc/letsencrypt/live/$WEB_DOMAIN/fullchain.pem /etc/nginx/certs/uwezo.crt
        ln -sf /etc/letsencrypt/live/$WEB_DOMAIN/privkey.pem /etc/nginx/certs/uwezo.key
    "
    
    # Reload nginx
    echo "Reloading nginx configuration..."
    docker compose exec nginx nginx -s reload
    
    echo ""
    echo "✅ Let's Encrypt initialization complete!"
    echo ""
    echo "Your certificates are now active and will auto-renew."
    echo ""
    echo "Certificate details:"
    echo "  - Certificate: /etc/letsencrypt/live/$WEB_DOMAIN/fullchain.pem"
    echo "  - Private key: /etc/letsencrypt/live/$WEB_DOMAIN/privkey.pem"
    echo ""
    echo "The certbot container will check for renewal twice daily."
    echo "To manually renew, run: docker compose run --rm certbot renew"
else
    echo ""
    echo "❌ Certificate request failed!"
    echo ""
    echo "Common issues:"
    echo "1. DNS not propagated - ensure $WEB_DOMAIN and $ADMIN_DOMAIN point to this server"
    echo "2. Firewall blocking port 80 - Let's Encrypt needs HTTP access"
    echo "3. IP whitelist blocking Let's Encrypt - temporarily disable ALLOWED_IPS"
    echo ""
    echo "Check certbot logs above for specific error details."
    exit 1
fi