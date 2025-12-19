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
pnpm --filter web db:generate
pnpm --filter web db:migrate

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
pnpm -r run dev

# Build all packages
pnpm -r run build

# Code quality checks
pnpm -r run lint
pnpm -r run check-types
pnpm --filter web prettier

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

### Manual Deployment

The project includes a deployment script (`scripts/deploy.sh`) that can be used for manual deployments from developer machines or in CI/CD pipelines.

#### Usage

```bash
./scripts/deploy.sh [environment] [--step STEP]
```

**Arguments:**
- `environment` - Target environment (default: staging)
- `--step STEP` - Which step to run (default: all)

**Available steps:**
- `build` - Build Docker images only
- `deploy` - Deploy application (requires pre-built images)
- `post-deploy` - Run post-deployment tasks only (drush deploy)
- `all` - Run all steps (build, deploy, post-deploy)

#### Configuration

For local deployment, add environment-prefixed variables to your `.env` file:

```bash
STAGING_DEPLOY_HOST=server.example.com
STAGING_DEPLOY_USER=deploy
STAGING_DEPLOY_PATH=/var/www/app
STAGING_DEPLOY_KEY_PATH=/path/to/ssh/key  # Optional
```

**Note:** The deployment script does NOT transfer the `.env` file to the server. You must manually create and maintain the application `.env` file on the server with the appropriate production settings.

#### Examples

```bash
# Full deployment to staging
./scripts/deploy.sh staging

# Build images only
./scripts/deploy.sh staging --step build

# Deploy only (useful after images are built)
./scripts/deploy.sh staging --step deploy

# Run post-deployment tasks only
./scripts/deploy.sh staging --step post-deploy
```

For detailed help and configuration options:
```bash
./scripts/deploy.sh --help
```

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
   nano .env  # Set production values - see list below
   
   # Start database service
   docker compose up -d db
   
   # Import database dump (uses MYSQL_ROOT_PASSWORD from container environment)
   zcat dump.sql.gz | docker compose exec -T db sh -c 'mariadb -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
   ```

   **Important:** The `.env` file on the server must be maintained manually. The deployment process does NOT transfer this file, so you need to update production settings (passwords, API keys, domain names, etc.) directly on the server whenever configuration changes are needed.

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

### Cron Jobs

The application requires a cron job to process the email queue for the Symfony Mailer module.

**Email Queue Processing:**

Add this cron job to process queued emails every minute:

```bash
# Edit crontab on the server
crontab -e

# Add this line:
* * * * * docker compose -f /path/to/deployment/docker-compose.yml exec -T admin /var/www/html/vendor/bin/drush queue:run symfony_mailer_queue >> /var/log/uwezo-mail-queue.log 2>&1
```

**Notes:**
- Replace `/path/to/deployment` with your actual deployment directory path
- The `-T` flag prevents TTY allocation for cron execution
- Logs are written to `/var/log/uwezo-mail-queue.log` for troubleshooting
- Runs every minute to ensure emails are sent promptly

### GitHub Actions Deployment

The project uses GitHub Actions for automated CI/CD. Deployment to staging happens automatically on push to `staging` branch.

The workflow uses `scripts/deploy.sh` in three sequential steps:

1. **Build** (`--step build`) - Builds Docker images for web, admin, and nginx services
2. **Deploy** (`--step deploy`) - Transfers images to the deployment server via SSH and runs `docker compose up -d`
3. **Post-deploy** (`--step post-deploy`) - Runs Drupal deployment tasks (`drush deploy`)

The workflow can also be triggered manually via workflow_dispatch in the GitHub Actions UI.

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
