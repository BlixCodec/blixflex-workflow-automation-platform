# Handoff Runbook

> Operating guide for running BlixFlex without its original author. Sanitized — no real
> credentials, URLs, or infrastructure identifiers. Replace placeholders with your own
> environment's details when operating a real instance.

## Audience

Someone responsible for **operating** the platform day to day: processing applications and
payouts, keeping automation healthy, and handling routine incidents. Assumes admin access.

## 1. Daily operations

| Task | Where | Cadence |
|---|---|---|
| Review new applications | Admin → Applications | Daily |
| Action the payout review queue | Admin → Payouts | Daily / as needed |
| Check automation health | Admin → Automation Health | Daily |
| Scan notifications/alerts | Admin → Notifications | Daily |
| Review stuck/stalled records | Admin → Client Flow | Daily |

### Application review
1. Open **Applications**. New submissions show a computed alignment score.
2. Auto-approval may have already actioned high-confidence applications — verify the queue.
3. For manual cases: review the application, then approve / waitlist / reject.
4. Approval automatically notifies the applicant and creates their onboarding record.

### Payout review
1. Open **Payouts**. The queue shows records the eligibility engine marked eligible.
2. For each: confirm the computed result and reasons against the record.
3. Approve to finalize — approval is **audited** (who/when).
4. Follow-up (notifications, certificates) is queued automatically.

> Never finalize a payout you can't explain from the eligibility reasons. If the reasons
> look wrong, treat it as an incident (below) before approving.

## 2. Automation health

The **Automation Health** view shows scheduled jobs, last-run times, queue depth, and recent
failures.

**Green path:** jobs ran on schedule, queue depth is low, no recent failures.

**If a job hasn't run:**
1. Check the scheduler is enabled for that job.
2. Check the shared-secret / auth used by scheduled calls is valid.
3. Re-run manually if a one-off trigger is available, then confirm it completes.

**If queue depth is climbing:**
1. Confirm the queue processor job is running.
2. Inspect recent failures for a common cause (e.g. a failing external integration).
3. Once the cause is fixed, queued items retry on the next processing run.

## 3. Common incidents

### Notifications not arriving
- **In-app missing:** check the notification was created (it should exist even if delivery
  failed); confirm realtime is connected.
- **Email missing:** check the email queue processor ran; check provider status; verify the
  recipient/template.
- **Push missing:** confirm the device has a valid push subscription; expired subscriptions
  are pruned and the user must re-subscribe.

### Payment webhook didn't update a record
1. Confirm the webhook endpoint received the event (provider dashboard → webhook logs).
2. Confirm the webhook signature secret matches the configured value.
3. Replay the event from the provider if supported; the handler is idempotent on event id.

### Discord roles out of sync
1. Run the role-sync job for the affected user (or the bulk sync).
2. Confirm the user has completed verification/linking.
3. Check the bot still has the required guild permissions.

### A record is stuck in a state
1. Open the record's detail view; check its current state and history.
2. Use the manual step-completion / status override (audited) to advance it if appropriate.
3. If a trigger failed to fire, re-running the relevant scheduled job usually reconciles it.

## 4. Access & roles

- Grant the **least** access needed: prefer a scoped admin (per-section permissions) over
  full admin. See [roles-and-permissions.md](roles-and-permissions.md).
- All permission grants are audited. Review the audit log periodically.
- Off-board promptly: remove roles/permissions when someone no longer needs them.

## 5. Configuration & secrets

- All secrets live in environment configuration / a secret manager — **never** in the repo.
  `.env.example` lists the variable *names*.
- Rotating a secret: update it in the secret store, redeploy the affected functions, and
  verify the dependent workflow (e.g. send a test notification / test webhook).

## 6. Deploys & changes

- Backend functions deploy independently; a change to one workflow shouldn't require
  touching others.
- After a deploy affecting automation, check **Automation Health** to confirm jobs still run.
- Workflow thresholds (eligibility rules, reminder cadence) are configuration where
  possible — prefer changing config over editing code.

## 7. Escalation

If a workflow is failing in a way these steps don't resolve:
1. Capture the affected record id(s), timestamps, and any error surfaced in the health view.
2. Pause the affected automation if it's actively producing bad side effects.
3. Escalate with that context to whoever owns the platform's code.

## Related docs
- [architecture.md](architecture.md)
- [workflow-automation.md](workflow-automation.md)
- [roles-and-permissions.md](roles-and-permissions.md)
- [reporting-and-payouts.md](reporting-and-payouts.md)
