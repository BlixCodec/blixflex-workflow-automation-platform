# Code Samples

> **Illustrative, standalone reconstructions** of patterns used in BlixFlex. These are
> **not** copied production source. They have no production dependencies, read no real
> data or configuration, and exist to communicate the design clearly.

| Sample | Pattern shown |
|---|---|
| [`payout-eligibility/`](payout-eligibility/) | Pure rules engine returning a structured pass/fail with reasons (human-in-the-loop review). |
| [`workflow-rules/`](workflow-rules/) | Operational workflow modeled as an explicit, guarded state machine (e.g. onboarding). |
| [`role-based-access/`](role-based-access/) | Coarse roles + granular per-section permissions (mirrors database-enforced access). |

## Running / type-checking

From the repository root:

```sh
npm install
npm run typecheck     # tsc --noEmit, strict
```

Optionally run an example:

```sh
npx tsx code-samples/payout-eligibility/eligibility.example.ts
```

## Honesty notes

- The eligibility sample governs **operational** payout review only — it is not a financial
  return or guaranteed outcome.
- These samples favor clarity over completeness; the production system has more states,
  rules, and edge cases. See [`../docs/status-and-scope.md`](../docs/status-and-scope.md).
