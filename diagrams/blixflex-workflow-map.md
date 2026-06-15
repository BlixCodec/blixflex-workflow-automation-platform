# BlixFlex — Workflow Map

> End-to-end map of the operational lifecycle and the automation that drives it.
> Rendered with Mermaid (GitHub renders these natively). Sanitized and illustrative.

## Lifecycle overview

```mermaid
flowchart TD
    A[Application submitted] --> B{Scoring}
    B -->|High fit| C[Auto-approve]
    B -->|Needs review| D[Manual review]
    B -->|At capacity| W[Waitlist]
    D -->|Approve| C
    D -->|Reject| R[Rejected + notified]
    W -->|Spot opens| D
    C --> E[Onboarding created]
    E --> F[Onboarding steps + reminders]
    F --> G[Account tracking active]
    G --> H[Ongoing compliance / risk checks]
    H --> I{Payout eligibility}
    I -->|Eligible| J[Payout review queue]
    I -->|Not yet| H
    J --> K[Admin review + approval]
    K --> L[Approved + audited]
    L --> M[Follow-up effects queued]
    M --> N[Notifications + certificate + status]
```

## Automation pattern (applies throughout)

```mermaid
flowchart LR
    X[Row change] --> T[DB trigger]
    T --> Q[Enqueue task]
    T --> NotifA[Notify]
    Q --> P[Scheduled processor]
    P --> Eff[Side effect]
    P --> Aud[Audit record]
    Eff --> NotifB[Notify]
```

## Roles across the lifecycle

```mermaid
flowchart TD
    subgraph Participant
      P1[Submit application]
      P2[Complete onboarding]
      P3[View own progress]
    end
    subgraph Analyst
      AN1[Review assigned cohorts/accounts]
      AN2[Performance + agreements]
    end
    subgraph Admin
      AD1[Review applications]
      AD2[Review + approve payouts]
      AD3[Manage roles/permissions]
      AD4[Monitor automation health]
    end
    subgraph System[System / Automation]
      S1[Triggers]
      S2[Scheduled jobs]
      S3[Notifications]
      S4[Audit]
    end

    P1 --> AD1
    AD1 --> P2
    P2 --> AN1
    AN1 --> AD2
    S1 --> S3
    S2 --> S3
    AD2 --> S4
    AD3 --> S4
```

## Notification channels

```mermaid
flowchart LR
    Wf[Any workflow] --> Helper[Unified notification helper]
    Helper --> InApp[In-app realtime]
    Helper --> Email[Email queue]
    Helper --> Push[Web push VAPID]
```

## Community operations (Discord)

```mermaid
flowchart TD
    V[Member links / verifies] --> Sync[Role sync job]
    Sync --> Roles[Cohort roles applied]
    Prog[Onboarding / cohort progress] --> Updates[Progress updates]
    Sched[Weekly schedule] --> Digest[Community digest]
    Updates --> Discord[(Discord guild)]
    Digest --> Discord
    Roles --> Discord
```

## Notes
- Diagrams describe the **shape** of the system, not exact production configuration.
- See [`../docs/workflow-automation.md`](../docs/workflow-automation.md) and
  [`../docs/architecture.md`](../docs/architecture.md) for detail.
