#!/usr/bin/env bash
#
# Uwezo infrastructure daily backup
# Covers: portal MariaDB (drupal + web), LMS MariaDB, Redis, Docker volumes,
#         env/compose/config, and appearance assets (uploads, Drupal files).
#
# Schedule (cron): 03:00 Africa/Nairobi (EAT, UTC+3)
#   0 3 * * * TZ=Africa/Nairobi /home/administrator/scripts/uwezo-backup.sh
#
# Retention policy:
#   - Daily: keep the 7 most recent dated backup directories
#   - Weekly: on Sundays, also copy to weekly/ and keep 4 weekly snapshots
#
# Destination: /home/administrator/backups/uwezo-daily/
# GitHub:    geddynjrg/uwezo-backups (via uwezo-backup-to-github.sh after each run)
#
set -euo pipefail

export TZ=Africa/Nairobi

BACKUP_ROOT="/home/administrator/backups/uwezo-daily"
LOCK_FILE="${BACKUP_ROOT}/.backup.lock"
DATE_TAG="$(date +%Y-%m-%d)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DEST="${BACKUP_ROOT}/${DATE_TAG}"
LOG_FILE="${DEST}/backup.log"
DRY_RUN="${1:-}"

PORTAL_ENV="/home/administrator/Loan_Application/.env"
LOANS_ENV="/home/administrator/loans/.env"
LMS_ENV="/home/administrator/projects/lms_source_code/uwezo-loan-tracking/.env"

PORTAL_DB_CONTAINER="uwezo-db-1"
LMS_DB_CONTAINER="uwezo-lms-db"
REDIS_CONTAINER="uwezo-lms-redis"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S %Z')] $*"
  echo "$msg"
  if [[ -f "$LOG_FILE" ]]; then
    echo "$msg" >>"$LOG_FILE"
  fi
}

load_env_var() {
  local file="$1" key="$2" default="${3:-}"
  if [[ ! -f "$file" ]]; then
    echo "$default"
    return
  fi
  local val
  val="$(grep -E "^${key}=" "$file" 2>/dev/null | head -1 | cut -d= -f2- | sed 's/^["'\'']//;s/["'\'']$//' || true)"
  if [[ -z "$val" ]]; then
    echo "$default"
  else
    echo "$val"
  fi
}

require_container() {
  local name="$1"
  if ! docker ps --format '{{.Names}}' | grep -qx "$name"; then
    log "SKIP: container $name is not running"
    return 1
  fi
  return 0
}

backup_volume() {
  local vol="$1" archive="$2"
  local archive_path="${DEST}/volumes/$(basename "$archive")"
  if ! docker volume inspect "$vol" &>/dev/null; then
    log "SKIP volume $vol (not found)"
    return 0
  fi
  log "Archiving volume $vol -> $(basename "$archive")"
  if [[ "$DRY_RUN" == "--dry-run" ]]; then
    return 0
  fi
  # Run tar as root inside the container so www-data-owned LMS storage paths are readable.
  set +e
  docker run --rm \
    -v "${vol}:/data:ro" \
    -v "${DEST}/volumes:/backup" \
    alpine:3.20 \
    tar czf "/backup/$(basename "$archive")" -C /data .
  local tar_rc=$?
  set -e
  if [[ -f "$archive_path" ]]; then
    chown "$(id -u):$(id -g)" "$archive_path" 2>/dev/null || true
  fi
  if (( tar_rc != 0 )); then
    log "WARN: volume $vol archive exit $tar_rc (partial archive may exist)"
  else
    log "Volume $vol archived ($(du -h "$archive_path" 2>/dev/null | cut -f1 || echo '?'))"
  fi
  return 0
}

bump_db_timeouts() {
  local container="$1"
  docker exec "$container" sh -c '
    mariadb -u root -p"$MYSQL_ROOT_PASSWORD" -e "
      SET GLOBAL net_read_timeout=7200;
      SET GLOBAL wait_timeout=7200;
      SET GLOBAL interactive_timeout=7200;
    " 2>/dev/null
  ' || true
}

dump_mariadb() {
  local container="$1" user="$2" pass="$3" db="$4" outfile="$5"
  log "Dumping MariaDB $db from $container"
  if [[ "$DRY_RUN" == "--dry-run" ]]; then
    return 0
  fi
  local tmp_sql="/tmp/uwezo-dump-${db}.sql"
  set +e
  # Write dump inside the container to avoid pipe timeouts on large tables.
  docker exec "$container" sh -c "
    mariadb-dump \
      --single-transaction --quick --routines --triggers \
      --max-allowed-packet=512M \
      -u'${user}' -p'${pass}' '${db}' > '${tmp_sql}' 2>/tmp/uwezo-dump.err
    echo \$? > /tmp/uwezo-dump.rc
  "
  local dump_rc
  dump_rc="$(docker exec "$container" cat /tmp/uwezo-dump.rc 2>/dev/null || echo 1)"
  if [[ "$dump_rc" != "0" ]]; then
    docker exec "$container" tail -5 /tmp/uwezo-dump.err 2>/dev/null >>"$LOG_FILE" || true
  fi
  docker cp "${container}:${tmp_sql}" - 2>/dev/null | gzip -9 >"$outfile"
  docker exec "$container" rm -f "$tmp_sql" /tmp/uwezo-dump.err /tmp/uwezo-dump.rc 2>/dev/null || true
  set -e
  local size
  size="$(wc -c <"$outfile" | tr -d ' ')"
  if (( size < 100 )); then
    log "ERROR: dump $db failed (exit $dump_rc, $size bytes)"
    return 1
  fi
  if (( dump_rc != 0 )); then
    log "WARN: mariadb-dump exit $dump_rc for $db but archive is $(du -h "$outfile" | cut -f1) — keeping partial dump"
  else
    log "Dump $db complete ($(du -h "$outfile" | cut -f1))"
  fi
}

apply_retention() {
  log "Applying retention (7 daily, 4 weekly)"
  if [[ "$DRY_RUN" == "--dry-run" ]]; then
    return 0
  fi

  mapfile -t daily_dirs < <(find "$BACKUP_ROOT" -maxdepth 1 -mindepth 1 -type d -name '20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]' | sort -r)
  local i=0
  for dir in "${daily_dirs[@]}"; do
    i=$((i + 1))
    if (( i > 7 )); then
      log "Removing old daily backup: $dir"
      rm -rf "$dir"
    fi
  done

  local weekly_root="${BACKUP_ROOT}/weekly"
  mkdir -p "$weekly_root"
  if [[ "$(date +%u)" == "7" ]]; then
    log "Sunday — creating weekly snapshot"
    rm -rf "${weekly_root}/${DATE_TAG}"
    cp -al "$DEST" "${weekly_root}/${DATE_TAG}" 2>/dev/null || cp -a "$DEST" "${weekly_root}/${DATE_TAG}"
  fi

  mapfile -t weekly_dirs < <(find "$weekly_root" -maxdepth 1 -mindepth 1 -type d -name '20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]' | sort -r)
  i=0
  for dir in "${weekly_dirs[@]}"; do
    i=$((i + 1))
    if (( i > 4 )); then
      log "Removing old weekly backup: $dir"
      rm -rf "$dir"
    fi
  done
}

GITHUB_SYNC_DONE=0

run_github_sync() {
  local github_script="/home/administrator/scripts/uwezo-backup-to-github.sh"
  if [[ "$GITHUB_SYNC_DONE" == "1" || "$DRY_RUN" == "--dry-run" || ! -x "$github_script" ]]; then
    return 0
  fi
  if [[ ! -d "${DEST}/databases" ]]; then
    return 0
  fi
  local has_sql=0
  for f in "${DEST}"/databases/*.sql.gz; do
    [[ -f "$f" ]] && has_sql=1 && break
  done
  if (( has_sql == 0 )); then
    return 0
  fi
  GITHUB_SYNC_DONE=1
  log "Starting GitHub sync..."
  if ! "$github_script" "$DATE_TAG"; then
    log "WARNING: GitHub sync failed (local backup is intact)"
  fi
}

main() {
  mkdir -p "$BACKUP_ROOT"
  if [[ "$DRY_RUN" != "--dry-run" ]]; then
    exec 9>"$LOCK_FILE"
    if ! flock -n 9; then
      echo "Another backup is already running; exiting." >&2
      exit 0
    fi
  fi

  mkdir -p "${DEST}"/{databases,volumes,configs,appearance}
  : >"$LOG_FILE"
  trap run_github_sync EXIT

  log "=== Uwezo backup started (timestamp=$TIMESTAMP) ==="
  if [[ "$DRY_RUN" == "--dry-run" ]]; then
    log "DRY RUN — no files will be written"
  fi

  local portal_user portal_pass lms_user lms_pass lms_db
  portal_user="$(load_env_var "$PORTAL_ENV" DB_USER drupal)"
  portal_pass="$(load_env_var "$PORTAL_ENV" DB_PASSWORD)"
  lms_user="$(load_env_var "$LMS_ENV" DB_USERNAME uwezo_admin)"
  lms_pass="$(load_env_var "$LMS_ENV" DB_PASSWORD)"
  lms_db="$(load_env_var "$LMS_ENV" DB_DATABASE uwezo_fund03)"

  # --- SQL dumps ---
  if require_container "$PORTAL_DB_CONTAINER"; then
    dump_mariadb "$PORTAL_DB_CONTAINER" "$portal_user" "$portal_pass" drupal \
      "${DEST}/databases/portal-drupal.sql.gz"
    dump_mariadb "$PORTAL_DB_CONTAINER" "$portal_user" "$portal_pass" web \
      "${DEST}/databases/portal-web-prisma.sql.gz"
  fi

  if require_container "$LMS_DB_CONTAINER"; then
    bump_db_timeouts "$LMS_DB_CONTAINER"
    dump_mariadb "$LMS_DB_CONTAINER" "$lms_user" "$lms_pass" "$lms_db" \
      "${DEST}/databases/lms-${lms_db}.sql.gz"
  fi

  # --- Redis (queue/cache state) ---
  if require_container "$REDIS_CONTAINER"; then
    log "Saving Redis RDB snapshot"
    if [[ "$DRY_RUN" != "--dry-run" ]]; then
      docker exec "$REDIS_CONTAINER" redis-cli BGSAVE >/dev/null
      sleep 2
      docker cp "${REDIS_CONTAINER}:/data/dump.rdb" "${DEST}/databases/redis-dump.rdb" 2>/dev/null \
        || docker cp "${REDIS_CONTAINER}:/data/dump.rdb" "${DEST}/databases/redis-dump.rdb" || true
      if [[ -f "${DEST}/databases/redis-dump.rdb" ]]; then
        gzip -9f "${DEST}/databases/redis-dump.rdb"
      fi
    fi
  fi

  # --- Docker volumes (files/uploads; DB volumes optional redundancy) ---
  local volumes=(
    uwezo_drupal_files
    uwezo_drupal_private
    uwezo_web_uploads
    uwezo-prod_prod_drupal_files
    uwezo-prod_prod_drupal_private
    uwezo-prod_prod_web_uploads
    uwezo-lms_storage_data
    uwezo_certbot_conf
    uwezo_certbot_www
    uwezo-prod_prod_certbot_conf
    uwezo-prod_prod_certbot_www
  )
  for vol in "${volumes[@]}"; do
    backup_volume "$vol" "${vol}.tar.gz"
  done

  # --- Configs & secrets (restricted permissions on archive) ---
  log "Archiving configuration and env files"
  if [[ "$DRY_RUN" != "--dry-run" ]]; then
    local config_tar="${DEST}/configs/uwezo-configs-and-env.tar.gz"
    tar czf "$config_tar" \
      -C /home/administrator \
      Loan_Application/docker-compose.yml \
      Loan_Application/loans/docker-compose.yml \
      loans/docker-compose.yml \
      projects/lms_source_code/uwezo-loan-tracking/docker-compose.yml \
      projects/lms_source_code/uwezo-loan-tracking/docker-compose-local.yml \
      loan_app_staging/live_fix.conf \
      2>/dev/null || true

    tar czf "${DEST}/configs/drupal-config-sync.tar.gz" \
      -C /home/administrator/Loan_Application/admin config/sync

    # Env files with secrets — mode 600 on archive; never commit to git
    tar czf "${DEST}/configs/env-secrets.tar.gz" \
      -C /home/administrator \
      Loan_Application/.env \
      loans/.env \
      projects/lms_source_code/uwezo-loan-tracking/.env \
      2>/dev/null || true
    chmod 600 "${DEST}/configs/env-secrets.tar.gz" 2>/dev/null || true

    if [[ -d /home/administrator/ssl/uwezo.go.ke ]]; then
      tar czf "${DEST}/configs/ssl-uwezo-go-ke.tar.gz" \
        -C /home/administrator/ssl uwezo.go.ke
      chmod 600 "${DEST}/configs/ssl-uwezo-go-ke.tar.gz"
    fi

    docker ps -a --format '{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' \
      >"${DEST}/configs/docker-ps-snapshot.txt"
    docker volume ls >"${DEST}/configs/docker-volumes-snapshot.txt"
  fi

  # --- Appearance: LMS public/storage from bind-mounted app tree ---
  log "Archiving LMS appearance assets"
  if [[ "$DRY_RUN" != "--dry-run" && -d /home/administrator/projects/lms_source_code/uwezo-loan-tracking/public ]]; then
    tar czf "${DEST}/appearance/lms-public.tar.gz" \
      -C /home/administrator/projects/lms_source_code/uwezo-loan-tracking/public .
  fi
  if [[ "$DRY_RUN" != "--dry-run" && -d /home/administrator/projects/lms_source_code/uwezo-loan-tracking/storage/app/public ]]; then
    tar czf "${DEST}/appearance/lms-storage-public.tar.gz" \
      -C /home/administrator/projects/lms_source_code/uwezo-loan-tracking/storage/app/public .
  fi

  # --- Manifest ---
  if [[ "$DRY_RUN" != "--dry-run" ]]; then
    {
      echo "backup_timestamp=$TIMESTAMP"
      echo "backup_date=$DATE_TAG"
      echo "timezone=Africa/Nairobi"
      echo ""
      echo "=== databases ==="
      ls -lh "${DEST}/databases" 2>/dev/null || true
      echo ""
      echo "=== volumes ==="
      ls -lh "${DEST}/volumes" 2>/dev/null || true
      echo ""
      echo "=== configs ==="
      ls -lh "${DEST}/configs" 2>/dev/null || true
      echo ""
      echo "=== appearance ==="
      ls -lh "${DEST}/appearance" 2>/dev/null || true
      du -sh "$DEST"
    } >"${DEST}/MANIFEST.txt"
    chmod -R u=rwX,go= "${DEST}" 2>/dev/null || true
    chmod 600 "${DEST}/configs/"*.tar.gz 2>/dev/null || true
  fi

  apply_retention
  log "=== Uwezo backup finished: $DEST ==="
  run_github_sync
}

main "$@" 2>&1 | tee -a "${BACKUP_ROOT}/backup-cron.log"
