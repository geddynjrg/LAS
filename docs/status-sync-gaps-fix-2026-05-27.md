# Status Sync Gap Fixes (2026-05-27)

Fixes three known gaps in the portal ↔ Drupal ↔ LMS status workflow, verified against `APP-20260527-V7T6SO`.

## Problems fixed

| Gap | Root cause | Fix |
|-----|------------|-----|
| Portal status lagged until dashboard reload | Status pull only ran inside `getHybridApplications()` on page load | Background cron `/api/cron/sync-status-from-drupal` + sync-worker calls it every interval |
| Constituency approve did not update Drupal | `submitApproval()` never queued `SyncApplicationStatusToDrupal` | Dispatch sync after constituency recommendation; map `pending_submission_to_hq` → `approved_by_constituency` |
| LMS rejection sync could fail | Invalid reason keys (`unspecified`, free text) + REST auth blocked LMS PATCH | Normalize reasons to Drupal allowed list; grant anonymous `restful patch/post lms_application_update` |
| LMS retry fails when Drupal already has status | Same-status PATCH rejected as invalid transition | Idempotent handling in `LmsApplicationUpdateResource` (PATCH + batch POST return 200 success) |
| Portal `syncStatus` stuck at PENDING after successful sync | Form step saves set `syncStatus=PENDING` without enqueueing | Removed spurious PENDING from draft saves; `repairStaleOutboundSyncStatus()` in sync cron |

## Architecture after fix

```
LMS status change
  → SyncApplicationStatusToDrupal (phase-aware mapping + normalized rejection)
  → PATCH /api/v1/lms/application/{id}  (X-API-Key; Drupal REST uses cookie auth provider + anonymous permission)

sync-worker (every N minutes)
  → POST /api/cron/sync-applications        (portal → Drupal → LMS queue)
  → POST /api/cron/sync-status-from-drupal  (Drupal → portal Prisma status; route whitelisted in middleware)
```

## Code changes

### Portal (`Loan_Application/web`)

| File | Change |
|------|--------|
| `lib/data/drupal-status-sync.ts` | Shared Drupal→portal status pull logic |
| `app/api/cron/sync-status-from-drupal/route.ts` | Cron endpoint for background status pull |
| `lib/data/applications-hybrid.ts` | Reuses shared status sync helpers |
| `middleware.ts` | Whitelist `/api/cron/sync-status-from-drupal` (and taxonomy cron) so requests are not rewritten to Drupal |
| `lib/data/application.ts` | Stop setting `syncStatus=PENDING` on intermediate form saves (only queue on submit) |
| `lib/api/sync.service.ts` | `repairStaleOutboundSyncStatus()` clears PENDING when `externalId` exists and queue is idle |
| `scripts/sync-applications-cron.sh` | Calls status pull after queue processing |

### Drupal (`Loan_Application/admin`)

| File | Change |
|------|--------|
| `src/ApplicationRejectionReasons.php` | Normalizes LMS rejection keys to allowed list |
| `src/Plugin/rest/resource/LmsApplicationUpdateResource.php` | Uses normalizer; idempotent same-status PATCH/batch; message-only required on reject |
| `config/sync/user.role.anonymous.yml` | `restful patch/post lms_application_update` for API-key LMS calls |
| `config/sync/rest.resource.lms_application_update.yml` | REST auth `cookie` (Drupal requires a provider; resource validates `X-API-Key`) |
| `config/sync/rest.resource.application_detail.yml` | REST auth `cookie` — enables cron fetch by API key |

### LMS (`projects/lms_source_code/uwezo-loan-tracking`)

| File | Change |
|------|--------|
| `app/Jobs/SyncApplicationStatusToDrupal.php` | Phase-aware Drupal status; rejection normalization |
| `app/Livewire/ApplicationView.php` | Constituency approve queues Drupal sync |

## Status mapping (phase-aware)

| LMS phase app status | LMS temp status (typical) | Drupal status |
|---------------------|---------------------------|---------------|
| `pending` | `under_constituency_review` | `constituency_review` |
| `pending_submission_to_hq` | `under_constituency_review` | `approved_by_constituency` |
| `pending_hq_approval` | `under_hq_review` | `under_review` |
| `approved` | `approved` | `approved` |
| `rejected` | `rejected` | `rejected` |
| `in_training` | `under_hq_review` / `in_training` | `training` |

## Rejection reason keys (Drupal + LMS aligned)

- `incomplete_information`
- `missing_documents`
- `eligibility_criteria`
- `duplicate_application`
- `insufficient_collateral`
- `poor_credit_history`
- `member_declined`
- `other` (fallback for unknown/legacy values)

## Deploy

```bash
# Portal
cd /home/administrator/Loan_Application
docker compose build web
docker compose up -d web sync-worker

# Drupal config + custom module (rebuild required for PHP changes)
docker compose build admin
docker compose up -d admin
docker exec uwezo-admin-1 sh -c 'cd /var/www/html && ./vendor/bin/drush cim -y && ./vendor/bin/drush cr'

# LMS (if not mounted live)
cd /home/administrator/lms_app_staging
docker compose restart horizon app
```

## Verify `APP-20260527-V7T6SO`

```bash
# Portal DB
docker exec uwezo-db-1 sh -c 'mariadb -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" web -e \
  "SELECT applicationId, status, syncStatus, lmsSyncStatus FROM applications WHERE applicationId='\''APP-20260527-V7T6SO'\'';"'

# Drupal
docker exec uwezo-admin-1 sh -c 'cd /var/www/html && ./vendor/bin/drush sqlq \
  "SELECT application_id, status FROM application WHERE application_id = '\''APP-20260527-V7T6SO'\'';"'

# LMS
docker exec uwezo-lms-app php artisan tinker --execute="
  \$a = App\Models\TempApplication::where('application_id','APP-20260527-V7T6SO')->first(['status','lms_to_loan_app_sync_status','lms_to_loan_app_sync_error']);
  echo json_encode(\$a);
"

# Retry failed LMS → Drupal sync
docker exec uwezo-lms-app php artisan drupal:sync-pending

# Manual status pull
docker exec uwezo-web-1 wget -qO- --header="Authorization: Bearer $CRON_SECRET" \
  --post-data="" http://127.0.0.1:3000/api/cron/sync-status-from-drupal
```

Expected after LMS ingest + successful sync (verified 2026-05-28):

- LMS: `under_constituency_review`, `lms_to_loan_app_sync_status = completed`
- Drupal: `constituency_review`
- Portal: `IN_REVIEW` (mapped from constituency-level Drupal statuses)

If LMS sync previously failed with `invalid_status_transition from X to X`, reset and retry:

```bash
docker exec uwezo-lms-app php artisan tinker --execute="
  App\Models\TempApplication::where('application_id','APP-20260527-V7T6SO')
    ->update(['lms_to_loan_app_sync_status' => 'pending', 'lms_to_loan_app_sync_error' => null]);
"
docker exec uwezo-lms-app php artisan drupal:sync-pending
```

After constituency recommends approval:

- LMS phase app: `pending_submission_to_hq`
- Drupal: `approved_by_constituency`
- Portal: `IN_REVIEW`

## Related docs

- [status-sync-and-sms-2026-05-26.md](./status-sync-and-sms-2026-05-26.md)
- [fix-lms-application-sync.md](./fix-lms-application-sync.md)
