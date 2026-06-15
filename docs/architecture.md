# Architecture

> Sanitized architecture overview for the BlixFlex operations platform. Describes
> structure and patterns; contains no secrets, infrastructure identifiers, or
> proprietary configuration.

## At a glance

BlixFlex is a single web application backed by a managed Postgres database, a set of
serverless backend functions, and an automation layer of scheduled and event-driven jobs.
Access control is enforced in the database so that the app, automation, and any direct
query all obey the same rules.

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Client (Web / PWA)                           │
│   React + TypeScript + Vite + Tailwind + shadcn/ui                     │
│   Role-aware UI · Admin console · Participant & Analyst views          │
└───────────────┬───────────────────────────────────────┬──────────────┘
                │ authenticated requests                 │ realtime subscribe
                ▼                                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Backend (Supabase)                             │
│                                                                        │
│   PostgreSQL  ──  Row-Level Security on every table                    │
│        │           roles + granular admin permissions                 │
│        │                                                               │
│   Edge Functions (Deno/TypeScript)                                     │
│        ├─ request/response APIs (checkout, lookups, exports)           │
│        ├─ event handlers (webhooks: payments, Discord)                 │
│        └─ scheduled jobs (reminders, eligibility, checks, queues)      │
│                                                                        │
│   Triggers + queues  ──  decouple "it happened" from "do the work"     │
└───────┬───────────────────────┬───────────────────────┬───────────────┘
        ▼                       ▼                       ▼
   Payments (Stripe)      Email delivery          Discord (community)
                          Web Push (VAPID)
```

## Layers

### 1. Client
- **React + TypeScript + Vite**, styled with **Tailwind** and **shadcn/ui** components.
- The UI is **role-aware**: it renders the workflow appropriate to the signed-in user's
  role, but treats that purely as presentation — the authoritative checks live server-side.
- Ships as an installable **PWA** (via Capacitor) with web-push support.

### 2. Data & access (PostgreSQL)
- A single relational schema models the operational domain: participants, applications,
  cohorts, accounts, assignments, payouts, notifications, and audit records.
- **Row-Level Security (RLS)** is enabled on every table. Policies reference a small set of
  helper functions (see [roles-and-permissions.md](roles-and-permissions.md)).
- Roles are stored in a dedicated `user_roles` table — **never** on the user profile — so a
  user editing their own profile can't escalate privileges.

### 3. Backend functions (Edge Functions, Deno/TypeScript)
Three categories:
- **APIs** — request/response endpoints the client calls (e.g. create checkout session,
  generate an export, look up a record).
- **Event handlers** — verified webhooks from external services (payment events, Discord
  interactions) that update state and enqueue follow-up work.
- **Scheduled jobs** — cron-triggered functions that run recurring operations.

### 4. Automation layer
- **Database triggers** fire on row changes and enqueue or dispatch side effects
  (notifications, status transitions, follow-up tasks).
- **A processing queue** holds pending work so spikes don't block the request path and
  failures can be retried.
- **Scheduled jobs** drive time-based operations (reminders, recalculation, checks).
- See [workflow-automation.md](workflow-automation.md) for the inventory and patterns.

### 5. Integrations
- **Stripe** for payments (checkout + signed webhooks).
- **Email** via templated, queued delivery.
- **Web Push (VAPID)** and in-app realtime for notifications.
- **Discord** for community operations (bot commands, role syncing, webhooks).

## Key design decisions

| Decision | Why |
|---|---|
| Enforce authorization in the database (RLS) | One source of truth for "who can do what" across app, automation, and direct queries. |
| Roles in a separate table, not on the profile | Prevents privilege escalation through profile edits. |
| Queue side effects instead of doing them inline | Resilience to spikes; retries; observability; faster request path. |
| Model operations as explicit states + transitions | Workflows become observable, testable, and automatable. |
| Human-in-the-loop for payouts | Eligibility is computed; approval is a deliberate human action with an audit trail. |
| Serverless functions per concern | Small, independently deployable units; clear blast radius. |

## Data flow example — application to onboarding

1. A participant submits an **application** → row inserted.
2. A **scoring** step computes an alignment score; auto-approval rules may apply, or it
   waits for **manual review**.
3. On approval, a **trigger** fires: notifications are sent and an **onboarding** record is
   created in its first state.
4. **Scheduled reminders** nudge stalled participants; an admin can advance or override
   steps manually.
5. State changes throughout emit **notifications** (in-app / email / push) and write
   **audit** records.

This same shape — *state change → trigger → queued side effects → notification + audit* —
recurs across the platform.

## Related docs
- [workflow-automation.md](workflow-automation.md)
- [roles-and-permissions.md](roles-and-permissions.md)
- [reporting-and-payouts.md](reporting-and-payouts.md)
- [handoff-runbook.md](handoff-runbook.md)
- [status-and-scope.md](status-and-scope.md)
