#!/bin/bash

# UWEZO Deployment Script
# Deploys the application using Docker images via SCP transfer
# Can be used from GitHub Actions or developer machines
# Run with --help for usage information

set -euo pipefail

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root directory
cd "$PROJECT_ROOT"

# Configuration
ENVIRONMENT=""
STEP=""
COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-uwezo}
SERVICES=(web admin nginx)

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --step)
                STEP="$2"
                shift 2
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                if [[ -z "$ENVIRONMENT" ]]; then
                    ENVIRONMENT="$1"
                else
                    log_error "Unknown argument: $1"
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Set defaults
    ENVIRONMENT=${ENVIRONMENT:-staging}
    STEP=${STEP:-all}
}

# Load deployment configuration
load_env_vars() {
    if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
        # GitHub Actions: Variables should already be set in environment
        # Use non-prefixed variables (DEPLOY_HOST, DEPLOY_USER, etc.)
        DEPLOY_HOST="${DEPLOY_HOST:-}"
        DEPLOY_USER="${DEPLOY_USER:-}"
        DEPLOY_PATH="${DEPLOY_PATH:-}"
        DEPLOY_KEY="${DEPLOY_KEY:-}"
    else
        # Local deployment: Load from .env file
        if [[ ! -f ".env" ]]; then
            log_error ".env file not found. Please create it with deployment configuration."
            exit 1
        fi
        
        # Source the .env file
        set -a
        source .env
        set +a
        
        # For local deployment, REQUIRE environment-prefixed variables
        local env_upper=$(echo "$ENVIRONMENT" | tr '[:lower:]' '[:upper:]')
        
        DEPLOY_HOST="${env_upper}_DEPLOY_HOST"
        DEPLOY_USER="${env_upper}_DEPLOY_USER"
        DEPLOY_PATH="${env_upper}_DEPLOY_PATH"
        DEPLOY_KEY_PATH="${env_upper}_DEPLOY_KEY_PATH"
        
        # Get the actual values
        DEPLOY_HOST="${!DEPLOY_HOST:-}"
        DEPLOY_USER="${!DEPLOY_USER:-}"
        DEPLOY_PATH="${!DEPLOY_PATH:-}"
        DEPLOY_KEY_PATH="${!DEPLOY_KEY_PATH:-}"
    fi
    
    # Check required variables (same for both local and GitHub Actions)
    local missing_vars=()
    [[ -z "$DEPLOY_HOST" ]] && missing_vars+=("DEPLOY_HOST")
    [[ -z "$DEPLOY_USER" ]] && missing_vars+=("DEPLOY_USER")
    [[ -z "$DEPLOY_PATH" ]] && missing_vars+=("DEPLOY_PATH")
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
            log_error "Missing required environment variables:"
            printf '  %s\n' "${missing_vars[@]}"
            log_error "Please add them as GitHub secrets."
        else
            log_error "Missing required deployment variables:"
            local env_upper=$(echo "$ENVIRONMENT" | tr '[:lower:]' '[:upper:]')
            for var in "${missing_vars[@]}"; do
                echo "  ${env_upper}_${var}"
            done
            log_error "Please add them to your .env file. Example:"
            log_error "  ${env_upper}_DEPLOY_HOST=your-server.com"
            log_error "  ${env_upper}_DEPLOY_USER=deploy"
            log_error "  ${env_upper}_DEPLOY_PATH=/path/to/deployment"
        fi
        exit 1
    fi
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}


# Setup SSH key
setup_ssh() {
    if [[ -n "${DEPLOY_KEY:-}" ]]; then
        # GitHub Actions - use provided key
        echo "$DEPLOY_KEY" > /tmp/deploy_key
        chmod 600 /tmp/deploy_key
        SSH_KEY_ARG="-i /tmp/deploy_key"
    elif [[ -n "${DEPLOY_KEY_PATH:-}" ]]; then
        # Developer machine - use specified key path
        SSH_KEY_ARG="-i $DEPLOY_KEY_PATH"
    else
        # Developer machine - use default SSH configuration (ssh-agent, ~/.ssh/config, etc.)
        SSH_KEY_ARG=""
    fi
    
    # SSH options for automated deployment
    SSH_OPTIONS="-o ConnectTimeout=30 -o ServerAliveInterval=10 -o StrictHostKeyChecking=no"
    
    # Test SSH connection
    if ! ssh $SSH_KEY_ARG $SSH_OPTIONS "$DEPLOY_USER@$DEPLOY_HOST" "echo 'SSH connection successful'" > /dev/null 2>&1; then
        log_error "Failed to connect to $DEPLOY_USER@$DEPLOY_HOST"
        log_error "This might be due to high network latency or connectivity issues"
        exit 1
    fi
}

# Build Docker images
build_images() {
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install Docker."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
    
    # Use docker compose if available, otherwise fall back to docker-compose
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_NAME" $COMPOSE_CMD build --parallel
}

# Check if Docker images exist
check_images() {
    
    local missing_images=()
    for SERVICE in "${SERVICES[@]}"; do
        IMAGE_NAME="${COMPOSE_PROJECT_NAME}-${SERVICE}:latest"
        if ! docker image inspect "$IMAGE_NAME" > /dev/null 2>&1; then
            missing_images+=("$IMAGE_NAME")
        fi
    done
    
    if [[ ${#missing_images[@]} -gt 0 ]]; then
        log_error "Missing Docker images. Please build them first:"
        printf '  %s\n' "${missing_images[@]}"
        log_error "Run: ./scripts/deploy.sh $ENVIRONMENT --step build"
        exit 1
    fi
    
}

# Transfer images to remote server
transfer_images() {
    
    # Create deployment directory if it doesn't exist
    ssh $SSH_KEY_ARG $SSH_OPTIONS "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p $DEPLOY_PATH"
    
    # Transfer each service image
    for SERVICE in "${SERVICES[@]}"; do
        IMAGE_NAME="${COMPOSE_PROJECT_NAME}-${SERVICE}:latest"
        
        # Save image locally
        docker save "$IMAGE_NAME" | gzip > "/tmp/${SERVICE}-image.tar.gz"
        
        # Transfer with scp
        scp $SSH_KEY_ARG "/tmp/${SERVICE}-image.tar.gz" "$DEPLOY_USER@$DEPLOY_HOST:/tmp/"
        
        # Load on remote host and cleanup
        ssh $SSH_KEY_ARG $SSH_OPTIONS "$DEPLOY_USER@$DEPLOY_HOST" \
            "zcat /tmp/${SERVICE}-image.tar.gz | docker load && rm /tmp/${SERVICE}-image.tar.gz"
        
        # Clean up local file
        rm "/tmp/${SERVICE}-image.tar.gz"
        
    done
}

# Transfer configuration files
transfer_configs() {
    
    scp $SSH_KEY_ARG docker-compose.yml "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"
    
    # Transfer init-certs.sh script if it exists
    if [ -f "scripts/init-certs.sh" ]; then
        scp $SSH_KEY_ARG scripts/init-certs.sh "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"
        ssh $SSH_KEY_ARG $SSH_OPTIONS "$DEPLOY_USER@$DEPLOY_HOST" "chmod +x $DEPLOY_PATH/init-certs.sh"
    fi
}

# Deploy application
deploy_application() {
    
    ssh $SSH_KEY_ARG $SSH_OPTIONS "$DEPLOY_USER@$DEPLOY_HOST" \
        "cd $DEPLOY_PATH && docker compose up -d --remove-orphans --no-build"
}

# Run post-deployment tasks
post_deploy() {
    
    # Wait a moment for containers to be ready
    sleep 5
    
    ssh $SSH_KEY_ARG $SSH_OPTIONS "$DEPLOY_USER@$DEPLOY_HOST" \
        "cd $DEPLOY_PATH && docker compose exec -T admin /var/www/html/vendor/bin/drush deploy"
}


# Cleanup
cleanup() {
    if [[ -n "${DEPLOY_KEY:-}" && -f "/tmp/deploy_key" ]]; then
        rm -f /tmp/deploy_key
    fi
}

# Execute deployment step based on configuration
execute_step() {
    case "$STEP" in
        build)
            load_env_vars
            setup_ssh
            build_images
            log_success "Build completed successfully!"
            ;;
        deploy)
            load_env_vars
            setup_ssh
            check_images
            transfer_images
            transfer_configs
            deploy_application
            log_success "Application deployment completed successfully!"
            ;;
        post-deploy)
            load_env_vars
            setup_ssh
            post_deploy
            log_success "Post-deployment tasks completed successfully!"
            ;;
        all)
            load_env_vars
            setup_ssh
            build_images
            transfer_images
            transfer_configs
            deploy_application
            post_deploy
            log_success "Full deployment completed successfully!"
            ;;
        *)
            log_error "Invalid step: $STEP"
            log_error "Valid steps: build, deploy, post-deploy, all"
            exit 1
            ;;
    esac
}

# Main deployment function
main() {
    
    # Trap to ensure cleanup on exit
    trap cleanup EXIT
    
    execute_step
}

# Show help
show_help() {
    echo "UWEZO Deployment Script"
    echo
    echo "Usage: $0 [environment] [--step STEP]"
    echo
    echo "Arguments:"
    echo "  environment             - Target environment (default: staging)"
    echo "  --step STEP             - Which step to run (default: all)"
    echo
    echo "Available steps:"
    echo "  build                   - Build Docker images only"
    echo "  deploy                  - Deploy application (requires pre-built images)"
    echo "  post-deploy             - Run post-deployment tasks only"
    echo "  all                     - Run all steps (build, deploy, post-deploy)"
    echo
    echo "Configuration:"
    echo
    echo "For LOCAL deployment (using .env file):"
    echo "  Required variables MUST be prefixed with environment name:"
    echo "    STAGING_DEPLOY_HOST     - SSH hostname for staging"
    echo "    STAGING_DEPLOY_USER     - SSH username for staging" 
    echo "    STAGING_DEPLOY_PATH     - Remote deployment path for staging"
    echo "    STAGING_DEPLOY_KEY_PATH - SSH private key path (optional)"
    echo
    echo "For GITHUB ACTIONS (using secrets):"
    echo "  Variables should NOT be prefixed:"
    echo "    DEPLOY_HOST             - SSH hostname"
    echo "    DEPLOY_USER             - SSH username"
    echo "    DEPLOY_PATH             - Remote deployment path"
    echo "    DEPLOY_KEY              - SSH private key content"
    echo
    echo "IMPORTANT: The .env file is NOT transferred to the server during deployment."
    echo "           You must manually create and maintain the application .env file on the server."
    echo
    echo "Example .env configuration:"
    echo "  STAGING_DEPLOY_HOST=server.example.com"
    echo "  STAGING_DEPLOY_USER=deploy"
    echo "  STAGING_DEPLOY_PATH=/var/www/app"
    echo
    echo "Usage examples:"
    echo "  $0 staging                      # Full deployment to staging"
    echo "  $0 staging --step build         # Build images only"
    echo "  $0 staging --step deploy        # Deploy only (for CI/CD)"
    echo "  $0 staging --step post-deploy   # Post-deployment tasks only"
    echo
}

# Parse arguments and run main function
parse_args "$@"
main