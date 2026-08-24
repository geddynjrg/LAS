# AI / Blockchain / Analytics — Core LAS (loans.uwezo.go.ke)

## Document completeness

- Rule-based checks in `lib/document-completeness.ts`.
- Enforced in `group-data-action.ts` before continue — blocks empty `fid:0` placeholders.
- Required: registration certificate, members-on-certificate list, ≥1 meeting minutes.

## Assistive application guidance

- Step coach: `lib/application-guidance.ts` + `components/application-guidance.tsx`.
- Wired in `app/apply/[id]/layout.tsx` for group-data, members, loan-conditions, proposed-business, member-confirmation, confirmations, review.
- Copy under `ApplicationGuidance` in `messages/en.json` (prepare + common mistakes). Not a chatbot.

## Soft phone / National ID duplicates

- Hard uniqueness remains within one application (`getPhoneConflictInApplication` / national ID checks).
- Soft cross-application check: `lib/soft-duplicate-check.ts` + `POST /api/soft-duplicates`.
- Statuses: `DRAFT`, `UNSUBMITTED`, `GROUP_MEMBER_CONFIRMATION`.
- Returns boolean flags + generic message only (no other member names).
- Banner with acknowledgment on members form; continue allowed after acknowledge.
- Client banner uses a server action (`lib/soft-duplicate-action.ts`) so the check is not rewritten by middleware to Drupal `/api/*`.
- `POST /api/soft-duplicates` is also on the Next internal API allowlist in `middleware.ts`.

## Real-time field guidance

- `lib/field-guidance.ts` + `components/field-guidance.tsx`.
- Focus tips on phone, national ID, group name, and registration fields (members + group-data forms).
- Light / rule-based — no LLM.

## Out of scope here

OCR, hash receipts, officer checklists, and phase aging are implemented in Core LMS staff systems.
