# Status-Change SMS via EBIS Cloud (Uwezo Fund)

Step-by-step guide to send SMS automatically when a loan application status changes.

**Related:** For cross-system status sync (portal ↔ Drupal ↔ LMS), see [status-sync-and-sms-2026-05-26.md](./status-sync-and-sms-2026-05-26.md).

---

## Overview

When an application **status changes in Drupal**, the system:

1. Records the change (`status_manager`)
2. Looks up the notification template for the new status (`status_manager_notifications`)
3. Sends SMS to the applicant via **EBIS Cloud** (`sms_providers` → `ebiscloud_sms`)

This uses the **same EBIS transport** as submission-success and payment-success SMS.

```
LMS status change
       │
       ▼
SyncApplicationStatusToDrupal (queue job)
       │
       ▼
PATCH /api/v1/lms/application/{APP-ID}  →  Drupal saves application entity
       │
       ▼
status_manager_application_update() hook
       │
       ▼
NotificationManager::sendNotifications()
       │
       ▼
EbisCloudSmsProvider  →  SmsService  →  EbisProvider
       │
       ▼
POST https://sms.ebisclouderp.com/api/sms/sendsms
```

Status changes made **directly in Drupal admin** (manual edit, constituency reviewer) follow the same SMS path from the hook onward.

---

## Prerequisites

- Drupal admin running (`lms-staging-sadmin.uwezo.go.ke`)
- Modules enabled: `status_manager`, `status_manager_notifications`, `sms_providers`, `ebiscloud_sms`, `api_application`
- Valid EBIS Cloud account with SMS credits
- Applicant phone stored on Drupal user (`field_phone_number`) or on a group member record

---

## Step 1 — Set EBIS Cloud credentials

Add to the **Drupal admin** environment (`.env` or docker-compose for the `admin` service):

```bash
EBISCLOUD_SMS_API_KEY=<your-ebis-api-key>
EBISCLOUD_SMS_API_URL=https://sms.ebisclouderp.com/api/sms/sendsms
EBISCLOUD_SMS_SHORTCODE=Uwezo Fund
EBISCLOUD_SMS_SERVICE_ID=<service-id>    # use 0 if not assigned
```

These are read in `admin/web/sites/default/settings.php` into `$settings['ebiscloud_sms']`.

Restart the admin container:

```bash
cd /home/administrator/Loan_Application
docker compose up -d admin
```

**Verify EBIS is configured:**

```bash
docker exec uwezo-admin-1 drush php:eval "
  \$s = \\Drupal::service('sms_providers.sms_service');
  echo \$s->isConfigured() ? 'EBIS configured OK' : 'EBIS NOT configured';
"
```

---

## Step 2 — Set EBIS as the default SMS provider

**Admin UI:** `/admin/config/sms_providers/settings`  
Set **Default provider** to **EBIS Cloud SMS** (`ebis`).

**Or** import config (already in repo):

```yaml
# admin/config/sync/sms_providers.settings.yml
default_provider: ebis
```

Apply:

```bash
docker exec uwezo-admin-1 drush cim -y
docker exec uwezo-admin-1 drush cr
```

> **Important:** Status notifications resolve the provider ID from `sms_providers.settings.default_provider`. It must be `ebis`, not `debug` or `africastalking_sms`.

---

## Step 3 — Enable status tracking

**Admin UI:** `/admin/config/status-manager/settings`

Ensure **Auto tracking enabled** is checked (`status_manager.settings`: `general.auto_tracking_enabled: true`).

This activates `status_manager_application_update()` in `status_manager.module`, which fires notifications when `application.status` changes.

---

## Step 4 — Configure SMS templates per status

**Admin UI:** `/admin/config/status-manager/notifications`  
**Config file:** `admin/config/sync/status_manager_notifications.settings.yml`

For each status that should trigger SMS:

| Setting | Value |
|---------|--------|
| `enabled` | `true` |
| `recipient` | `customer` (applicant) or `admin` (reviewers) |
| `sms_message` | Template text with tokens |

**Global:**

```yaml
global:
  prefer_sms: true    # try SMS before email

providers:
  sms:
    enabled: true
```

### Statuses with SMS enabled (staging config)

| Drupal status | Recipient | Example SMS |
|---------------|-----------|-------------|
| `constituency_review` | customer | Your application APP-… is under review. |
| `approved_by_constituency` | customer | …has passed constituency review. |
| `under_review` | customer | …is now under HQ review. |
| `approved` | customer | Good news! …has been approved. |
| `rejected` | customer | …update. Reason: [rejection reason] |
| `training` | customer | …has been approved for training. |
| `disbursed` | customer | …has been disbursed. |
| `unassigned` | admin (reviewer role) | New application … needs review |

Statuses with SMS **disabled** by default: `draft`, `submitted`, `group_member_confirmation`, `closed`.

Apply config:

```bash
docker exec uwezo-admin-1 drush cim -y
docker exec uwezo-admin-1 drush cr
```

### Available message tokens

| Token | Example value |
|-------|----------------|
| `[application:application_id]` | `APP-20260526-0DTGK3` |
| `[application:group_name]` | Group name |
| `[application:loan_amount]` | Loan amount |
| `[application:rejection_reason]` | Rejection reason label |
| `[application:rejection_message]` | Rejection details |
| `[application:url]` | Link to application in admin |

---

## Step 5 — Ensure applicant phone numbers exist

SMS is sent to the **customer** recipient phone. The system resolves it in this order:

1. Application owner's `field_phone_number` (Drupal user account)
2. First group member's `phone_number` on the application

If neither exists, notification falls back to **email** (if configured) or fails silently with a log entry.

**Check phone for an application:**

```bash
docker exec uwezo-admin-1 drush sqlq "
  SELECT a.application_id, u.mail, fp.field_phone_number_value
  FROM application_field_data a
  JOIN users_field_data u ON a.uid = u.uid
  LEFT JOIN user__field_phone_number fp ON u.uid = fp.entity_id
  WHERE a.application_id = 'APP-XXXXXXXX';
"
```

---

## Step 6 — Ensure LMS changes reach Drupal (triggers SMS)

SMS on status change only fires when **Drupal's** application entity is updated. LMS changes arrive via:

```
LMS  →  PATCH /api/v1/lms/application/{id}  →  Drupal entity save  →  SMS
```

**Requirements:**

- LMS Horizon queue running (`uwezo-lms-horizon`)
- `DRUPAL_API_KEY` in LMS `.env` matches Drupal `api_key`
- `lms_to_loan_app_sync_status = pending` after each LMS status change

**Retry failed syncs:**

```bash
docker exec uwezo-lms-app php artisan drupal:sync-pending
```

**Confirm Drupal received the update:**

```bash
docker exec uwezo-admin-1 drush sqlq "
  SELECT application_id, status FROM application_field_data
  WHERE application_id = 'APP-XXXXXXXX';
"
```

---

## Step 7 — Deploy the EBIS notification bridge (code)

Status-change SMS previously used a separate Africa's Talking plugin. The **`EbisCloudSmsProvider`** plugin (`id: ebis`) routes status notifications through the shared `sms_providers` EBIS transport.

**File:** `admin/web/modules/custom/status_manager_notifications/src/Plugin/NotificationProvider/Sms/EbisCloudSmsProvider.php`

After deploying code:

```bash
docker exec uwezo-admin-1 drush cr
```

---

## Step 8 — Test end-to-end

### Test A — Manual status change in Drupal admin

1. Log in to `https://lms-staging-sadmin.uwezo.go.ke`
2. Open an application with a valid applicant phone number
3. Change status to **Approved** (or another SMS-enabled status)
4. Save

**Expected:** Applicant receives SMS within seconds.

**Check logs:**

```bash
docker exec uwezo-admin-1 drush watchdog:show --count=10 --filter=status_manager_notifications
docker exec uwezo-admin-1 drush watchdog:show --count=10 --filter=ebiscloud_sms
```

### Test B — Status change from LMS

1. Approve or reject an application in LMS (`https://lms-staging.uwezo.go.ke`)
2. Wait for queue processing (or run `drupal:sync-pending`)
3. Confirm Drupal status updated
4. Confirm SMS sent to applicant

### Test C — HQ batch approve

1. HQ approves a phase (Approve Phase after code list upload)
2. All applications in batch → Drupal `approved`
3. Each applicant with a phone number receives the approved SMS template

---

## Step 9 — Troubleshooting

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| No SMS at all | EBIS env vars missing | Set `EBISCLOUD_SMS_*`, restart admin |
| Submit SMS works, status SMS doesn't | `default_provider` is `debug` | Set to `ebis`, `drush cr` |
| Drupal updated, no SMS | Status not enabled in notification config | Enable `sms_message` for that status |
| Notification sent, no SMS | No phone on user/member | Add `field_phone_number` to applicant user |
| SMS fails with API error | Invalid key, no credits, bad number | Check `ebiscloud_sms` watchdog logs |
| LMS change, no SMS | Drupal never updated | Fix `SyncApplicationStatusToDrupal`; run `drupal:sync-pending` |
| Email sent instead of SMS | `prefer_sms: false` or no phone | Set `prefer_sms: true`; add phone number |

**View recent notification attempts:**

```bash
docker exec uwezo-admin-1 drush watchdog:show --severity=Error --count=20
docker exec uwezo-admin-1 drush sqlq "
  SELECT id, old_status, new_status, notification_status, created
  FROM status_change ORDER BY created DESC LIMIT 10;
"
```

**Send a test SMS directly (bypasses status flow):**

Use **Configuration → SMS Providers → Test SMS** at `/admin/config/sms_providers/test` (if enabled) to confirm EBIS credentials work independently of status notifications.

---

## Deploy checklist

- [x] `EBISCLOUD_SMS_API_KEY`, `EBISCLOUD_SMS_SHORTCODE`, `EBISCLOUD_SMS_SERVICE_ID` set on admin container
- [x] `default_provider: ebis` in SMS settings
- [x] `general.auto_tracking_enabled: true` in status manager
- [x] `global.prefer_sms: true` and `providers.sms.enabled: true`
- [x] SMS templates enabled for required statuses in `status_manager_notifications.settings.yml`
- [x] `EbisCloudSmsProvider` deployed and cache cleared (2026-05-26 — [staging-changes-2026-05-26.md](./staging-changes-2026-05-26.md))
- [ ] LMS → Drupal sync working (`DRUPAL_API_KEY` aligned)
- [ ] Test application has applicant phone number
- [ ] End-to-end test: status change → SMS received

---

## Key files

| Component | Path |
|-----------|------|
| Status change hook | `admin/web/modules/custom/status_manager/status_manager.module` |
| Notification orchestration | `admin/web/modules/custom/status_manager_notifications/src/Service/NotificationManager.php` |
| EBIS status SMS plugin | `admin/web/modules/custom/status_manager_notifications/src/Plugin/NotificationProvider/Sms/EbisCloudSmsProvider.php` |
| EBIS HTTP transport | `admin/web/modules/custom/ebiscloud_sms/src/Provider/EbisProvider.php` |
| Unified SMS service | `admin/web/modules/custom/sms_providers/src/Service/SmsService.php` |
| Notification templates | `admin/config/sync/status_manager_notifications.settings.yml` |
| SMS provider config | `admin/config/sync/sms_providers.settings.yml` |
| EBIS settings loader | `admin/web/sites/default/settings.php` |
| LMS → Drupal sync | `projects/lms_source_code/uwezo-loan-tracking/app/Jobs/SyncApplicationStatusToDrupal.php` |
| Drupal LMS PATCH endpoint | `admin/web/modules/custom/api_application/src/Plugin/rest/resource/LmsApplicationUpdateResource.php` |
