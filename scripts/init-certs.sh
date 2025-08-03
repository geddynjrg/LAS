#!/bin/bash

# Script to initialize SSL certificates (Let's Encrypt or self-signed)
# Usage: ./scripts/init-certs.sh [--self-signed]

set -e

# Get the script's directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# When deployed, the script is in the project root, not in scripts/
if [[ "$SCRIPT_DIR" == */scripts ]]; then
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
else
    PROJECT_ROOT="$SCRIPT_DIR"
fi

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
        rm -f "$PROJECT_ROOT/certs/uwezo.crt"
        rm -f "$PROJECT_ROOT/certs/uwezo.key"
    fi
}

# Set up trap to clean up on exit
trap cleanup EXIT

# Load environment variables from project root
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a  # Mark variables for export
    source "$PROJECT_ROOT/.env"
    set +a  # Turn off export marking
fi

# Parse command line arguments
SELF_SIGNED=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --self-signed)
            SELF_SIGNED=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--self-signed]"
            echo ""
            echo "Options:"
            echo "  --self-signed    Create self-signed certificates instead of Let's Encrypt"
            echo "                   Use this for environments where Let's Encrypt is unavailable"
            echo "                   (e.g., private networks, development servers)"
            echo ""
            echo "Environment variables required:"
            echo "  WEB_DOMAIN       Main domain for the web application"
            echo "  ADMIN_DOMAIN     Domain for the admin interface"
            echo "  LETSENCRYPT_EMAIL Email for Let's Encrypt notifications (if not using --self-signed)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

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

if [ "$SELF_SIGNED" = false ] && [ -z "$LETSENCRYPT_EMAIL" ]; then
    echo "❌ Error: LETSENCRYPT_EMAIL is not set in your .env file"
    echo "   Example: LETSENCRYPT_EMAIL=your-email@domain.com"
    exit 1
fi

echo "========================================"
if [ "$SELF_SIGNED" = true ]; then
    echo "Self-Signed Certificate Initialization"
else
    echo "Let's Encrypt Certificate Initialization"
fi
echo "========================================"
echo ""
echo "Domains:"
echo "  - Web: $WEB_DOMAIN"
echo "  - Admin: $ADMIN_DOMAIN"
if [ "$SELF_SIGNED" = false ]; then
    echo "Email: $LETSENCRYPT_EMAIL"
fi
echo ""

# Validate domain configuration for Let's Encrypt
if [ "$SELF_SIGNED" = false ] && [ "$WEB_DOMAIN" = "localhost" ]; then
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

# Change to project root for docker compose commands
cd "$PROJECT_ROOT"

# Check if containers are already running (they should be after deployment)
echo "Checking if containers are running..."
if ! docker compose ps nginx | grep -q "Up"; then
    echo "❌ Error: Nginx is not running. Please deploy first with: ./scripts/deploy.sh"
    exit 1
fi

if ! docker compose ps certbot | grep -q "Up"; then
    echo "❌ Error: Certbot container is not running. Please deploy first with: ./scripts/deploy.sh"
    exit 1
fi

echo "✅ All containers are running"

if [ "$SELF_SIGNED" = true ]; then
    # Generate self-signed certificates
    echo ""
    echo "Generating self-signed certificates..."
    echo "These certificates will be valid for 365 days."
    echo ""
    
    
    # Generate self-signed certificate
    docker compose exec nginx sh -c "
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/nginx/certs/uwezo.key \
            -out /etc/nginx/certs/uwezo.crt \
            -subj '/C=US/ST=State/L=City/O=Organization/CN=$WEB_DOMAIN' \
            -addext 'subjectAltName=DNS:$WEB_DOMAIN,DNS:$ADMIN_DOMAIN'
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ Self-signed certificates generated successfully!"
        
        # Reload nginx
        echo "Reloading nginx configuration..."
        docker compose exec nginx nginx -s reload
        
        echo ""
        echo "✅ Self-signed certificate initialization complete!"
        echo ""
        echo "⚠️  Warning: These are self-signed certificates."
        echo "   Browsers will show security warnings."
        echo "   Only use in development or private networks."
        echo ""
        echo "Certificate details:"
        echo "  - Certificate: /etc/nginx/certs/uwezo.crt"
        echo "  - Private key: /etc/nginx/certs/uwezo.key"
        echo "  - Valid for: 365 days"
        echo ""
        echo "To regenerate, run this script again."
    else
        echo ""
        echo "❌ Self-signed certificate generation failed!"
        echo "Check the error messages above."
        exit 1
    fi
else
    # Let's Encrypt flow
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

    # Run certbot with a clean entrypoint (ignore the renewal loop)
    docker compose run --rm --entrypoint="" certbot certbot certonly \
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
fi