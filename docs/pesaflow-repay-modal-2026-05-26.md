# Pesaflow Repay Modal — Dashboard (2026-05-26)

Changes to the **Repay loan** flow on the applicant dashboard and application detail pages.

**Pages:** `/dashboard`, `/dashboard/[id]`

---

## When does “Repay loan” appear?

The button is rendered when **all** of the following are true:

| Condition | Value |
|-----------|--------|
| Application status | `APPROVED` **or** `DISBURSED` |
| Loan amount | Present (`loanConditions.loanAmount > 0`) |
| Pesaflow env | Configured (`PESAFLOW_*` credentials set) — otherwise modal shows “coming soon” |

**Code locations:**

- Dashboard list cards: `web/app/dashboard/page.tsx` (application card footer)
- Application detail: `web/app/dashboard/[id]/page.tsx`

The button does **not** appear for submitted, in-review, rejected, training-only, or unsubmitted applications.

---

## New behaviour (modal + iframe)

1. User clicks **Repay loan** → modal opens (same page, no new tab).
2. User enters **amount to pay** (defaults to outstanding balance; cannot exceed it).
3. Portal generates a unique **`billRefNumber`** invoice reference (e.g. `WF-1776080540619-ABC12XYZ`).
4. Server POSTs checkout payload to Pesaflow `iframev2.1.php` with `format=json`.
5. Pesaflow returns JSON, for example:

```json
{
  "invoice_number": "WDJYNB",
  "invoice_link": "https://test.pesaflow.com/checkout?request_id=...",
  "commission": "50.00",
  "amount_net": "100000.00",
  "amount_expected": "100050.00"
}
```

6. Modal switches to **checkout step** and embeds `invoice_link` in an **iframe** (no redirect to Pesaflow in a new window/tab).
7. If `invoice_link` is missing, fallback POSTs to Pesaflow **targeting the iframe** (still inside the modal).
8. **No automatic M-Pesa STK push** — `sendSTK` is omitted unless `PESAFLOW_SEND_STK=true`.

---

## Configuration

| Variable | Default (staging) | Notes |
|----------|-------------------|--------|
| `PESAFLOW_SEND_STK` | `false` | Set `true` only if Pesaflow should auto-push STK |
| `PESAFLOW_CHECKOUT_URL` | `https://test.pesaflow.com/PaymentAPI/iframev2.1.php` | Invoice creation + iframe |

---

## Files changed

| File | Change |
|------|--------|
| `web/components/loan-repay-modal.tsx` | Amount input; two-step modal; iframe checkout |
| `web/components/pesaflow-iframe-checkout.tsx` | **New** — iframe embed + form fallback |
| `web/lib/payments/pesaflow-invoice.ts` | **New** — `format=json` invoice request |
| `web/lib/payments/pesaflow.service.ts` | Create invoice on initiate; return `invoiceLink` |
| `web/lib/payments/pesaflow.config.ts` | STK off by default |
| `web/lib/payments/pesaflow-validation.ts` | Resume pending payment in modal |
| `web/lib/payments/pesaflow-repayment.ts` | Expose `pendingInvoiceLink` |
| `web/lib/data/payment-transaction.ts` | Store `_invoiceLink` on transaction |
| `web/app/payments/pesaflow/submit/[paymentId]/page.tsx` | Use iframe component (legacy direct URL) |
| `web/messages/en.json`, `sw.json` | New repay modal strings |
| `docker-compose.yml` | `PESAFLOW_SEND_STK` default `false` |

---

## Revert to redirect checkout

1. In `loan-repay-modal.tsx`, restore `window.location.href = result.submitPath` after initiate.
2. Remove checkout step / `PesaflowIframeCheckout` usage.
3. Restore `PESAFLOW_SEND_STK=true` in `.env` if STK push is required.
4. Redeploy `web`.

See also: [pesaflow-integration-2026-05-25.md](./pesaflow-integration-2026-05-25.md)

---

## Deploy

```bash
cd /home/administrator/Loan_Application
docker compose build web
docker compose up -d web
```

Ensure `.env` contains valid Pesaflow test credentials before testing Repay on staging.
