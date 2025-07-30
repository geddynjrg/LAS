# UWEZO Portal

A monorepo containing the UWEZO portal frontend and admin backend.

## Architecture

- **Web** (`web/`) - Next.js frontend application
- **Admin** (`admin/`) - Drupal 11 CMS backend
- **Packages** (`packages/`) - Shared UI components and utilities
- **Storybook** (`storybook/`) - Component documentation

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- pnpm (for package management)

## Initial Setup

### 1. Environment Setup

Copy the environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration values.

### 2. SSL Certificates

**Recommended**: Use [mkcert](https://github.com/FiloSottile/mkcert) for locally-trusted certificates:

```bash
mkcert -install
mkcert -cert-file docker/nginx/certs/uwezo.crt -key-file docker/nginx/certs/uwezo.key localhost admin.localhost
```

**Alternative**: Generate self-signed certificates (requires `NODE_TLS_REJECT_UNAUTHORIZED=0`):

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/certs/uwezo.key -out docker/nginx/certs/uwezo.crt \
  -subj "/C=KE/ST=Nairobi/L=Nairobi/O=UWEZO/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:admin.localhost"
```

Then set `NODE_TLS_REJECT_UNAUTHORIZED=0` in your `.env` file to bypass SSL verification.


### 3. Database Initialization

```bash
# Build all services without cache for initial setup
docker compose build --no-cache

# Start database and admin services
docker compose up -d db admin

# Import database dump using Drush (replace path/to/dump.sql.gz with your actual dump file)
zcat path/to/dump.sql.gz | docker compose exec -T admin /var/www/html/vendor/bin/drush sql:cli

# Clear cache and set admin password
docker compose exec admin /var/www/html/vendor/bin/drush cr

# Start all services
docker compose up -d --build
```

## Development

### Backend Development with DDEV

For backend development, you can use DDEV for a more integrated development environment:

```bash
# Start DDEV (from project root)
ddev start

# Install dependencies
ddev composer install

# Import configuration
ddev drush cim -y

# Clear cache
ddev drush cr

# Get one-time login link
ddev drush uli

# Access the site at https://uwezo.ddev.site
```

### Frontend Development

For frontend development, run the web app locally:

```bash
# Install dependencies (from project root)
pnpm install

# Start the development server with mkcert certificate trust
pnpm --filter web run dev:local

# The web portal will be available at http://localhost:3000
```

Note: The `dev:local` script automatically configures Node.js to trust the mkcert certificate. If your mkcert root CA is in a different location, you can override it:
```bash
NODE_EXTRA_CA_CERTS=/path/to/your/rootCA.pem pnpm --filter web run dev
```

For component development with Storybook:
```bash
# Start Storybook
pnpm --filter storybook run dev

# Storybook will be available at http://localhost:6006
```

## Production Deployment

### Basic Deployment

```bash
# Build and start all services
docker compose up -d --build

# After deployment, run deployment tasks (import config, update database)
docker compose exec admin /var/www/html/vendor/bin/drush deploy

# Check service status
docker compose ps

# View logs
docker compose logs -f
```

### SSL Certificates with Let's Encrypt

For production deployments with real domains, Let's Encrypt provides free SSL certificates.

#### Prerequisites

1. **Domain names pointing to your server**
   - Both `WEB_DOMAIN` and `ADMIN_DOMAIN` must have DNS A records pointing to your server's IP
   - DNS propagation must be complete (can take up to 48 hours)

2. **Port 80 accessible**
   - Let's Encrypt validation requires HTTP access on port 80
   - Ensure firewall allows incoming connections on port 80

#### Initial Setup

1. **Configure your domains in .env**:
   ```bash
   WEB_DOMAIN=app.yourdomain.com
   ADMIN_DOMAIN=admin.yourdomain.com
   LETSENCRYPT_EMAIL=your-email@domain.com
   ```

2. **Run the initialization script**:
   ```bash
   ./scripts/init-letsencrypt.sh
   ```

   This script will:
   - Validate your configuration
   - Create temporary self-signed certificates
   - Start nginx
   - Request Let's Encrypt certificates
   - Configure nginx to use the new certificates

#### Certificate Renewal

Certificates are automatically renewed by the certbot container, which checks twice daily. Certificates renew when they have 30 days or less until expiration.

To manually check renewal status:
```bash
docker compose run --rm certbot certificates
```

To manually renew:
```bash
docker compose run --rm certbot renew
```

#### Troubleshooting

If certificate request fails:

1. **Check DNS propagation**:
   ```bash
   nslookup app.yourdomain.com
   nslookup admin.yourdomain.com
   ```

2. **Verify port 80 is accessible**:
   - Check firewall rules
   - Ensure no other service is using port 80

3. **Check nginx logs**:
   ```bash
   docker compose logs nginx
   ```

4. **IP Whitelist**: If using `ALLOWED_IPS`, temporarily disable it during initial certificate setup as Let's Encrypt needs to access your server

### IP Whitelisting

To restrict access to specific IP addresses:

1. Set `ALLOWED_IPS` in your `.env` file:
   ```bash
   # Single IP
   ALLOWED_IPS=203.0.113.10 1;
   
   # Multiple IPs/ranges
   ALLOWED_IPS=203.0.113.10 1; 198.51.100.0/24 1; 192.0.2.0/28 1;
   ```

2. Restart nginx:
   ```bash
   docker compose restart nginx
   ```

Note: Let's Encrypt validation requests bypass IP restrictions to allow certificate renewal.