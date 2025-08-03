# UWEZO App

## Architecture

- **Web** (`web/`) - Next.js frontend application
- **Admin** (`admin/`) - Drupal backend
- **Packages** (`packages/`) - Shared UI components and utilities
- **Storybook** (`storybook/`) - Component documentation

## Local Development

### Prerequisites

- Node.js 20+ and pnpm
- DDEV

### Initial Setup

#### 1. Backend Setup
```bash
# Start DDEV
ddev start

# Install backend dependencies
ddev composer install

# Import database dump
ddev import-db --file=path/to/dump.sql.gz

# Run deployment tasks
ddev drush deploy

# Get admin login link
ddev drush uli
```

#### 2. Frontend Setup
```bash
# Install frontend dependencies (from project root)
pnpm install

# Set up database schema for web app (uses separate 'web' database)
pnpm --filter web db:push

# Start development server (from project root)
pnpm --filter web dev

# The web portal will be available at http://localhost:3000
```

**Note**: DDEV automatically generates `web/.env` from the root `.env` file when it starts. This file includes the correct database connection details and should not be edited manually. To regenerate, run `ddev restart`.

### Development Commands

#### Frontend Commands
```bash
# Run Storybook for component development
pnpm --filter storybook dev

# Run all development servers (web and storybook)
pnpm dev

# Build all packages
pnpm build

# Code quality checks
pnpm lint
pnpm check-types
pnpm format

# Add a new shadcn/ui component to the shared UI package
pnpm dlx shadcn@canary add button -c packages/ui
```

#### Backend Commands
```bash
# Clear cache
ddev drush cr

# Export configuration changes
ddev drush cex

# Import configuration
ddev drush cim

# Check database updates
ddev drush updb
```

For more DDEV commands and configuration options, see the [DDEV documentation](https://ddev.readthedocs.io/).

## Deployment

### Prerequisites

- Docker and Docker Compose

### Initial Server Setup

1. **Transfer initial files to server**
   ```bash
   # Create deployment directory on server
   ssh user@server "mkdir -p /path/to/deployment"
   
   # Copy necessary files to server
   scp .env.example docker-compose.yml dump.sql.gz user@server:/path/to/deployment/
   
   # SSH into the server
   ssh user@server
   cd /path/to/deployment
   ```

2. **Set up environment and database**
   ```bash
   # Create environment file from example
   cp .env.example .env
   nano .env  # Set at minimum: DB_PASSWORD, DB_ROOT_PASSWORD
   
   # Start database service
   docker compose up -d db
   
   # Import database dump (uses MYSQL_ROOT_PASSWORD from container environment)
   zcat dump.sql.gz | docker compose exec -T db sh -c 'mariadb -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
   ```

3. **Configure GitHub Secrets and Variables**
   
   In your GitHub repository settings, add these secrets:
   - `DEPLOY_HOST` - Server hostname
   - `DEPLOY_USER` - SSH username
   - `DEPLOY_KEY` - SSH private key
   - `DEPLOY_PATH` - Deployment directory path
   - `DB_PASSWORD`, `DB_ROOT_PASSWORD` (must match step 2)
   - `HASH_SALT`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
   - `EBISCLOUD_SMS_API_KEY`
   
   And these environment variables:
   - `EBISCLOUD_SMS_API_URL`
   - `WEB_DOMAIN`, `ADMIN_DOMAIN`
   - `HTTP_PORT`, `HTTPS_PORT`

After initial setup, the GitHub Actions pipeline will handle all deployments automatically.

### GitHub Actions Deployment

The project uses GitHub Actions for CI/CD. Automatic deployment to staging happens on push to `staging` branch.

1. Builds Docker images for web, admin, and nginx services
2. Transfers images to the deployment server via SSH
3. Deploys using `docker compose up -d`
4. Runs Drupal deployment tasks (`drush deploy`)

## SSL/TLS Configuration (Optional)

### 1. Create certificates directory

```bash
mkdir -p certs
```

### 2. Add certificate volume to nginx service

Edit `docker-compose.yml` and add the certificate volume to the nginx service:

```yaml
services:
  nginx:
    volumes:
      - drupal_web:/var/www/html/web:ro
      - ./certs:/etc/nginx/certs:ro  # Add this line
```

### 3. Generate certificates

**Option A: Using mkcert (Recommended)**

Install [mkcert](https://github.com/FiloSottile/mkcert) for locally-trusted certificates:

```bash
mkcert -install
mkcert -cert-file certs/uwezo.crt -key-file certs/uwezo.key localhost admin.localhost
```

**Option B: Self-signed certificates**

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/uwezo.key -out certs/uwezo.crt \
  -subj "/C=KE/ST=Nairobi/L=Nairobi/O=UWEZO/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:admin.localhost"
```

### 4. Configure nginx for SSL

Update `docker/nginx/default.conf.template` to add SSL server blocks for port 443.

### 5. Environment variables for SSL

If using self-signed certificates with Node.js, add these to your `.env`:

```bash
# For mkcert CA trust
MKCERT_CA_PATH=/home/username/.local/share/mkcert/rootCA.pem
NODE_EXTRA_CA_CERTS=/tmp/mkcert-ca.pem

# For self-signed certificates (not recommended)
NODE_TLS_REJECT_UNAUTHORIZED=0
```