# Reporting & Payout Review

> How BlixFlex handles operational payout review and reporting. Sanitized and illustrative.

> **Important framing.** "Payout review" here is an **operational workflow** — verifying
> that a record meets a program's defined operational rules, then routing it for human
> approval and record-keeping. It is **not** an investment product and represents **no**
> financial return, performance, or guaranteed outcome. All figures in examples are sample
> data.

## Payout review is human-in-the-loop by design

Eligibility is **computed**; approval is a **deliberate human action**. The system never
silently finalizes a payout.

```
   record ──► eligibility engine ──► structured result ──► admin review ──► approval
                    (rules)        (pass/fail + reasons)    (human)        (audited)
```

### Step 1 — Eligibility engine

A pure rules engine evaluates a record against the relevant program's **configurable**
ruleset. Typical operational rules include:

| Rule | Example check |
|---|---|
| Minimum activity | At least *N* qualifying days recorded |
| Consistency | No single day exceeds a configured share of the total |
| Cooldown | Minimum days since the last payout |
| Compliance | Record is within configured operational limits |
| Minimum amount | Computed amount is at least the configured floor |

The engine returns a **structured result** — pass/fail plus the specific reasons — so the
outcome is explainable, not a black box.

A standalone, sanitized version of this engine is in
[`../code-samples/payout-eligibility/`](../code-samples/payout-eligibility/), and a sample
result is in [`../examples/sample-payout-review.json`](../examples/sample-payout-review.json).

### Step 2 — Review queue

Eligible records surface in a review queue. The admin sees the computed result, the reasons,
and the supporting record together — enough to make a confident decision without
re-deriving it by hand.

### Step 3 — Approval + audit

Approval records **who** approved, **when**, and the **state** at approval time. This audit
trail is the operational record of the decision.

### Step 4 — Follow-up (automated)

On approval, downstream effects are queued: notifications to the participant, certificate
generation where applicable, and status transitions — all via the standard
[automation queue](workflow-automation.md).

## Configurable rulesets

Rules are **configuration, not hardcode**. Each program defines its own thresholds
(minimums, consistency percentage, cooldown, minimum amount). The engine reads the relevant
config and applies it, so a new program is a config change rather than a code change.

```jsonc
// Illustrative ruleset shape (see examples/ for a full sample)
{
  "minQualifyingDays": 5,
  "consistencyMaxDayPercent": 40,
  "cooldownDays": 14,
  "minimumPayoutAmount": 100,
  "splitPercent": 80
}
```

## Reporting

Alongside payout review, the platform provides operational reporting:

| Report | Contents | Status |
|---|---|---|
| Program metrics | Counts and status across the operational lifecycle | ✅ Implemented |
| Revenue analytics — LTV | Lifetime value per customer, average CLV | ✅ Implemented |
| Revenue analytics — periodic | Monthly and quarterly summaries | ✅ Implemented |
| CSV export | Export of the above for downstream use | ✅ Implemented |
| Cohort analytics | Per-cohort progress / completion | 🟡 Partial |

> Reporting reflects **operational** records (applications, onboarding, accounts, payouts
> processed). It is descriptive record-keeping, not a representation of financial returns.

## Related docs
- [workflow-automation.md](workflow-automation.md)
- [architecture.md](architecture.md)
- [status-and-scope.md](status-and-scope.md)
