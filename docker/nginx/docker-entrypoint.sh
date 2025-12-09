#!/bin/sh
set -e

# Ensure the certs directory exists
mkdir -p /etc/nginx/certs

# Check if Let's Encrypt certificates exist and create symlinks
if [ -f "/etc/letsencrypt/live/${WEB_DOMAIN:-localhost}/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/${WEB_DOMAIN:-localhost}/privkey.pem" ]; then
    echo "Let's Encrypt certificates found. Creating symlinks..."
    ln -sf /etc/letsencrypt/live/${WEB_DOMAIN:-localhost}/fullchain.pem /etc/nginx/certs/uwezo.crt
    ln -sf /etc/letsencrypt/live/${WEB_DOMAIN:-localhost}/privkey.pem /etc/nginx/certs/uwezo.key
    echo "✅ Using Let's Encrypt certificates"
elif [ ! -f "/etc/nginx/certs/uwezo.crt" ] || [ ! -f "/etc/nginx/certs/uwezo.key" ]; then
    echo "No certificates found. Generating self-signed certificates..."
    
    # Generate self-signed certificate with both domains
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/certs/uwezo.key \
        -out /etc/nginx/certs/uwezo.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=${WEB_DOMAIN:-localhost}" \
        -addext "subjectAltName=DNS:${WEB_DOMAIN:-localhost},DNS:${ADMIN_DOMAIN:-admin.localhost}"
    
    echo "✅ Self-signed certificates generated automatically"
    echo "   These are temporary certificates. For production, run init-certs.sh"
else
    echo "✅ Using existing certificates"
fi

# Continue with the original nginx entrypoint
exec /docker-entrypoint.sh "$@"