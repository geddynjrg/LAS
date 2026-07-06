#!/usr/bin/env bash
#
# Push selected Uwezo daily backup artifacts to private GitHub repo geddynjrg/uwezo-backups.
#
# NEVER commits: .env files, env-secrets archives, SSL private keys, volume tarballs.
# LMS SQL (~862MB): checksum metadata daily; full dump via GitHub Release on Sundays only.
#
# Called automatically by uwezo-backup.sh after a successful local backup.
#
set -euo pipefail

export TZ=Africa/Nairobi

GIT_NAME="administrator"
GIT_EMAIL="admin@uwezo.go.ke"
BACKUP_ROOT="/home/administrator/backups/uwezo-daily"
REPO_DIR="/home/administrator/uwezo-backups"
REPO="geddynjrg/uwezo-backups"
DATE_TAG="${1:-$(date +%Y-%m-%d)}"
SOURCE="${BACKUP_ROOT}/${DATE_TAG}"
DRY_RUN="${2:-}"
WEEKLY_RELEASES_KEEP=4

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] $*"
}

git_cmd() {
  git -c user.name="$GIT_NAME" -c user.email="$GIT_EMAIL" "$@"
}

if [[ ! -d "$SOURCE" ]]; then
  log "ERROR: backup directory not found: $SOURCE"
  exit 1
fi

if [[ ! -d "$REPO_DIR/.git" ]]; then
  log "ERROR: backup repo not found at $REPO_DIR — run: gh repo clone $REPO $REPO_DIR"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  log "ERROR: gh CLI not authenticated — run: gh auth login"
  exit 1
fi

DEST_REL="daily/${DATE_TAG}"
DEST="${REPO_DIR}/${DEST_REL}"
mkdir -p "$DEST"

log "Syncing backup $DATE_TAG to GitHub ($REPO)"

# --- Small SQL dumps (always safe for git; under 100MB each) ---
for src in \
  "${SOURCE}/databases/portal-drupal.sql.gz" \
  "${SOURCE}/databases/portal-web-prisma.sql.gz" \
  "${SOURCE}/databases/redis-dump.rdb.gz"; do
  if [[ -f "$src" ]]; then
    cp -f "$src" "$DEST/"
  fi
done

# --- LMS SQL metadata daily; full file only via Release on Sundays ---
lms_dump=""
for src in "${SOURCE}"/databases/lms-*.sql.gz; do
  [[ -f "$src" ]] || continue
  lms_dump="$src"
  break
done

if [[ -n "$lms_dump" && "$DRY_RUN" != "--dry-run" ]]; then
  {
    echo "file=$(basename "$lms_dump")"
    echo "size_bytes=$(wc -c <"$lms_dump" | tr -d ' ')"
    echo "sha256=$(sha256sum "$lms_dump" | awk '{print $1}')"
    echo "full_copy_on_github=weekly_release_sunday_only"
    echo "local_path=${lms_dump}"
  } >"${DEST}/lms-db-remote.meta"
fi

# --- Drupal config sync (YAML, no secrets) ---
if [[ -f "${SOURCE}/configs/drupal-config-sync.tar.gz" ]]; then
  cp -f "${SOURCE}/configs/drupal-config-sync.tar.gz" "$DEST/"
fi

# --- Docker compose snapshot (compose/nginx only; no .env) ---
if [[ -f "${SOURCE}/configs/uwezo-configs-and-env.tar.gz" && "$DRY_RUN" != "--dry-run" ]]; then
  tmp="$(mktemp -d)"
  tar xzf "${SOURCE}/configs/uwezo-configs-and-env.tar.gz" -C "$tmp" 2>/dev/null || true
  tar czf "${DEST}/docker-compose-snapshot.tar.gz" -C "$tmp" . 2>/dev/null || true
  rm -rf "$tmp"
fi

# --- Env templates (placeholders only) ---
if [[ "$DRY_RUN" != "--dry-run" ]]; then
  templates_dir="${DEST}/env-templates"
  mkdir -p "$templates_dir"
  for example in \
    /home/administrator/Loan_Application/loans/.env.example \
    /home/administrator/projects/lms_source_code/uwezo-loan-tracking/.env.example; do
    [[ -f "$example" ]] && cp -f "$example" "$templates_dir/"
  done
fi

# --- Manifest + docker state ---
[[ -f "${SOURCE}/MANIFEST.txt" ]] && cp -f "${SOURCE}/MANIFEST.txt" "$DEST/"
for snap in docker-ps-snapshot.txt docker-volumes-snapshot.txt; do
  [[ -f "${SOURCE}/configs/${snap}" ]] && cp -f "${SOURCE}/configs/${snap}" "$DEST/"
done

# --- Retention: 7 daily folders in git (matches local policy) ---
if [[ "$DRY_RUN" != "--dry-run" ]]; then
  mapfile -t daily_dirs < <(find "${REPO_DIR}/daily" -maxdepth 1 -mindepth 1 -type d -name '20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]' 2>/dev/null | sort -r)
  i=0
  for dir in "${daily_dirs[@]}"; do
    i=$((i + 1))
    if (( i > 7 )); then
      log "Removing old GitHub daily folder: $(basename "$dir")"
      rm -rf "$dir"
    fi
  done
fi

if [[ "$DRY_RUN" == "--dry-run" ]]; then
  log "DRY RUN — would commit and push $DEST_REL"
  if [[ -n "$lms_dump" ]]; then
    log "DRY RUN — LMS full dump ($(du -h "$lms_dump" | cut -f1)) would go to Release on Sunday only"
  fi
  exit 0
fi

# --- Git commit + push ---
cd "$REPO_DIR"
git_cmd add -A daily/
if git_cmd diff --cached --quiet; then
  log "No git changes for $DATE_TAG"
else
  git_cmd commit -m "$(cat <<EOF
Daily backup ${DATE_TAG} (EAT)

Portal SQL + Redis + Drupal config + compose snapshot.
LMS SQL: metadata only (full dump via weekly Release on Sundays).
Excludes: .env, env-secrets, SSL, volumes, appearance tarballs.
EOF
)"
  if ! git_cmd push origin HEAD:main; then
    log "ERROR: git push failed — check gh auth (gh auth login) and repo access"
    exit 1
  fi
  log "Pushed $DEST_REL to https://github.com/$REPO"
fi

# --- Weekly LMS Release (Sunday backup date) ---
backup_weekday="$(date -d "$DATE_TAG" +%u 2>/dev/null || date +%u)"
if [[ "$backup_weekday" != "7" || -z "$lms_dump" ]]; then
  if [[ -n "$lms_dump" ]]; then
    log "LMS full dump ($(du -h "$lms_dump" | cut -f1)) stays local until Sunday Release"
  fi
  exit 0
fi

release_tag="backup-${DATE_TAG}"
if gh release view "$release_tag" --repo "$REPO" &>/dev/null; then
  log "Release $release_tag already exists — skipping upload"
else
  log "Uploading LMS dump to GitHub Release $release_tag ($(du -h "$lms_dump" | cut -f1))"
  gh release create "$release_tag" \
    --repo "$REPO" \
    --title "Weekly LMS backup ${DATE_TAG}" \
    --notes "$(cat <<EOF
Weekly off-site copy of the LMS MariaDB dump (EAT Sunday backup).

- File: $(basename "$lms_dump")
- SHA256: $(sha256sum "$lms_dump" | awk '{print $1}')
- Portal/config backups for this date are in \`daily/${DATE_TAG}/\` on \`main\`.

Restore: \`gunzip -c $(basename "$lms_dump") | docker exec -i uwezo-lms-db mariadb -u…\`
EOF
)" \
    "$lms_dump"
  log "Created release https://github.com/$REPO/releases/tag/$release_tag"
fi

# Prune old releases (keep $WEEKLY_RELEASES_KEEP)
mapfile -t tags < <(gh release list --repo "$REPO" --limit 100 --json tagName --jq '.[].tagName' | grep '^backup-' | sort -r)
i=0
for tag in "${tags[@]}"; do
  i=$((i + 1))
  if (( i > WEEKLY_RELEASES_KEEP )); then
    log "Deleting old release $tag"
    gh release delete "$tag" --repo "$REPO" --yes --cleanup-tag 2>/dev/null || true
  fi
done
