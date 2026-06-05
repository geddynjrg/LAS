# Loan Workflow Implementation (2026-05-28)

End-to-end constituency → HQ → secretariat → training → disbursement workflow for loans-staging.

## Summary

| Layer | What changed |
|-------|----------------|
| **LMS-staging** | Attendance upload, HQ auto-assign, secretariat approvals, training gates, certificates, disbursement failure |
| **Drupal admin** | New statuses + transitions + SMS templates |
| **Portal** | Extended status enum + Drupal mapping |

## Workflow stages

```
Submit → Constituency vet
  → Upload minutes PDF + attendance list PDF
  → Submit batch to HQ (auto-assigns HQ officer)

HQ officer
  → Upload approved codelist PDF
  → Approve / reject applications

Head of Secretariat (/secretariat/phases)
  1. post_hq_review — confirm HQ decision (signature)
  2. fund_transfer — authorize constituency → HQ transfer (signature)
  3. training_authorization — allow constituency to schedule training (signature)

Constituency officer
  → Schedule training (min 4 days, venue)
  → Mark training successful → PDF certificate generated
  → Download certificate: /training-certificates/{phaseApplication}

Head of Secretariat
  4. final_disbursement — authorize cheque/disbursement (signature)

Constituency officer
  → Disburse (requires secretariat final + certificate)
  → OR record disbursement failure (e.g. cheque not collected)

Drupal + portal receive status via SyncApplicationStatusToDrupal + status pull cron.
```

## LMS changes

### New database objects

- `secretariat_approvals` — signed authorizations per phase
- `loan_phases.assigned_hq_officer_id` — round-robin on HQ submit
- `loan_phases.training_notes`
- `phase_applications.training_certificate_path`
- `phase_applications.disbursement_failure_reason|notes`
- Extended enums on `temp_applications.status` and `phase_applications.status`

**Migrations:** `2026_05_28_120000_workflow_extensions.php`, `2026_05_28_120001_seed_workflow_roles.php`

### New role

- `head_of_secretariat` — access `/secretariat/phases`

Assign in LMS: Users → role `head_of_secretariat`.

### Key files

| File | Purpose |
|------|---------|
| `app/Services/Loan/SecretariatApprovalService.php` | Approvals, HQ assign, Drupal sync after sign-off |
| `app/Services/Loan/TrainingCertificateService.php` | PDF certificate on successful training |
| `app/Livewire/Secretariat/PhaseReview.php` | Secretariat UI |
| `app/Livewire/ApplicationPhaseDetails.php` | Attendance upload, failure recording |
| `app/Services/Loan/LoanPhaseService.php` | Gates, 4-day training, status fixes |
| `app/Services/Loan/TempApplicationService.php` | Disbursement gates, training completion |
| `app/Jobs/SyncApplicationStatusToDrupal.php` | Extended status mapping |

### Document types (phase)

| Type | Required when |
|------|----------------|
| `minutes` | Before HQ submit |
| `attendance_list` | Before HQ submit |
| `approved_code_list` | Before HQ batch approve |

## Drupal changes

### New statuses (`ApplicationStatusConstants.php`)

- `pending_secretariat_review`
- `pending_fund_transfer`
- `pending_final_disbursement`
- `disbursement_failed`

### Transition graph (excerpt)

```
approved → pending_secretariat_review → pending_fund_transfer → training
training → pending_final_disbursement → disbursed | disbursement_failed
```

### Notifications

Added templates in `config/sync/status_manager_notifications.settings.yml` for `pending_final_disbursement` and `disbursement_failed`.

## Portal changes

- Prisma `ApplicationStatus` enum extended
- Migration: `web/prisma/migrations/20260528120000_workflow_status_extensions/`
- `web/lib/constants/application-status.ts` — API mapping
- `web/lib/data/drupal-status-sync.ts` — display collapse rules

## Deploy

```bash
# LMS
cd /home/administrator/projects/lms_source_code/uwezo-loan-tracking
docker exec uwezo-lms-app php artisan migrate --force
docker compose restart horizon app   # if code not volume-mounted

# Drupal
cd /home/administrator/Loan_Application
docker compose build admin && docker compose up -d admin
docker exec uwezo-admin-1 sh -c 'cd /var/www/html && ./vendor/bin/drush cim -y && ./vendor/bin/drush cr'

# Portal
docker compose build web && docker compose up -d web sync-worker
docker exec uwezo-web-1 sh -c 'cd /app/web && npx prisma migrate deploy'
```

## Verify

1. Constituency phase: upload minutes + attendance → submit to HQ
2. HQ: upload codelist → approve batch
3. Secretariat: complete 4 authorization types at `/secretariat/phases`
4. Constituency: schedule 4+ day training → mark successful → download certificate
5. Secretariat: final disbursement authorization
6. Constituency: disburse or record failure
7. Check Drupal status + applicant SMS for each transition
8. Portal applicant dashboard: download training certificate when available
9. HQ officer login: dashboard and task lists scoped to `assigned_hq_officer_id`
10. Disbursement failure: each group member with a phone receives SMS including failure reason

## Follow-ups implemented (2026-05-28)

### Portal training certificate download

- LMS API: `GET /api/v1/application/{applicationId}/training-certificate` (+ `/status`)
- Portal proxy: `GET /api/applications/{applicationId}/training-certificate`
- UI: download button on applicant dashboard detail page when certificate exists

### Per-member SMS on disbursement failure

- LMS sync sends `rejection_message` (failure notes) to Drupal on `disbursement_failed`
- Drupal `NotificationManager` sends SMS to every group member phone (deduplicated)
- SMS template includes `[application:rejection_message]`

### HQ dashboard filtered by assigned officer

- `ApplicationTasks`, `HqApplicationsList`, and `HqDashboard` auto-filter for `hq_officer` (non super-admin)
- `LoanPhaseService::getDetailedPhasesQuery`, `TempApplicationService::getFilteredQuery`, and `LoanAnalysisService::getDashboardStats` honor `assigned_hq_officer_id`
- `LoanPhase::canBeEditedBy` restricts HQ officers to their assigned phases

## Remaining follow-ups

- Auto-import Drupal config for notification YAML after `drush cim`
