#!/usr/bin/env bash
#
# Uwezo incremental database snapshots (portal + LMS)
#
# Schedule (cron, Africa/Nairobi):
#   0 6 * * * TZ=Africa/Nairobi /home/administrator/scripts/uwezo-backup-incremental.sh morning
#   0 15 * * * TZ=Africa/Nairobi /home/administrator/scripts/uwezo-backup-incremental.sh afternoon
#
# Complements the full infrastructure backup at 03:00 (uwezo-backup.sh) which
# also archives volumes, Redis, configs, and appearance assets.
#
# Strategy: timed SQL snapshots in dated directories (not row-level deltas).
# Portal DBs are small and dumped every run. LMS (~800MB+) is included here for
# midday recovery points; the 03:00 job remains the authoritative full backup.
#
# Retention: keep the 14 most recent snapshot directories (~7 days at 2/day).
#
set -euo pipefail

export TZ=Africa/Nairobi

SLOT="${1:-}"
if [[ "$SLOT" != "morning" && "$SLOT" != "afternoon" ]]; then
  echo "Usage: $0 morning|afternoon" >&2
  exit 1
fi

BACKUP_ROOT="/home/administrator/backups/uwezo-incremental"
DATE_TAG="$(date +%Y-%m-%d)"
HOUR_TAG="$(date +%H)"
DEST="${BACKUP_ROOT}/${DATE_TAG}-${SLOT}"
LOCK_FILE="${BACKUP_ROOT}/.incremental.lock"
LOG_FILE="${DEST}/backup.log"
RETENTION_COUNT=14

PORTAL_ENV="/home/administrator/Loan_Application/.env"
LMS_ENV="/home/administrator/projects/lms_source_code/uwezo-loan-tracking/.env"
PORTAL_DB_CONTAINER="uwezo-db-1"
LMS_DB_CONTAINER="uwezo-lms-db"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S %Z')] [$SLOT] $*"
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
  local tmp_sql="/tmp/uwezo-incr-${db}-${SLOT}.sql"
  set +e
  docker exec "$container" sh -c "
    mariadb-dump \
      --single-transaction --quick --routines --triggers \
      --max-allowed-packet=512M \
      -u'${user}' -p'${pass}' '${db}' > '${tmp_sql}' 2>/tmp/uwezo-incr.err
    echo \$? > /tmp/uwezo-incr.rc
  "
  local dump_rc
  dump_rc="$(docker exec "$container" cat /tmp/uwezo-incr.rc 2>/dev/null || echo 1)"
  if [[ "$dump_rc" != "0" ]]; then
    docker exec "$container" tail -5 /tmp/uwezo-incr.err 2>/dev/null >>"$LOG_FILE" || true
  fi
  docker cp "${container}:${tmp_sql}" - 2>/dev/null | gzip -9 >"$outfile"
  docker exec "$container" rm -f "$tmp_sql" /tmp/uwezo-incr.err /tmp/uwezo-incr.rc 2>/dev/null || true
  set -e
  local size
  size="$(wc -c <"$outfile" | tr -d ' ')"
  if (( size < 100 )); then
    log "ERROR: dump $db failed (exit $dump_rc, $size bytes)"
    return 1
  fi
  log "Dump $db complete ($(du -h "$outfile" | cut -f1))"
}

apply_retention() {
  log "Applying retention (keep $RETENTION_COUNT snapshots)"
  mapfile -t dirs < <(find "$BACKUP_ROOT" -maxdepth 1 -mindepth 1 -type d \
    ! -name 'weekly' \
    \( -name '20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]-morning' -o -name '20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]-afternoon' \) \
    | sort -r)
  local i=0
  for dir in "${dirs[@]}"; do
    i=$((i + 1))
    if (( i > RETENTION_COUNT )); then
      log "Removing old snapshot: $dir"
      rm -rf "$dir"
    fi
  done
}

main() {
  mkdir -p "$BACKUP_ROOT"
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    echo "Another incremental backup is already running; exiting." >&2
    exit 0
  fi

  mkdir -p "${DEST}/databases"
  : >"$LOG_FILE"

  log "=== Incremental backup started (dest=$DEST hour=$HOUR_TAG) ==="

  local portal_user portal_pass lms_user lms_pass lms_db
  portal_user="$(load_env_var "$PORTAL_ENV" DB_USER drupal)"
  portal_pass="$(load_env_var "$PORTAL_ENV" DB_PASSWORD)"
  lms_user="$(load_env_var "$LMS_ENV" DB_USERNAME uwezo_admin)"
  lms_pass="$(load_env_var "$LMS_ENV" DB_PASSWORD)"
  lms_db="$(load_env_var "$LMS_ENV" DB_DATABASE uwezo_fund03)"

  if require_container "$PORTAL_DB_CONTAINER"; then
    dump_mariadb "$PORTAL_DB_CONTAINER" "$portal_user" "$portal_pass" drupal \
      "${DEST}/databases/portal-drupal.sql.gz"
    dump_mariadb "$PORTAL_DB_CONTAINER" "$portal_user" "$portal_pass" web \
      "${DEST}/databases/portal-web.sql.gz"
  fi

  if require_container "$LMS_DB_CONTAINER"; then
    bump_db_timeouts "$LMS_DB_CONTAINER"
    dump_mariadb "$LMS_DB_CONTAINER" "$lms_user" "$lms_pass" "$lms_db" \
      "${DEST}/databases/lms-${lms_db}.sql.gz"
  fi

  {
    echo "backup_slot=$SLOT"
    echo "backup_date=$DATE_TAG"
    echo "backup_hour=$HOUR_TAG"
    echo "timezone=Africa/Nairobi"
    echo ""
    ls -lh "${DEST}/databases" 2>/dev/null || true
    du -sh "$DEST"
  } >"${DEST}/MANIFEST.txt"

  apply_retention
  log "=== Incremental backup finished: $DEST ==="
}

main "$@" 2>&1 | tee -a "${BACKUP_ROOT}/incremental-cron.log"
