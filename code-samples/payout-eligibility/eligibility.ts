/**
 * Payout eligibility — illustrative, standalone rules engine.
 *
 * This is a sanitized reconstruction of the PATTERN used in BlixFlex: a pure function
 * that evaluates an operational record against a configurable ruleset and returns a
 * structured pass/fail with reasons. It has no production dependencies and reads no
 * real data or configuration.
 *
 * IMPORTANT: "Payout eligibility" is an OPERATIONAL workflow check — it decides whether a
 * record may be routed for human review and approval. It is NOT a financial return,
 * performance promise, or guaranteed outcome. All numbers are sample values.
 */

/** A configurable operational ruleset for a program. */
export interface PayoutRuleset {
  /** Minimum number of qualifying days recorded. */
  minQualifyingDays: number;
  /** No single day may exceed this share (%) of the total. */
  consistencyMaxDayPercent: number;
  /** Minimum days since the last payout. */
  cooldownDays: number;
  /** Minimum computed amount for a payout to be worth processing. */
  minimumPayoutAmount: number;
  /** Operational split (%) applied to compute the amount. */
  splitPercent: number;
}

/** A snapshot of an operational record being evaluated. */
export interface RecordSnapshot {
  qualifyingDays: number;
  /** Largest single day as a share (%) of the total. */
  largestSingleDaySharePercent: number;
  /** Days since the participant's last payout; null if none yet. */
  daysSinceLastPayout: number | null;
  /** Pre-split total used to derive the payout amount. */
  totalAmount: number;
  /** Whether the record is within configured operational limits. */
  withinComplianceLimits: boolean;
}

export interface RuleCheck {
  rule: string;
  passed: boolean;
  detail: string;
}

export interface EligibilityResult {
  eligible: boolean;
  computedAmount: number;
  checks: RuleCheck[];
  failureReasons: RuleCheck[];
}

/**
 * Evaluate a record against a ruleset.
 *
 * Returns ALL checks (not just the first failure) so the result is fully explainable to
 * the human reviewer. The engine never finalizes anything — eligibility only routes a
 * record into the review queue.
 */
export function evaluatePayoutEligibility(
  record: RecordSnapshot,
  rules: PayoutRuleset,
): EligibilityResult {
  const checks: RuleCheck[] = [];

  // 1. Minimum qualifying days
  checks.push({
    rule: "minQualifyingDays",
    passed: record.qualifyingDays >= rules.minQualifyingDays,
    detail: `${record.qualifyingDays} of minimum ${rules.minQualifyingDays}`,
  });

  // 2. Consistency — no single day dominates the total
  checks.push({
    rule: "consistency",
    passed: record.largestSingleDaySharePercent <= rules.consistencyMaxDayPercent,
    detail: `${record.largestSingleDaySharePercent}% <= ${rules.consistencyMaxDayPercent}% max single-day share`,
  });

  // 3. Cooldown since last payout (first payout has no cooldown)
  const cooldownPassed =
    record.daysSinceLastPayout === null ||
    record.daysSinceLastPayout >= rules.cooldownDays;
  checks.push({
    rule: "cooldown",
    passed: cooldownPassed,
    detail:
      record.daysSinceLastPayout === null
        ? "first payout — no cooldown"
        : `${record.daysSinceLastPayout} days >= ${rules.cooldownDays} day cooldown`,
  });

  // 4. Compliance — record within configured operational limits
  checks.push({
    rule: "compliance",
    passed: record.withinComplianceLimits,
    detail: record.withinComplianceLimits
      ? "within configured operational limits"
      : "outside configured operational limits",
  });

  // 5. Minimum amount — compute the split, then floor-check it
  const computedAmount = roundCurrency(
    record.totalAmount * (rules.splitPercent / 100),
  );
  checks.push({
    rule: "minimumAmount",
    passed: computedAmount >= rules.minimumPayoutAmount,
    detail: `computed ${computedAmount.toFixed(2)} >= minimum ${rules.minimumPayoutAmount.toFixed(2)}`,
  });

  const failureReasons = checks.filter((c) => !c.passed);

  return {
    eligible: failureReasons.length === 0,
    computedAmount,
    checks,
    failureReasons,
  };
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
