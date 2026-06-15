# Screenshots

Real, **sanitized** product captures from the live admin platform. Customer PII (names,
emails, initials) and sensitive financial figures (P&L, payout totals, wallet balances)
are **blurred/redacted** in-image. No raw customer data or business figures are exposed.

| File | Screen | Notes |
|---|---|---|
| `01-dashboard.png` | Operations dashboard overview | Real capture — financials + names blurred |
| `02-cohort-onboarding.png` | Onboarding workflow + automated reminders | Real capture — counts/PII blurred |
| `03-account-tracking.png` | Client Flow — account lifecycle tracking | Real capture — client names/emails blurred |
| `04-payout-review.png` | Payout review queue (human-in-the-loop) | Real capture — payout total blurred |
| `05-admin-tools.png` | Automation Health (admin/system tooling) | Real capture — no PII |
| `06-discord-automation.png` | Discord webhook automation (event + scheduled) | Real capture — no PII |

## Sanitization method

- Person names, email addresses, and avatar initials are blurred in `01`–`04`.
- Real money figures (P&L, payouts paid out, wallet/escrow balances) are blurred so no
  actual revenue, payout, or balance values are readable.
- `05` and `06` were chosen because they contain **no** customer data to begin with —
  automation/system health and webhook configuration only.
- The operator's own profile avatar is blurred for consistency.

> These are intentionally redacted for public review. Workflow structure, labels, and the
> operational flow remain visible; sensitive values do not.
