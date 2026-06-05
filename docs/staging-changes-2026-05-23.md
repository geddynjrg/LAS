# Loans Staging Changes — 2026-05-23

Summary of changes for upload persistence, repayment UI (Pesaflow stub), post-submission SMS, and application status sync fixes.

## 1. Upload volume and `UPLOAD_DIR`

**Problem:** Uploaded files were stored inside the container filesystem and lost on rebuild. Sync could not read files (`ENOENT`), so LMS received applications without documents.

**Changes:**
- Added Docker named volume `web_uploads` mounted at `/app/web/uploads`
- Set `UPLOAD_DIR=/app/web/uploads` on the `web` service
- Centralized upload path resolution in `getUploadDir()` / `resolveUploadFilePath()`
- Entrypoint creates `/app/web/uploads` on container start

**Deploy note:** After `docker compose up`, existing files from the old container path are not migrated automatically. Re-upload documents for affected applications or copy data into the new volume if backups exist.

## 2. Repay button + Pesaflow infrastructure

**Problem:** No repayment flow after loan approval.

**Changes:**
- Added repay button on **My Applications** cards and the application detail page when status is `APPROVED` or `DISBURSED`
- Modal shows total loan amount (and repayment period on the detail page)
- Stub Pesaflow service ready for `PESAFLOW_API_URL` and `PESAFLOW_API_KEY`

## 3. SMS after loan submission

**Problem:** Members were not notified automatically when an application was submitted from the review step.

**Changes:**
- After successful Drupal sync on submit, the portal calls the existing Drupal `send-sms` API via `sendSubmissionNotificationSMS()`
- SMS failure is logged but does not block navigation to the done page

## 4. Status mismatch (unsubmitted/draft vs LMS synced)

**Root cause:** Saving group data called `updateApplicationStatus(DRAFT)`, which incorrectly:
- Queued the application for Drupal/LMS sync while still a draft
- Could set `applicationProgress` to `7` on non-submit updates

Synced applications therefore appeared in LMS while the portal still showed **Unsubmitted** / **Draft**.

**Changes:**
- New `markApplicationInProgress()` updates draft progress **without** enqueueing sync
- `updateApplicationStatus()` only queues sync for submitted-or-higher statuses
- `processSyncItem()` rejects sync for draft/unsubmitted applications
- `syncApplication()` returns `success: false` when the app is not ready (fixes false-positive submit success)
- `repairSyncedApplicationStatuses()` upgrades stale local records to `SUBMITTED` when sync/LMS metadata shows completion
- Hybrid merge no longer downgrades local status when Drupal returns stale `draft`

---

## Modified files

| File | Change |
|------|--------|
| `Loan_Application/docker-compose.yml` | Upload volume + `UPLOAD_DIR` + Pesaflow env passthrough |
| `Loan_Application/.env` | `UPLOAD_DIR=/app/web/uploads` |
| `Loan_Application/web/scripts/docker-entrypoint.sh` | Create upload directory on startup |
| `Loan_Application/web/lib/constants/upload-dir.ts` | **New** — upload path helpers |
| `Loan_Application/web/lib/constants/sync-status-utils.ts` | **New** — sync/status helpers |
| `Loan_Application/web/lib/payments/pesaflow.types.ts` | **New** — Pesaflow types |
| `Loan_Application/web/lib/payments/pesaflow.service.ts` | **New** — Pesaflow stub service |
| `Loan_Application/web/components/loan-repay-modal.tsx` | **New** — repay modal UI |
| `Loan_Application/web/app/actions/file-upload.ts` | Use centralized upload dir |
| `Loan_Application/web/app/files/[applicationId]/[filename]/route.ts` | Use centralized upload dir |
| `Loan_Application/web/lib/api/sync.service.ts` | Upload path fix, draft sync guard, false-success fix |
| `Loan_Application/web/lib/data/application.ts` | Draft vs submit status logic, status repair |
| `Loan_Application/web/lib/data/applications-hybrid.ts` | Status repair + merge downgrade protection |
| `Loan_Application/web/app/apply/[id]/group-data/group-data-action.ts` | Use `markApplicationInProgress` |
| `Loan_Application/web/lib/api/sms.service.ts` | `sendSubmissionNotificationSMS()` |
| `Loan_Application/web/app/apply/[id]/review/review-footer.tsx` | SMS after successful submit sync |
| `Loan_Application/web/app/dashboard/page.tsx` | Repay button on approved cards |
| `Loan_Application/web/app/dashboard/[id]/page.tsx` | Repay button on detail page |
| `Loan_Application/web/messages/en.json` | Repay modal strings |
| `Loan_Application/web/messages/sw.json` | Repay modal strings (Swahili) |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `UPLOAD_DIR` | Absolute upload path (`/app/web/uploads` in Docker) |
| `PESAFLOW_API_URL` | Pesaflow API base URL (optional, stub until set) |
| `PESAFLOW_API_KEY` | Pesaflow API key (optional, stub until set) |

## Deploy

```bash
cd Loan_Application
docker compose build web
docker compose up -d web
```

Existing applications with completed sync but draft local status are repaired automatically on the next dashboard/admin load via `repairSyncedApplicationStatuses()`.
