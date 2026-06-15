# Workflow Automation

> How recurring operational work is automated in BlixFlex. Sanitized: trigger and job
> names below are representative and generalized, not a literal export of production
> configuration.

## Two mechanisms

BlixFlex automates work in two complementary ways:

1. **Event-driven (triggers).** When a row changes — an application is approved, a payout
   is created, an account status changes — a database trigger fires and either dispatches a
   side effect directly or enqueues it for processing.
2. **Schedule-driven (cron jobs).** Time-based operations run on a schedule: reminders,
   eligibility recalculation, compliance checks, queue processing, and digests.

A **queue** sits between "something happened" and "do the follow-up work," so that:
- the request path stays fast (work is handed off, not done inline),
- spikes are absorbed rather than dropped,
- failures are retryable and visible.

## Pattern: state change → trigger → queue → effect → audit

```
 row change ──► DB trigger ──► enqueue task ──► scheduled processor ──► effect
                    │                                   │                  │
                    └──────────── notification ◄────────┘            audit record
```

This single shape recurs across the platform. Building each workflow to this pattern keeps
them uniform, observable, and easy to extend.

## Automation inventory (representative)

### Event-driven (database triggers)

| Trigger (representative) | Fires on | Effect | Status |
|---|---|---|---|
| Application status change | `applications.status` → approved / rejected / waitlist | Notify applicant; on approval create onboarding record | ✅ Implemented |
| New application received | `applications` INSERT | Notify admins (in-app + email) | ✅ Implemented |
| Account status change | `accounts.status` change | Notify owner; update tracking; queue checks | ✅ Implemented |
| Payout created | `payouts` INSERT | Notify; write audit; queue certificate/issuance follow-up | ✅ Implemented |
| Onboarding step completed | onboarding step update | Recalculate progress; advance or notify | ✅ Implemented |
| Permission granted/changed | `admin_permissions` change | Write audit record | ✅ Implemented |

### Schedule-driven (cron jobs)

| Job (representative) | Cadence | What it does | Status |
|---|---|---|---|
| Onboarding reminders | Daily | Nudge participants stalled on a step | ✅ Implemented |
| Cohort reminders | Daily | Time-based cohort milestone reminders | ✅ Implemented |
| Payout-eligibility recalculation | Daily | Re-evaluate eligibility against current records | ✅ Implemented |
| Compliance / risk checks | Recurring | Evaluate accounts against rule thresholds | ✅ Implemented |
| Notification queue processor | Frequent | Drain queued email / push / in-app notifications | ✅ Implemented |
| Payment reminders | Daily | Remind on outstanding payment steps | ✅ Implemented |
| Community digest | Weekly | Post a summary digest to the community | ✅ Implemented |
| Stuck-record detection | Recurring | Flag records stalled in a state for operator attention | 🟡 Partial |
| Automation-health rollup | Recurring | Aggregate job status for the health view | 🟡 Partial |

> Names are generalized. The point is the *shape* of the automation, not the exact
> production schedule.

## Notifications

A unified notification path lets any workflow notify a user across one or more channels:

- **In-app** — written to a notifications table, delivered in realtime, with read state,
  priority, and an action link.
- **Email** — templated (React Email) and queued for delivery.
- **Web push** — delivered to subscribed devices via VAPID.

Workflows call one notification helper and choose channels, rather than each workflow
re-implementing delivery. This keeps channel logic in one place and consistent.

## Observability

An **automation-health** view surfaces:
- which scheduled jobs exist and when they last ran,
- queue depth and pending work,
- recent failures.

This is the operator's first stop when something seems stuck — see the
[handoff runbook](handoff-runbook.md).

## Why a queue (vs. doing it inline)

| Inline side effects | Queued side effects |
|---|---|
| A slow email blocks the user's request | User request returns immediately |
| One failure can fail the whole action | Failures are isolated and retryable |
| No record of what was attempted | Queue + audit give a trail |
| Spikes hit external services directly | Queue smooths the rate |

## Representative code

A small, self-contained workflow-rules engine — the kind of logic that decides whether a
record may advance — is in [`../code-samples/workflow-rules/`](../code-samples/workflow-rules/).
It is illustrative and standalone (no production dependencies).

## Related docs
- [architecture.md](architecture.md)
- [reporting-and-payouts.md](reporting-and-payouts.md)
- [handoff-runbook.md](handoff-runbook.md)
