#!/bin/bash

# Unified Code Quality Checker for Uwezo Project
# This script runs appropriate code quality checks based on file types

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Uwezo Code Quality Checker${NC}"
echo "=================================="

# Function to check PHP files (admin directory)
check_php() {
    if [ -d "admin" ]; then
        echo -e "\n${YELLOW}📋 Running PHP Code Quality Checks...${NC}"
        cd admin

        # Check if vendor directory exists
        if [ ! -d "vendor" ]; then
            echo -e "${RED}❌ Admin vendor directory not found. Run 'composer install' first.${NC}"
            return 1
        fi

        # Run GrumPHP
        vendor/bin/grumphp run
        local PHP_EXIT_CODE=$?
        cd ..

        if [ $PHP_EXIT_CODE -ne 0 ]; then
            echo -e "${RED}❌ PHP code quality checks failed!${NC}"
            return 1
        else
            echo -e "${GREEN}✅ PHP code quality checks passed!${NC}"
            return 0
        fi
    else
        echo -e "${YELLOW}⚠️  Admin directory not found, skipping PHP checks${NC}"
        return 0
    fi
}

# Function to check JavaScript/TypeScript files (web directory)
check_web() {
    if [ -d "web" ]; then
        echo -e "\n${YELLOW}🎨 Running Web Code Quality Checks...${NC}"
        cd web

        # Check if node_modules exists
        if [ ! -d "node_modules" ]; then
            echo -e "${RED}❌ Web node_modules not found. Run 'pnpm install' first.${NC}"
            return 1
        fi

        # Run linting, prettier, and type checks
        echo "Running ESLint..."
        pnpm run lint
        if [ $? -ne 0 ]; then
            cd ..
            return 1
        fi

        echo "Running Prettier..."
        pnpm run prettier
        if [ $? -ne 0 ]; then
            cd ..
            return 1
        fi

        echo "Running TypeScript checks..."
        pnpm run check-types
        local TS_EXIT_CODE=$?
        cd ..

        if [ $TS_EXIT_CODE -ne 0 ]; then
            echo -e "${RED}❌ Web code quality checks failed!${NC}"
            return 1
        else
            echo -e "${GREEN}✅ Web code quality checks passed!${NC}"
            return 0
        fi
    else
        echo -e "${YELLOW}⚠️  Web directory not found, skipping web checks${NC}"
        return 0
    fi
}

# Parse command line arguments
SKIP_PHP=false
SKIP_WEB=false
CHECK_ALL=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-php)
            SKIP_PHP=true
            CHECK_ALL=false
            shift
            ;;
        --skip-web)
            SKIP_WEB=true
            CHECK_ALL=false
            shift
            ;;
        --php-only)
            SKIP_WEB=true
            CHECK_ALL=false
            shift
            ;;
        --web-only)
            SKIP_PHP=true
            CHECK_ALL=false
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --php-only     Run only PHP (admin) checks"
            echo "  --web-only     Run only Web checks"
            echo "  --skip-php     Skip PHP checks"
            echo "  --skip-web     Skip Web checks"
            echo "  --help, -h     Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Initialize overall exit status
OVERALL_EXIT_STATUS=0

# Run checks based on arguments
if [ "$CHECK_ALL" = true ] || [ "$SKIP_PHP" = false ]; then
    check_php
    if [ $? -ne 0 ]; then
        OVERALL_EXIT_STATUS=1
    fi
fi

# Only run web checks if PHP checks passed (or were skipped)
if [ $OVERALL_EXIT_STATUS -eq 0 ] && { [ "$CHECK_ALL" = true ] || [ "$SKIP_WEB" = false ]; }; then
    check_web
    if [ $? -ne 0 ]; then
        OVERALL_EXIT_STATUS=1
    fi
fi

# Final result
if [ $OVERALL_EXIT_STATUS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All selected code quality checks completed successfully!${NC}"
else
    echo -e "\n${RED}💥 Code quality checks failed!${NC}"
    exit 1
fi
