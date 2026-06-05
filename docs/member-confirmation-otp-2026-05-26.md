# Member Confirmation OTP Flow (2026-05-26)

Guide to the **6-digit OTP** member confirmation flow on the applicant portal, and how to revert to the previous link-based SMS flow if needed.

**Page:** `/apply/[id]/member-confirmation` on [loans-staging.uwezo.go.ke](https://loans-staging.uwezo.go.ke)

---

## Current behaviour (OTP flow)

1. Applicant opens **Member Confirmation** (step 5).
2. For each member who still needs to respond:
   - Click **Send OTP** (styled like Back/Next action bar buttons — `Button variant="secondary"`).
   - Member receives a **6-digit code** via EBIS Cloud SMS.
   - Applicant (or member dictating the code) enters the OTP in the field beside the button.
3. When **6 digits** are entered, the code is **verified automatically** (no separate submit).
4. On success, member status becomes **Consented ✓** (`confirmation_status: confirmed`).
5. **Next** is enabled when **≥ 75% of listed members have responded** (confirmed or declined).
6. Applicant proceeds to **Confirmations** (step 6).

### Threshold

| Rule | Value |
|------|--------|
| Minimum responses to enable Next | `ceil(totalMembers × 0.75)` |
| Counts as responded | `confirmed` or `declined` (not `pending` or `sent`) |

Previous behaviour required **both** 75% responded **and** 75% consented. OTP flow gates **Next** on responses only (OTP verify marks member as confirmed).

---

## Architecture

```
Portal member-confirmation page
  │
  ├─ Send OTP  →  POST /api/v1/application/{id}/member-confirmation/otp  { action: send, national_id_code }
  │                    → WebSmsConfirmationService::sendConfirmationOtpToMember()
  │                    → 6-digit code in Drupal cache (10 min) + EBIS SMS
  │
  └─ Verify OTP (auto on 6 digits)
         →  POST .../member-confirmation/otp  { action: verify, national_id_code, otp_code }
         → WebSmsConfirmationService::verifyConfirmationOtp()
         → member_data.confirmation_status = confirmed
         → Prisma memberData updated locally
```

---

## Files changed

### Drupal admin

| File | Change |
|------|--------|
| `admin/.../WebSmsConfirmationService.php` | `sendConfirmationOtpToMember()`, `verifyConfirmationOtp()` |
| `admin/.../MemberConfirmationOtpResource.php` | **New** REST resource |
| `admin/config/sync/rest.resource.member_confirmation_otp.yml` | **New** REST config |
| `admin/.../api_application.services.yml` | Register REST plugin |

### Applicant portal

| File | Change |
|------|--------|
| `web/lib/api/member-confirmation-otp.service.ts` | **New** — API client |
| `web/app/apply/[id]/member-confirmation/actions.ts` | `sendMemberOtp`, `verifyMemberOtp` (+ Prisma sync) |
| `web/app/apply/[id]/member-confirmation/member-confirmation-form.tsx` | Per-member Send OTP + OTP input UI; Next gated on 75% responses |
| `web/app/apply/[id]/member-confirmation/page.tsx` | Header threshold based on responses |

---

## Deploy

```bash
cd /home/administrator/Loan_Application
docker compose build admin web
docker compose up -d admin web
docker exec uwezo-admin-1 /var/www/html/vendor/bin/drush cim -y
docker exec uwezo-admin-1 /var/www/html/vendor/bin/drush cr
```

### Route registration prerequisite (2026-05-26)

If `POST /api/v1/application/{id}/member-confirmation/otp` returns **404**, Drupal route rebuild may be failing due to stale `api_auth` test routes referencing removed controller methods.

**Fix applied:** removed dead routes from `admin/web/modules/custom/common/api_auth/api_auth.routing.yml`:

- `api_auth.ecitizen.test_store` → `ECitizenOAuthController::testStoreSession`
- `api_auth.ecitizen.test_retrive_store` → `ECitizenOAuthController::testRetriveStoreSession`
- `api_auth.ecitizen_store_pkce` → `ECitizenOAuthController::storePkce`

After redeploying `admin`, `drush cr` must succeed and `rest.member_confirmation_otp.POST` should appear in the route list.

### REST permission (403 Access denied)

If Send OTP returns **"Access denied. You do not have permission to access this resource"**, the JWT is valid but the authenticated role is missing:

- `restful post member_confirmation_otp`

Grant via config import (`user.role.authenticated.yml`) or:

```bash
docker exec uwezo-admin-1 /var/www/html/vendor/bin/drush php:eval "
\$role = \Drupal\user\Entity\Role::load('authenticated');
\$role->grantPermission('restful post member_confirmation_otp');
\$role->grantPermission('restful post application_sms');
\$role->save();
echo 'permissions granted';
"
docker exec uwezo-admin-1 /var/www/html/vendor/bin/drush cr
```

---

## Revert to link-based SMS flow (previous behaviour)

If you need the old page back:

### 1. Portal UI (`member-confirmation-form.tsx`)

- Remove per-member **Send OTP** buttons and OTP input fields.
- Restore primary **Send to members** bulk SMS section (not inside `<details>`).
- Restore Next gate:

```tsx
const canProceed = hasEnoughResponses && hasEnoughConsents;
```

- Restore `onValueChange`-free constituency-style handlers if reintroducing searchable fields elsewhere.

### 2. Optional — disable OTP API

- Set `rest.resource.member_confirmation_otp.yml` `status: false` and `drush cim -y && drush cr`,  
  **or** leave endpoint enabled (harmless if UI not calling it).

### 3. Keep legacy bulk SMS

The OTP release still includes a collapsible **Legacy link-based SMS** section that calls `sendMemberConfirmations()` → existing `member_confirmation` SMS with `/confirm/{token}` links.

To fully remove OTP-only UX while keeping link SMS as primary:

1. Delete OTP UI block in `member-confirmation-form.tsx` (member row Send OTP + input).
2. Move legacy `<details>` content back to main visible **Send to members** panel.
3. Redeploy `web` container.

### 4. Previous dual-threshold logic

```tsx
const minRequiredConsents = Math.ceil(totalMembers * 0.75);
const hasEnoughConsents = confirmedCount >= minRequiredConsents;
const canProceed = hasEnoughResponses && hasEnoughConsents;
```

---

## Testing checklist

- [ ] EBIS SMS env vars set on admin container
- [ ] Member has valid `phoneNumber` on application
- [ ] **Send OTP** delivers 6-digit SMS
- [ ] Wrong OTP shows error; correct OTP marks member confirmed
- [ ] Next disabled until 75% responded; enabled after threshold
- [ ] **Refresh Status** still updates from Prisma/Drupal
- [ ] Legacy link SMS (optional panel) still works if needed

---

## OTP settings (code defaults)

| Setting | Value |
|---------|--------|
| OTP length | 6 digits |
| OTP expiry | 10 minutes (600s) |
| Max verify attempts | 5 per OTP |
| Resend cooldown (UI) | 120 seconds per member |

SMS template (code): `Hello {name}, your Uwezo Fund member confirmation code is: {code}. Valid for 10 minutes.`
