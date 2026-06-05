# Application Status Sync and SMS Notifications (Staging)

Guide to keeping application status aligned across the **applicant portal**, **Drupal admin**, and **LMS**, and sending **EBIS Cloud SMS** when status changes.

> **SMS setup runbook:** See [status-change-sms-ebiscloud.md](./status-change-sms-ebiscloud.md) for detailed step-by-step EBIS Cloud SMS configuration and testing.

## Systems and URLs (staging)

| System | URL | Role |
|--------|-----|------|
| Applicant portal | `https://loans-staging.uwezo.go.ke` | Users submit applications; shows status on dashboard |
| Drupal admin (sadmin) | `https://lms-staging-sadmin.uwezo.go.ke` | Source of truth for application entity + REST API |
| LMS | `https://lms-staging.uwezo.go.ke` | Constituency/HQ review workflow |

Drupal is the **hub**: both the portal and LMS sync status through it.

---

## Target behaviour

1. When status changes in **LMS** (approve, reject, HQ batch approve, disburse, etc.), Drupal is updated automatically.
2. When Drupal status changes, **EBIS Cloud SMS** is sent to the applicant (if configured for that status).
3. When the applicant opens the portal dashboard, status is **pulled from Drupal** and matches admin/LMS.

---

## Architecture

```
Applicant Portal (Prisma)          Drupal Admin (application entity)          LMS (temp_applications)
        |                                      |                                      |
        |  POST /api/v1/application            |                                      |
        |------------------------------------->|                                      |
        |                                      |  POST /api/v1/application            |
        |                                      |<-------------------------------------|
        |                                      |                                      |
        |                                      |  PATCH /api/v1/lms/application/{id}  |
        |                                      |<-------------------------------------|
        |                                      |                                      |
        |  GET /api/v1/applications            |  status_manager hook                 |
        |<-------------------------------------|  -> EBIS SMS on status change        |
        |  (updates local Prisma status)       |                                      |
```

---

## Status mapping (LMS → Drupal → Portal display)

| LMS `temp_applications.status` | Drupal `application.status` | Portal (user-facing) |
|--------------------------------|----------------------------|----------------------|
| `under_constituency_review` | `constituency_review` | In Review |
| `under_hq_review` | `approved_by_constituency` | In Review |
| `pending_hq_approval` | `under_review` | In Review |
| `approved` | `approved` | Approved |
| `rejected` | `rejected` | Rejected |
| LMS `in_training` | Drupal `training` | Training |
| `disbursed` | `disbursed` | Disbursed |
| `closed` | `closed` | Closed |

LMS → Drupal sync job: `SyncApplicationStatusToDrupal`  
Drupal → portal pull: `applications-hybrid.ts` on dashboard load

---

## Step 1 — Align API keys and URLs

On the **Loan_Application** server `.env`:

```bash
# Drupal (portal → admin)
EXTERNAL_API_KEY=<drupal-api-key>
API_URL=http://admin                    # internal; nginx serves lms-staging-sadmin.uwezo.go.ke

# LMS (portal → LMS ingest)
LMS_INTERNAL_API_URL=http://uwezo-lms-app:8000
LMS_API_HOST=lms-staging.uwezo.go.ke
LMS_API_KEY=<lms-api-key>

# Cron / sync worker
CRON_SECRET=<secret>
SYNC_INTERVAL_MINUTES=5
```

On the **LMS** `.env` (`lms_app_staging/.env`):

```bash
DRUPAL_API_URL=http://admin             # internal Drupal
DRUPAL_API_KEY=<same-as-drupal-api-key> # must match Drupal api_application.settings api_key
LMS_API_KEY=<lms-api-key>
```

In **Drupal** (`/admin/config/services/api-application` or config sync):

- `api_key` = same value as `EXTERNAL_API_KEY` / `DRUPAL_API_KEY`

Restart stacks after changes:

```bash
cd /home/administrator/Loan_Application && docker compose up -d
cd /home/administrator/lms_app_staging && docker compose up -d
```

---

## Step 2 — Ensure LMS → Drupal sync runs

LMS queues `SyncApplicationStatusToDrupal` whenever status changes (constituency approve/reject, HQ batch approve, etc.).

**Requirements:**

- LMS Horizon/queue worker running (`uwezo-lms-horizon`)
- Redis available
- `lms_to_loan_app_sync_status` set to `pending` on status change (already done in `ApplicationView`, `LoanPhaseService`, etc.)

**Retry failed syncs:**

```bash
docker exec uwezo-lms-app php artisan drupal:sync-pending
```

**Verify in LMS DB:**

```sql
SELECT application_id, status, lms_to_loan_app_sync_status, lms_to_loan_app_sync_error
FROM temp_applications
WHERE application_id = 'APP-XXXXXXXX';
```

**Verify in Drupal:**

```bash
drush sqlq "SELECT application_id, status FROM application_field_data WHERE application_id = 'APP-XXXXXXXX';"
```

---

## Step 3 — Configure EBIS Cloud SMS (status changes)

Status-change SMS is handled by Drupal modules:

- `status_manager` — detects application status changes
- `status_manager_notifications` — sends SMS/email from templates
- `sms_providers` + `ebiscloud_sms` — sends via EBIS Cloud API

### 3a. Environment variables (Drupal admin container)

```bash
EBISCLOUD_SMS_API_KEY=<key>
EBISCLOUD_SMS_API_URL=https://sms.ebisclouderp.com/api/sms/sendsms
EBISCLOUD_SMS_SHORTCODE=Uwezo Fund
EBISCLOUD_SMS_SERVICE_ID=<service-id>
```

These are loaded in `settings.php` as `$settings['ebiscloud_sms']`.

### 3b. Enable EBIS as default SMS provider

Admin UI: **Configuration → SMS Providers → Settings**

- Default provider: **EBIS Cloud SMS** (`ebis`)

Or import config:

```yaml
# admin/config/sync/sms_providers.settings.yml
default_provider: ebis
```

### 3c. Status notification templates

Admin UI: **Configuration → Status Manager → Notification Settings**

Or use synced config in `status_manager_notifications.settings.yml`.

**SMS enabled for:** `approved`, `rejected`, `constituency_review`, `approved_by_constituency`, `under_review`, `training`, `disbursed`

Each status needs:

- `enabled: true`
- `recipient: customer` (applicant) or `admin` (reviewers)
- `sms_message` with tokens: `[application:application_id]`, `[application:loan_amount]`, `[application:rejection_reason]`

Global: `prefer_sms: true`

### 3d. EBIS notification provider (code)

Plugin `ebis` in `status_manager_notifications` delegates to `sms_providers.sms_service` so status SMS uses the same EBIS transport as submission/payment SMS.

After deploy:

```bash
docker exec uwezo-admin-1 drush cr
docker exec uwezo-admin-1 drush cim -y   # if importing config
```

---

## Step 4 — Portal status pull (Drupal → applicant view)

The portal does **not** receive push updates from LMS. It refreshes status when:

- User loads **My Applications** / dashboard
- `getHybridApplications()` calls Drupal `GET /api/v1/applications`
- `syncApplicationDataChanges()` updates Prisma if Drupal status is ahead

**Optional improvement:** the sync-worker now also calls `/api/cron/sync-status-from-drupal` on each interval (see [status-sync-gaps-fix-2026-05-27.md](./status-sync-gaps-fix-2026-05-27.md)).

**Repair stale draft status after sync:**

`repairSyncedApplicationStatuses()` runs on dashboard load and upgrades local status when sync metadata shows completion.

---

## Step 5 — End-to-end test procedure

Use a test application (e.g. `APP-20260526-0DTGK3`).

### 5a. Constituency approve in LMS

1. LMS constituency user approves application.
2. Confirm LMS: `status = under_constituency_review` or `pending_submission_to_hq`.
3. Wait for queue (~seconds) or run `drupal:sync-pending`.
4. Confirm Drupal: `status = constituency_review` or `approved_by_constituency`.
5. Confirm SMS sent (Drupal log: `status_manager_notifications`).
6. Applicant opens portal dashboard → status shows **In Review**.

### 5b. HQ batch approve

1. HQ user uploads **Approved Code List** on phase review page.
2. Clicks **Approve Phase**.
3. Confirm LMS: `status = approved`, phase apps `approved`.
4. Confirm Drupal: `status = approved`.
5. Confirm SMS: *"Good news! Your loan application APP-… has been approved."*
6. Portal dashboard → **Approved**.

### 5c. Reject

1. Reject in LMS (constituency or HQ).
2. Drupal → `rejected` + rejection fields.
3. SMS with rejection reason.
4. Portal → **Rejected**.

---

## Step 6 — Troubleshooting

| Symptom | Check |
|---------|--------|
| LMS status changed, Drupal unchanged | `lms_to_loan_app_sync_status`, `lms_to_loan_app_sync_error`; run `drupal:sync-pending`; verify `DRUPAL_API_KEY` |
| Drupal changed, no SMS | `status_manager.settings` auto_tracking; `providers.sms.enabled`; EBIS env vars; applicant phone on user `field_phone_number` or group member |
| Drupal changed, portal stale | User must reload dashboard; check `externalId` on Prisma row; run sync-worker |
| SMS works for submit, not status | Ensure `default_provider: ebis` and `EbisCloudSmsProvider` plugin enabled; clear Drupal cache |
| `invalid_status_transition` in LMS logs | Drupal entity behind LMS — manually advance Drupal status or fix transition order |

**Logs:**

```bash
# Drupal
docker exec uwezo-admin-1 drush watchdog:show --count=20 --filter=status_manager

# LMS
docker exec uwezo-lms-app tail -50 storage/logs/laravel.log
```

---

## Known gaps (resolved 2026-05-27)

See [status-sync-gaps-fix-2026-05-27.md](./status-sync-gaps-fix-2026-05-27.md) for:

1. Background Drupal→portal status pull via `/api/cron/sync-status-from-drupal`
2. Constituency approve → immediate LMS→Drupal sync
3. Rejection reason normalization + LMS PATCH permissions fix
4. Idempotent same-status LMS→Drupal sync (avoids retry failures when Drupal is already current)

---

## Files reference

| Area | Path |
|------|------|
| LMS → Drupal job | `projects/lms_source_code/uwezo-loan-tracking/app/Jobs/SyncApplicationStatusToDrupal.php` |
| Drupal LMS PATCH | `Loan_Application/admin/.../LmsApplicationUpdateResource.php` |
| Status change hook | `Loan_Application/admin/.../status_manager/status_manager.module` |
| Notification manager | `Loan_Application/admin/.../status_manager_notifications/src/Service/NotificationManager.php` |
| EBIS status SMS plugin | `Loan_Application/admin/.../EbisCloudSmsProvider.php` |
| EBIS transport | `Loan_Application/admin/.../ebiscloud_sms/src/Provider/EbisProvider.php` |
| Portal status pull | `Loan_Application/web/lib/data/applications-hybrid.ts` |
| Portal sync worker | `Loan_Application/web/lib/api/sync.service.ts` |
| Notification config | `Loan_Application/admin/config/sync/status_manager_notifications.settings.yml` |

---

## Deploy checklist

- [ ] API keys aligned across portal, Drupal, LMS
- [ ] LMS Horizon/queue running
- [ ] Sync worker running (`uwezo-sync-worker-1`)
- [x] EBIS env vars set on admin container
- [x] `default_provider: ebis` in SMS settings
- [x] Status notification templates enabled for required statuses
- [x] Admin rebuild + `drush cim -y` + `drush cr` (2026-05-26 — see [staging-changes-2026-05-26.md](./staging-changes-2026-05-26.md))
- [ ] End-to-end test on one application
