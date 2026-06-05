# Submission Success SMS — May 2026

Summary of changes that add a dedicated **submission success SMS** sent to all group members after a loan application is successfully submitted and synced to Drupal.

Previously, `sendSubmissionNotificationSMS()` incorrectly reused the **member confirmation** SMS flow (confirmation link). This change introduces a separate trigger, message template, and backend handler.

---

## Behaviour

After the applicant submits on the review page:

1. Application status is set to `SUBMITTED`
2. Application is synced to Drupal
3. **Submission success SMS** is sent to **every group member with a phone number**
4. Navigation to the done page proceeds even if SMS fails (non-blocking)

### Message content

Default SMS (when no custom template is configured):

> Hello {member name}, your group ({group name}) loan application {APP-ID} has been submitted successfully and is now under review.

Custom templates can be configured in Drupal admin under **Application Settings → SMS Confirmation Settings**.

**Available tokens:**

| Token | Replaced with |
|-------|----------------|
| `[member:name]` | Member full name |
| `[application:id]` | Public application ID (e.g. `APP-20260525-3MLREI`) |
| `[application:group_name]` | Group name from application data |

### Distinction from confirmation SMS

| | Member confirmation SMS | Submission success SMS |
|--|-------------------------|------------------------|
| **Trigger** | `member_confirmation` | `submission_success` |
| **When** | During member consent step | After final submit + sync |
| **Recipients** | Members pending confirmation only | All members with phone numbers |
| **Content** | Link to confirm participation | Submission acknowledgement |

---

## API

**Endpoint:** `POST /api/v1/application/{applicationId}/send-sms`

**Request body:**

```json
{
  "trigger": "submission_success",
  "timestamp": "2026-05-23T12:00:00.000Z"
}
```

**Response (example):**

```json
{
  "success": true,
  "message": "Submission success SMS sent to all group members.",
  "data": {
    "application_id": "APP-20260525-3MLREI",
    "trigger": "submission_success",
    "sms_sent": 5,
    "sms_failed": 0,
    "total_attempted": 5,
    "status_type": "success",
    "timestamp": "2026-05-23T12:00:01+00:00"
  }
}
```

Rate limiting is **2 minutes per application per trigger type** (confirmation and submission success are tracked separately).

---

## Files changed

| File | Change |
|------|--------|
| `admin/web/modules/custom/api_application/src/Service/WebSmsConfirmationService.php` | Added `sendSubmissionSuccessSmsToAllMembers()`, message builder, SMS success helper |
| `admin/web/modules/custom/api_application/src/Plugin/rest/resource/ApplicationSmsResource.php` | Route by `trigger`; separate rate limits and response messages |
| `admin/web/modules/custom/api_application/src/Form/ApplicationSettingsForm.php` | Admin toggles and template for submission success SMS |
| `admin/web/modules/custom/api_application/config/schema/api_application.schema.yml` | Config schema for new settings |
| `admin/web/modules/custom/api_application/config/install/api_application.settings.yml` | Default install values |
| `admin/web/modules/custom/api_application/api_application.install` | Update hook `11023` for existing environments |
| `web/lib/api/sms.service.ts` | `sendSubmissionNotificationSMS()` uses `submission_success` trigger |
| `web/app/apply/[id]/review/review-footer.tsx` | Unchanged call site (already invokes `sendSubmissionNotificationSMS` after sync) |

---

## Admin configuration

Path: **loans-staging-admin → Application Settings → SMS Confirmation Settings**

| Setting | Default | Description |
|---------|---------|-------------|
| Enable Submission Success SMS | `true` | Master toggle for post-submit notifications |
| Submission Success SMS Message Template | (empty) | Optional custom template; empty uses built-in default |

---

## Deployment

After deploying code to staging:

```bash
# Run Drupal update hook (inside admin container)
drush updatedb -y
drush cr
```

Rebuild/restart the web container if the Next.js app is containerised:

```bash
docker compose -f Loan_Application/docker-compose.yml up -d --build web
```

---

## Verification

1. Submit a test application on `loans-staging.uwezo.go.ke`
2. Check Drupal watchdog logs (`api_application`) for:
   - `Sending submission success SMS to N members`
   - `Submission success SMS sent to {name}`
3. Confirm members receive the acknowledgement SMS (not a confirmation link)
4. Optional: inspect `POST /api/v1/application/{id}/send-sms` with `"trigger": "submission_success"` in network tab

---

## Notes

- SMS delivery uses the configured SMS provider (Ebis on staging).
- If submission success SMS is disabled in admin, the API returns `status_type: disabled` with `sms_sent: 0` and does not block submission.
- Members without phone numbers are skipped (not counted as failures).
