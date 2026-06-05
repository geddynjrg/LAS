# Loans Staging Changes — 2026-05-26

Summary of changes for **EBIS Cloud status-change SMS**, **portal TRAINING status**, and the admin deploy run on staging.

**Related runbooks:**

- [status-change-sms-ebiscloud.md](./status-change-sms-ebiscloud.md) — EBIS SMS configuration and testing
- [status-sync-and-sms-2026-05-26.md](./status-sync-and-sms-2026-05-26.md) — cross-system status sync architecture

---

## 1. Status-change SMS via EBIS Cloud (Drupal admin)

**Problem:** Submission and payment SMS used EBIS Cloud, but status-change notifications still routed through a separate Africa's Talking plugin (`default_provider: debug` in config).

**Changes:**

- **New plugin** `EbisCloudSmsProvider` (`id: ebis`) delegates status SMS to `sms_providers.sms_service` — same transport as submission SMS
- **NotificationManager** — improved applicant phone lookup: owner `field_phone_number`, then first group member phone
- **Config** — `default_provider: ebis` in `sms_providers.settings.yml`
- **Templates** — SMS enabled for `constituency_review`, `approved_by_constituency`, `under_review`, `training`, `approved`, `rejected`, `disbursed`
- **Module dependency** — `status_manager_notifications` now depends on `sms_providers`

**Flow:**

```
LMS status change → SyncApplicationStatusToDrupal → Drupal entity save
  → status_manager hook → NotificationManager → EbisCloudSmsProvider → EBIS API
```

Status changes made directly in Drupal admin follow the same path from the hook onward.

---

## 2. TRAINING status on applicant portal

**Problem:** LMS/Drupal can set status `training` after HQ approval, but the portal had no matching enum or UI label.

**Changes:**

- Added `TRAINING` to Prisma `ApplicationStatus` enum + migration
- Mapped Drupal `training` ↔ portal `TRAINING` in `application-status.ts`
- Dashboard progress rank, sync utils, API schemas, and en/sw messages updated

**Deploy note:** Portal migration must be applied separately if not already run:

```bash
cd /home/administrator/Loan_Application/web
npx prisma migrate deploy
```

---

## 3. Modified files

### Drupal admin

| File | Change |
|------|--------|
| `admin/web/modules/custom/status_manager_notifications/src/Plugin/NotificationProvider/Sms/EbisCloudSmsProvider.php` | **New** — EBIS status SMS plugin |
| `admin/web/modules/custom/status_manager_notifications/src/Service/NotificationManager.php` | Phone lookup fallback for group members |
| `admin/web/modules/custom/status_manager_notifications/status_manager_notifications.info.yml` | Dependency on `sms_providers` |
| `admin/config/sync/sms_providers.settings.yml` | `default_provider: ebis` |
| `admin/config/sync/status_manager_notifications.settings.yml` | SMS templates for review/training/disbursed statuses |

### Applicant portal

| File | Change |
|------|--------|
| `web/prisma/schema.prisma` | `TRAINING` enum value |
| `web/prisma/migrations/20260526140000_add_training_status/migration.sql` | **New** — DB migration |
| `web/lib/constants/application-status.ts` | `training` mapping |
| `web/lib/data/applications-hybrid.ts` | Progress rank for TRAINING |
| `web/lib/constants/sync-status-utils.ts` | Sync status handling |
| `web/messages/en.json`, `web/messages/sw.json` | Training label strings |
| Dashboard / API schema files | TRAINING display and validation |

### Documentation

| File | Change |
|------|--------|
| `docs/status-change-sms-ebiscloud.md` | **New** — EBIS SMS runbook |
| `docs/status-sync-and-sms-2026-05-26.md` | **New** — sync + SMS guide |
| `docs/staging-changes-2026-05-26.md` | **New** — this file |

---

## 4. Deploy (admin container) — 2026-05-26

### Commands run

```bash
cd /home/administrator/Loan_Application
docker compose build admin && docker compose up -d admin
docker exec uwezo-admin-1 /var/www/html/vendor/bin/drush cim -y
docker exec uwezo-admin-1 /var/www/html/vendor/bin/drush cr
```

### Results

| Step | Result |
|------|--------|
| `docker compose build admin` | Success (image `uwezo-admin`) |
| `docker compose up -d admin` | Container `uwezo-admin-1` running |
| `drush cim -y` | Success — REST resource config updates only (SMS/notification config already imported on first run) |
| `drush cr` | Success — cache rebuild complete |

**First deploy note:** Initial import also applied `sms_providers.settings` and `status_manager_notifications.settings`. A missing `sendTemplatedMessage()` on `EbisCloudSmsProvider` caused a fatal plugin load error; fixed before the second deploy.

### Post-deploy verification

```bash
# Plugin present in container
docker exec uwezo-admin-1 ls \
  /var/www/html/web/modules/custom/status_manager_notifications/src/Plugin/NotificationProvider/Sms/
# → AfricasTalkingSmsProvider.php, EbisCloudSmsProvider.php

# EBIS provider loads and is configured
docker exec uwezo-admin-1 drush php:eval '
  echo \Drupal::config("sms_providers.settings")->get("default_provider") . "\n";
  $p = \Drupal::service("plugin.manager.notification_provider")->createInstance("ebis");
  echo ($p->isConfigured() ? "ebis ok\n" : "ebis not configured\n");
'
# → ebis
# → ebis ok
```

### Known non-blocking error

Both `drush cim` and `drush cr` may log on shutdown:

```
ReflectionException: ECitizenOAuthController::testStoreSession() does not exist
```

This is a pre-existing broken route reference in `api_auth` and does **not** block config import or cache rebuild. Fix separately by removing or implementing the missing controller method.

---

## 5. Deploy checklist (staging)

- [x] `EBISCLOUD_SMS_*` env vars present on admin container
- [x] `default_provider: ebis` in SMS settings
- [x] Status notification SMS templates enabled for required statuses
- [x] `EbisCloudSmsProvider` deployed in admin image
- [x] `drush cim -y` and `drush cr` completed
- [x] EBIS plugin loads (`createInstance('ebis')` → configured)
- [ ] End-to-end SMS test (change status → applicant receives SMS)
- [ ] Portal `TRAINING` migration applied (`prisma migrate deploy`) if not already done
- [ ] Fix `ECitizenOAuthController::testStoreSession()` route reference

---

## 6. End-to-end test (recommended)

1. Pick a test application with a valid applicant phone on the Drupal user or group member record.
2. Change status in Drupal admin to an SMS-enabled status (e.g. **Approved**) or approve via LMS HQ batch flow.
3. Confirm SMS delivery and check logs:

```bash
docker exec uwezo-admin-1 drush watchdog:show --count=10 --filter=status_manager_notifications
docker exec uwezo-admin-1 drush watchdog:show --count=10 --filter=ebiscloud_sms
```

For LMS-originated changes, ensure sync completed first:

```bash
docker exec uwezo-lms-app php artisan drupal:sync-pending
```
