#!/bin/bash

# ANSI Color Codes
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BOLD="\033[1m"
NC="\033[0m"

# Validate Parameters
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Error: Both user and project parameters are required and cannot be empty.${NC}"
    echo -e "${RED}Usage: $0 user project${NC}"
    exit 1
fi

# Progress Variables
TOTAL_STEPS=5
CURRENT_STEP=0

# Function to update and display progress
update_progress() {
    CURRENT_STEP=$((CURRENT_STEP+1))
#    echo -e "${YELLOW}Progress: Step $CURRENT_STEP of $TOTAL_STEPS...${NC}"
}

# Function to print section header
print_section_header() {
    echo -e "${YELLOW}================================================${NC}"
    echo -e "${BOLD}${YELLOW}    >> Progress... Step ${CURRENT_STEP}/${TOTAL_STEPS}: $1${NC}"
    echo -e "${YELLOW}================================================${NC}\n"
}

# SSH Configuration
SSH_HOST="fusion.adm.ee"
USER="$1"
PROJECT="$2"
PROJECT_DIR="/mnt/qa/www/$PROJECT"
DB_FILE="db_dump.sql.gz"
LOCAL_ROOT_DIR=$(pwd)
DRUPAL_FILES_DIR="$LOCAL_ROOT_DIR/web/sites/default/files"

# Start Timer
START_TIME=$(date +%s)

echo -e "${RED}==========================================================================================${NC}"
echo -e "${BOLD}${RED}#### Starting synchronization for project '$PROJECT' with user '$USER'... ####${NC}"
echo -e "${RED}==========================================================================================${NC}\n"

# Database Dump
database_dump() {
    update_progress
    print_section_header "Database Dump"
    ssh $USER@$SSH_HOST "cd $PROJECT_DIR && sudo -u pipeline ddev start && sudo -u ubuntu ddev export-db > $DB_FILE"
    echo -e "\n${GREEN}---------------------------------${NC}"
    echo -e "${GREEN}    ✔ Database dump completed.${NC}"
    echo -e "${GREEN}---------------------------------${NC}\n"
}

# Rsync Database
rsync_db() {
    update_progress
    print_section_header "Rsync Database"
    rsync -avz --progress $USER@$SSH_HOST:$PROJECT_DIR/$DB_FILE $LOCAL_ROOT_DIR/
    echo -e "\n${GREEN}---------------------------------${NC}"
    echo -e "${GREEN}    ✔ Database file rsync completed.${NC}"
    echo -e "${GREEN}---------------------------------${NC}\n"
}

# Rsync Files
rsync_files() {
    update_progress
    print_section_header "Rsync Files"
    rsync -avz --progress $USER@$SSH_HOST:$PROJECT_DIR/web/sites/default/files/* $DRUPAL_FILES_DIR/
    echo -e "\n${GREEN}---------------------------------${NC}"
    echo -e "${GREEN}    ✔ Files rsync completed.${NC}"
    echo -e "${GREEN}---------------------------------${NC}\n"
}

# Import Database
import_db() {
    update_progress
    print_section_header "Import Database"
    ddev drush sql-drop -y
    gunzip -c $LOCAL_ROOT_DIR/$DB_FILE | ddev drush sql-cli
    echo -e "\n${GREEN}---------------------------------${NC}"
    echo -e "${GREEN}    ✔ Database import completed.${NC}"
    echo -e "${GREEN}---------------------------------${NC}\n"
}

# Prepare Login Link
prepare_uli() {
    update_progress
    print_section_header "Prepare Login Link"
    ddev drush uli
    echo -e "\n${GREEN}---------------------------------${NC}"
    echo -e "${GREEN}    ✔ Login link prepared.${NC}"
    echo -e "${GREEN}---------------------------------${NC}\n"
}

# Execute Functions
database_dump
rsync_db
rsync_files
import_db
prepare_uli

# End Timer and Display Total Execution Time
END_TIME=$(date +%s)
ELAPSED_TIME=$((END_TIME - START_TIME))
echo -e "${YELLOW}=====================================================================================${NC}"
echo -e "${BOLD}${GREEN}#### Synchronization for project '$PROJECT' completed in $ELAPSED_TIME seconds.  ####${NC}"
echo -e "${YELLOW}=====================================================================================${NC}\n"
