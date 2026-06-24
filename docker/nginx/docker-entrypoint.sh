#!/bin/sh
set -e

mkdir -p /etc/nginx/certs

if [ -f "/etc/nginx/ssl/uwezo-fullchain.pem" ] && [ -f "/etc/nginx/ssl/uwezo.key" ]; then
    echo "✅ Using Comodo wildcard certificate from /etc/nginx/ssl"
elif [ -f "/etc/letsencrypt/live/${WEB_DOMAIN:-localhost}/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/${WEB_DOMAIN:-localhost}/privkey.pem" ]; then
    echo "Let's Encrypt certificates found. Creating symlinks..."
    ln -sf /etc/letsencrypt/live/${WEB_DOMAIN:-localhost}/fullchain.pem /etc/nginx/certs/uwezo.crt
    ln -sf /etc/letsencrypt/live/${WEB_DOMAIN:-localhost}/privkey.pem /etc/nginx/certs/uwezo.key
    echo "✅ Using Let's Encrypt certificates"
elif [ ! -f "/etc/nginx/certs/uwezo.crt" ] || [ ! -f "/etc/nginx/certs/uwezo.key" ]; then
    echo "No certificates found. Generating self-signed certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/certs/uwezo.key \
        -out /etc/nginx/certs/uwezo.crt \
        -subj "/C=KE/ST=Nairobi/L=Nairobi/O=Uwezo Fund/CN=*.uwezo.go.ke" \
        -addext "subjectAltName=DNS:uwezo.go.ke,DNS:*.uwezo.go.ke"
    echo "✅ Self-signed certificates generated automatically"
else
    echo "✅ Using existing certificates"
fi

exec /docker-entrypoint.sh "$@"
