# JazzCash payment review

## Deployment status

The application changes and migration are implemented locally. The migration has **not been applied to the live Supabase project**. This workspace has Supabase API credentials but no SQL connection or SQL-management tool. The existing live project was inspected read-only. No members, receipts, payments, balances or commissions were changed.

Payment collection intentionally remains closed until the private `payment-proofs` bucket exists from the successfully committed migration. Do not create this bucket manually as a substitute for running the migration.

## Enable the workflow

1. Back up the current database definitions and test on a staging copy of the existing Assignwork database first. This is an incremental migration, not a new-project bootstrap.
2. Apply `supabase/migrations/202609090001_jazzcash_payment_review.sql` with the Supabase SQL Editor or your normal migration pipeline. The whole script is transactional. If existing duplicate submitted declarations prevent its unique index from being created, reconcile those records deliberately; do not delete them to force the migration through.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only in the deployment environment. The migration restricts declaration writes and payment confirmation to trusted server operations, creates private receipt storage, and updates the existing `confirm_declaration(uuid, uuid)` procedure while preserving the existing `record_payment` business logic.
4. Deploy the app. Confirm the payment screen shows the supplied QR and active database plan prices, not the temporary-unavailable notice.
5. Run the staging acceptance checks below with test members and a finance reviewer. Verify existing commission and leaderboard triggers against the real staging schema before enabling real collection.

The migration assumes the current `confirm_declaration` returns UUID, as does the payment ID it stores. Check the existing definition before applying if the database has diverged from this repository. It does not replace `record_payment` or change plan prices, commission rates, refunds or withdrawal methods.

## Member experience

- JazzCash QR is the only incoming payment method. The supplied PNG is copied without editing or lossy optimisation. Visible recipient: Muhammad Waqas, account label 9104. No full account number has been invented. Confirm ownership and scan destination operationally before collecting real funds.
- New members choose a plan and pay the exact price in PKR. The server and database both validate the amount. Existing active members are directed to support for an upgrade quote, preventing another full-price activation payment.
- A transaction ID, PNG/JPG/WebP screenshot of up to 5 MB, and acknowledgement are required. Uploads go through an authenticated server action; file size, signature and MIME type are checked. Client-supplied storage paths are never accepted.
- The six-hour countdown starts at the database-generated declaration timestamp, after the receipt has been saved and the submission committed. It is shown on `/dashboard`, `/dashboard/billing` and `/pricing`. Refreshing or using another device does not restart it. The display uses server time plus elapsed monotonic time.
- Status refreshes every 15 seconds while visible, on tab focus and via a manual check button. Approval removes the pending countdown and displays active access. Rejection shows the reason on the billing page and permits a corrected submission. Expiry shows an overdue message, not automatic activation or a request to pay twice.
- Billing, notifications, settings and existing earnings remain accessible while paid tasks, referral tools, rank and the member leaderboard require verified active membership. A server action and a restrictive database policy also gate new task claims.

## Finance experience

`/admin/payments` is limited to active finance, admin and owner roles. The oldest 100 pending requests appear first, with total queue count and PKT review deadline. Each request includes the amount, plan, transaction ID, member note and a private screenshot preview.

The reviewer must inspect the actual JazzCash transaction history, not simply trust a screenshot. The verification checkbox confirms that the recipient, amount, transaction ID and settled status match. Reviewers cannot approve their own payment.

Approval takes a database row lock and invokes the existing payment procedure inside one transaction. Payment, membership, existing commission/leaderboard effects, account activation, member notification, declaration status and audit entry commit together. Repeated confirmation returns the original payment ID. Rejection requires a reason and records both notification and audit information transactionally.

Receipts are served via `/api/payments/[id]/proof`, with authentication and ownership/finance permission checked on each request. Responses use `private, no-store` and `nosniff`; there are no public storage links. Legacy image receipts remain viewable from the existing submissions bucket. Legacy PDFs are not rendered inline and require an operational migration/review approach if they exist.

Automated `/api/webhooks/[provider]` payment processing returns HTTP 410, even if old provider secrets remain configured. No timer or webhook activates a member.

## Verification performed

- `npm test`: pure countdown, image signature, proof-path and paid-access tests; isolated PostgreSQL migration tests using PGlite.
- Database fixture checks: repeatable migration, mismatched amount, alternate method, missing/foreign receipt, immutable timestamp, duplicate member/transaction, direct browser write and RPC rejection, private receipts despite broad legacy policy, task-claim gate, idempotent approval, rejection notification, and transactional rollback on membership failure.
- The PostgreSQL fixture uses a stub for existing `record_payment`. It proves this migration's workflow and rollback, not the live project's commission or leaderboard implementation.
- Desktop 1440px and mobile 390px local component previews checked. No horizontal overflow, plan amount changes correctly, required receipt field is present, pending and overdue counters render, and no browser errors were reported.
- TypeScript, ESLint and production build passed. Runtime smoke checks returned pricing 200, protected billing 307 to login with the plan preserved, anonymous receipt 401, QR asset 200 and automated payment webhook 410. Repeat checks after deployment configuration changes.
- `npm audit` reports one existing high-severity development dependency advisory in `js-yaml` (under ESLint). It was not changed as part of this payment feature.

## Staging acceptance checklist

1. With no active plan, opening paid tools redirects to Plans & payments. Anonymous receipt access fails; another member and non-finance staff cannot retrieve it.
2. Submit a test receipt and verify the deadline is exactly `created_at + interval '6 hours'`. No membership or commission exists yet. Refresh, sign in on another device and confirm the same deadline.
3. Attempt simultaneous duplicate submissions and approvals. Only one request/payment should take effect. Attempts to change amount, user, timestamp or proof path directly through the browser API must fail.
4. Approve as another finance reviewer. Verify one active membership, the correct plan access, existing commission/leaderboard effects and an activation notification. The member's open page should update within about 15 seconds while visible.
5. Reject another test receipt with a reason. Ensure access stays locked, the reason appears to the member, and a corrected submission starts a new review window.
6. Test a persisted overdue fixture. The display remains pending at 00:00:00 and never opens access on its own.
7. Verify the original QR scans to the intended recipient. No actual payment was sent during development.
