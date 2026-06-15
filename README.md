# BlixFlex — Workflow Automation & Operations Platform

> A cohort-based operations platform that consolidates onboarding, workflow automation,
> account tracking, risk/rule logic, reporting, payout review, and Discord community
> operations into one operator-managed system.

**This is a sanitized portfolio / case-study repository.** It documents the design and
selected implementation of a private production system. It contains illustrative code
samples, sanitized examples, diagrams, and placeholder screenshots only — no secrets,
customer data, or financial records. See [Security / Privacy Notes](#13-security--privacy-notes).

> **Scope note:** BlixFlex is an *operations and workflow* tool. It coordinates people,
> records, and process. It is **not** a trading system, an investment product, or financial
> advice, and it makes **no** claims or guarantees about financial outcomes. Any figures in
> screenshots or examples are illustrative sample data.

## What this case study proves

- **Operational workflow design** — converting fragmented manual processes into explicit states, roles, and automation.
- **Role-based product thinking** — separate client, analyst, and admin workflows with data-layer access control.
- **Automation with human review** — eligibility checks, notifications, and payout review workflows designed around auditability.
- **Reporting and handoff** — dashboards, exports, runbooks, and project-memory notes for future operators.

---

## 1. Overview

BlixFlex is a full-stack, SaaS-style operations platform for operators, clients, and
analysts who needed a more structured way to manage account workflows, risk rules,
reporting, payment flows, and Discord-based community operations.

It was built through a **Claude-guided, AI-assisted development workflow**: Claude and AI
coding tools were used as pair-programming partners to scope features, reason through
complex workflow logic, draft database and security patterns, debug integrations, and
produce handoff documentation. BlixFlex does **not** run Claude as a production, user-facing
feature — the AI relevance is in *how the system was designed, built, and documented*. See
[AI-Assisted Development](#ai--claude-assisted-development).

The system is organized around three ideas:

1. **Roles, not screens.** Admins, analysts, and clients each get a workflow scoped to what
   they're responsible for, enforced at the database layer.
2. **Automation as the default.** Reminders, eligibility checks, status transitions, and
   notifications run on triggers and schedules rather than by hand.
3. **Handoff-ready.** Every operational process is documented as a runbook so the platform
   can be operated by someone who didn't build it.

---

## 2. Problem

The original workflow was spread across too many disconnected tools: account forms,
spreadsheets, copier dashboards, payment links, Discord channels, manual payout tracking,
and admin notes.

That created operational friction — slow onboarding, inconsistent tracking, repeated
support work, and a higher risk of human error. BlixFlex was built to bring those workflows
into one system with clearer user roles, structured onboarding, automated checks,
reporting, and admin visibility.

---

## 3. What I Built

A single platform (web app + backend + automation layer) covering the operational
lifecycle:

- **Cohort enrollment and lifecycle tracking** — activity, performance, and reporting
  isolated per cohort.
- **Multi-account onboarding workflows** — provider/account selection, account linking, and
  step-by-step onboarding with progress and reminders.
- **Account linking and copier workflow management.**
- **Live performance and equity tracking.**
- **Risk and rule calculations** — drawdown limits, consistency, daily summaries, payout
  eligibility.
- **Payout request workflows** — eligibility checks, performance-fee creation, Stripe
  checkout, certificate generation.
- **Stripe payment and affiliate payout flows.**
- **Discord verification, role sync, and community automation.**
- **Admin tools** — firm settings, user management, overrides, refunds, notifications,
  reporting, and support workflows.
- **Documentation and project-memory notes** for handoff and future development.

See [Status & Scope](#10-status--scope) for what is implemented vs. partial vs. planned.

---

## 4. Key Workflows

| Workflow | What it does | Primary roles |
|---|---|---|
| **Application & intake** | Submission, scoring, auto/manual approval, waitlist | Client, Admin |
| **Cohort lifecycle** | Cohorts with start/end dates; activity isolated per cohort | Client, Admin |
| **Multi-account onboarding** | Provider/account selection, linking, stepwise onboarding | Client, Admin |
| **Account tracking** | Assignment, status, performance/equity, compliance & risk checks | Admin, Analyst |
| **Analyst operations** | Cohort assignment, performance review, agreements | Analyst, Admin |
| **Payout review** | Eligibility evaluation → human review → approval → certificate | Admin |
| **Reporting** | Program metrics, revenue analytics, equity history, exports | Admin |
| **Community ops** | Discord roles, verification, progress, digests | Admin (automated) |
| **Notifications** | In-app, email, and push across all of the above | All (automated) |

Each workflow is documented in [`docs/workflow-automation.md`](docs/workflow-automation.md)
and mapped end to end in [`diagrams/blixflex-workflow-map.md`](diagrams/blixflex-workflow-map.md).

---

## 5. Workflow Automation

Automation is delivered two ways:

- **Event-driven triggers** — database triggers fire on row changes (e.g. application
  status → approved) to send notifications, advance state, and queue follow-up work.
- **Scheduled jobs** — cron-driven backend functions run recurring operations: onboarding
  reminders, payout-eligibility recalculation, compliance/risk checks, notification queue
  processing, daily snapshots, and digests.

A **queue** decouples *deciding* work needs to happen from *doing* it, so spikes don't block
the request path and failures can be retried and observed. An **automation-health** view
surfaces job status so operators can see what ran, what's pending, and what failed.

Full inventory (sanitized): [`docs/workflow-automation.md`](docs/workflow-automation.md).
A self-contained workflow state machine is in
[`code-samples/workflow-rules/`](code-samples/workflow-rules/).

---

## 6. Roles & Permissions

Access is enforced server-side, not in the UI. Two layers:

1. **Coarse roles** — `admin`, `analyst`, `client` — checked by a `SECURITY DEFINER` helper
   against a dedicated roles table (never stored on the user profile, to prevent
   privilege-escalation via profile edits).
2. **Granular admin permissions** — per-section `view` / `edit` / `delete` flags, so an
   admin can be scoped to exactly the areas they operate (e.g. payouts but not branding).

Row-Level Security policies on every table reference these checks, so the same rules apply
whether data is touched by the app, an automation job, or a direct query.

See [`docs/roles-and-permissions.md`](docs/roles-and-permissions.md) and the sanitized
example in [`code-samples/role-based-access/`](code-samples/role-based-access/).

---

## 7. Reporting / Payout Review

Payout review is deliberately **human-in-the-loop**:

1. An **eligibility engine** evaluates a record against the relevant program's configurable
   ruleset (minimum activity, consistency, compliance/drawdown, minimum amount, cooldown).
2. The result is a **structured pass/fail with reasons** — never a silent yes/no.
3. An admin **reviews** the evaluation and supporting record before approving.
4. Approval is **recorded** with who approved it and when — producing an audit trail —
   after which downstream effects (notifications, certificate, status) are queued.

Reporting covers program metrics and revenue analytics — lifetime value, monthly and
quarterly summaries, equity history — with CSV export.

Logic illustrated in [`code-samples/payout-eligibility/`](code-samples/payout-eligibility/);
documented in [`docs/reporting-and-payouts.md`](docs/reporting-and-payouts.md).

> Eligibility rules govern **operational** payout review only. They are not, and do not
> represent, any financial return, performance promise, or guaranteed outcome.

---

## 8. Admin & Handoff

The platform is designed to be operated by someone other than its author:

- A consolidated **admin surface** with section-scoped access.
- An **automation-health dashboard** so operators can see scheduled jobs at a glance.
- **Audit trails** on sensitive actions (approvals, permission grants, overrides, refunds,
  status changes).
- A **handoff runbook** covering routine operations, common incidents, and recovery — see
  [`docs/handoff-runbook.md`](docs/handoff-runbook.md).
- **Project-memory documentation** capturing key decisions so future contributors (or AI
  agents) can continue safely without rediscovering the whole system.

---

## 9. Tech Stack

**Frontend** — React · TypeScript · Vite · Tailwind CSS · shadcn/ui · Radix UI ·
Framer Motion · TanStack Query · React Hook Form · Zod · Recharts

**Backend & database** — Supabase · PostgreSQL · Row-Level Security · Supabase Auth ·
Deno Edge Functions · Supabase Storage

**Integrations** — Stripe Checkout · Stripe Connect · Discord API · Email automation ·
third-party copier/API workflows · Trustpilot

**Tooling** — Playwright · ESLint · DOMPurify · Capacitor (PWA + mobile) · jsPDF ·
ExcelJS · html2canvas

See [`docs/architecture.md`](docs/architecture.md) for how these fit together.

---

## AI / Claude-Assisted Development

Claude was used as a practical development partner throughout the project — especially for
reasoning-heavy and handoff-heavy work:

- Scoping product workflows from non-technical operator needs.
- Translating operational requests into database, UI, and admin-tool requirements.
- Reasoning through drawdown math, payout eligibility, consistency rules, and cohort
  attribution edge cases.
- Drafting and reviewing Supabase Row-Level Security patterns.
- Planning migration logic and user-deletion cascades.
- Debugging copier reconciliation and workflow sync issues.
- Creating persistent **project-memory documentation** so future contributors could
  understand architectural decisions without rediscovering the system from scratch.

This made the build faster, but more importantly it forced the system to become more
explainable, documented, and handoff-ready.

**Future AI improvements** could include: a Claude-powered support/onboarding assistant;
natural-language admin queries over *sanitized* operational data; auto-generated daily
performance summaries; support-ticket triage; and workflow troubleshooting tools for
non-technical operators.

> Honest framing: AI was a development accelerator and a documentation/handoff aid. It is
> **not** a production runtime feature of the deployed platform.

---

## 10. Status & Scope

| Area | Status |
|---|---|
| Multi-role app + RLS-enforced permissions | ✅ Implemented |
| Application intake, scoring, approval, waitlist | ✅ Implemented |
| Cohort lifecycle + multi-account onboarding + reminders | ✅ Implemented |
| Account tracking, performance/equity, compliance/risk checks | ✅ Implemented |
| Payout eligibility engine + human review + certificates | ✅ Implemented |
| Stripe payments + affiliate payout flows | ✅ Implemented |
| Notifications (in-app / email / push) | ✅ Implemented |
| Discord community operations | ✅ Implemented |
| Reporting & revenue analytics + export | ✅ Implemented |
| Automation-health observability | 🟡 Partial |
| Advanced analyst analytics | 🟡 Partial |
| Multi-program / multi-tenant generalization | 🔵 Planned |
| Claude-powered support/onboarding assistant | 🔵 Planned |

Full breakdown: [`docs/status-and-scope.md`](docs/status-and-scope.md).
**Legend:** ✅ Implemented · 🟡 Partial · 🔵 Planned

---

## 11. What I Learned

Building BlixFlex taught me how to design systems around real operational constraints, not
just features. Specifically:

- **Enforce access at the data layer, not the UI.** RLS in the database meant automation
  jobs and direct queries inherited the same guarantees as the app — far fewer "who can do
  what" bugs.
- **Model operations as explicit state machines.** Turning onboarding and payout review into
  defined states and transitions made them observable, testable, and automatable.
- **Queue the side effects.** Decoupling "this happened" from "do the follow-up work" made
  the system resilient to spikes and failures.
- **Design around serverless constraints** — structuring background work around function
  timeout limits.
- **Use AI tools responsibly** — as accelerators, without giving up engineering judgment.
- **Write the runbook while building** — documenting handoff as I went caught assumptions
  that only lived in my head.

---

## 12. What I Would Improve

- A **Claude-powered onboarding and support assistant**.
- **Natural-language admin queries** over sanitized operational data.
- **Replay-based tests** for payout and rule calculations.
- **Stronger observability** for sync and background jobs.
- **Cleaner separation** between case-study/demo data and production workflows.
- **Better user-facing explanations** for non-technical operators.
- **Generalize beyond one program** toward a config-driven, multi-tenant model.

---

## 13. Security / Privacy Notes

This repository is a sanitized case study. To produce it:

- Authored from a **fresh tree with no original git history**.
- **No** secrets, `.env` files, API keys, tokens, or credentials committed.
- **No** customer data, real names, emails, Discord IDs, account numbers, Stripe data,
  payout records, or private URLs.
- Code samples are **illustrative standalone reconstructions** — not copied production
  source — and reference no proprietary configuration.
- Screenshots are **placeholders / mockups** with sample data only.

Practices reflected in the underlying system: Supabase **Row-Level Security** for access
control; **role-based** separation of admin/analyst/client workflows; **service-role-only**
access for sensitive backend operations; **PII-redaction** patterns for internal data
access; **DOMPurify** where user-rendered HTML required sanitization; environment variables
managed via the deployment platform / local `.env`, with `.env.example` for reference only.

A privacy/secrets scan was run before publishing; see
[`docs/status-and-scope.md`](docs/status-and-scope.md).

---

## 14. Screenshots

Placeholder screenshots (sample/mock data only) live in [`screenshots/`](screenshots/):

| File | Shows |
|---|---|
| `01-dashboard.png` | Operations dashboard overview |
| `02-cohort-onboarding.png` | Onboarding workflow + progress |
| `03-account-tracking.png` | Account tracking & status |
| `04-payout-review.png` | Payout eligibility review queue |
| `05-admin-tools.png` | Admin tooling & permissions |
| `06-discord-automation.png` | Discord community automation |

> Real product screenshots will be added after they are captured with sanitized demo data.
> Current placeholders are intentionally generic and do not contain PII, account numbers,
> or figures readable as financial results.

---

## 15. Repository Map

- **Docs** — [`docs/`](docs/): [architecture.md](docs/architecture.md) ·
  [workflow-automation.md](docs/workflow-automation.md) ·
  [roles-and-permissions.md](docs/roles-and-permissions.md) ·
  [reporting-and-payouts.md](docs/reporting-and-payouts.md) ·
  [handoff-runbook.md](docs/handoff-runbook.md) ·
  [status-and-scope.md](docs/status-and-scope.md)
- **Examples** — [`examples/`](examples/):
  [sample-cohort-workflow.json](examples/sample-cohort-workflow.json) ·
  [sample-payout-review.json](examples/sample-payout-review.json) ·
  [sample-admin-action-log.json](examples/sample-admin-action-log.json)
- **Code samples** — [`code-samples/`](code-samples/):
  [workflow-rules/](code-samples/workflow-rules/) ·
  [payout-eligibility/](code-samples/payout-eligibility/) ·
  [role-based-access/](code-samples/role-based-access/)
- **Diagrams** — [`diagrams/blixflex-workflow-map.md`](diagrams/blixflex-workflow-map.md)
- **Screenshots** — [`screenshots/`](screenshots/)

---

## Interview Summary

BlixFlex is a full-stack workflow automation platform I built to consolidate a fragmented
operations process into one system. It let me practice the loop AI-development fellows are
expected to use: understand a messy workflow, scope the problem, build a useful tool,
document it clearly, and make it easier for someone else to operate after handoff.

**Resume bullets:**

- Built a full-stack cohort operations platform in React, TypeScript, Supabase, and Stripe
  to centralize onboarding, workflow automation, risk tracking, payout requests, reporting,
  and Discord community operations.
- Designed role-based workflows for clients, analysts, and admins — cohort lifecycle
  tracking, account onboarding, performance reporting, payout eligibility, and operational
  override tools.
- Used Claude-guided AI development workflows to scope features, reason through complex rule
  logic, draft database/security patterns, debug integrations, and create handoff-ready
  documentation.
- Implemented automation across onboarding triggers, account linking, notifications, email
  batching, Discord role sync, and admin workflows to reduce manual operator work.
- Created persistent project-memory documentation capturing architectural decisions,
  workflow rules, and handoff notes so future contributors could continue without
  rediscovering the system.

---

## License

See [LICENSE.md](LICENSE.md). Documentation and case-study content are shared for portfolio
and educational review. No proprietary production source is included.
