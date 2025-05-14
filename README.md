# Uwezo System

## Features
- Secure authentication system with anonymous user redirection
- Custom event subscribers for access control 
- Code quality checks and automated testing
- Deployment pipeline configuration
- OpenAPI documentation
- Health monitoring endpoints

## Technical Stack
- Drupal CMS
- PHP 8.x
- Composer for dependency management
- Bitbucket Pipelines for CI/CD
- DDEV for local development
- GrumPHP for code quality enforcement

## Development Setup

### Prerequisites
- Docker
- DDEV
- Composer
- Make

### Key Files
- `ddev/config.yaml` - DDEV configuration
- `Makefile` - Development workflow automation
- `grumphp.yml` - Code quality checks configuration
- `bitbucket-pipelines.yml` - CI/CD pipeline definition

### Development Commands

#### DDEV Commands
- `ddev start` - Start the DDEV environment
- `ddev stop` - Stop the DDEV environment
- `ddev restart` - Restart the DDEV environment
- `ddev ssh` - SSH into the DDEV container
- `ddev composer install` - Install PHP dependencies using Composer
- `ddev drush cr` - Clear Drupal cache using Drush
- `ddev drush uli` - Get a one-time login link for Drupal

### Code Quality with GrumPHP

GrumPHP enforces code quality standards through git hooks and automated checks.

#### Configuration Details
- **Process Timeout**: 170 seconds
- **Stop on Failure**: Disabled
- **Fixer**: Enabled
- **ASCII Art**: Custom success/failure messages from clean_code module

#### Task Configurations

##### Git Blacklist
- Blocked keywords: `die()`, `var_dump()`, `exit;`, `dd()`, `kint()`, `print_r()`, `debug()`
- Applies to: PHP, module, theme, inc, phtml files
- Scans only custom modules directory
- Ignores test directories

##### Branch Naming Convention
- Valid patterns: `feat/`, `fix/`, `refactor/`, `style/`, `test/`, `docs/`, `build/`, `ops/`, `chore/`
- Format: `<type>/<TICKET-ID>/<description>`
- Blocked branches: master, develop, production, staging

##### Commit Message Format
- Pattern: `<type>(<SCOPE>): <description>`
- Maximum subject width: 60 characters
- Maximum body width: 72 characters
- Types: feat, fix, refactor, style, test, docs, build, ops, chore

##### PHP CodeSniffer
- Standards: Drupal, DrupalPractice
- Severity level: 5
- Scans custom modules only
- UTF-8 encoding enforced

### Makefile Commands

The Makefile provides shortcuts for common development tasks:

#### Setup Commands
- `make install` - Install project dependencies
- `make update` - Update dependencies

#### Development Commands
- `make clear-cache` - Clear Drupal caches
- `make lint` - Run code style checks
- `make fix` - Auto-fix code style issues
- `make test` - Run all tests and checks
- `make phpstan` - Run PHPStan analysis

#### Other Commands
- `make config-export` - Export configuration
- `make config-import` - Import configuration
- `make validate` - Validate composer.json

#### Deployment Commands
- `make deploy` - Deploy to specified environment
- `make backup` - Create backup before deployment

### CI/CD Pipeline

#### Bitbucket Pipelines
- `composer-install` - Installs PHP dependencies with artifacts
- `phpcs` - Runs PHP CodeSniffer for code quality
- `phpstan` - Static analysis with 256MB memory limit
- `yamllint` - YAML syntax validation
- `security` - Security vulnerability checks

### Event Subscribers

#### RedirectAnonymousSubscriber
Handles anonymous user access control:
- Redirects to login page
- Whitelisted paths: /user/login, /user/logout, /user/password, /healthz, /metrics/web, /docs

### Health Monitoring

#### Endpoints
- `/healthz` - Health check endpoint
- `/metrics/web` - Metrics endpoint for monitoring
- `/docs` - OpenAPI documentation endpoint
