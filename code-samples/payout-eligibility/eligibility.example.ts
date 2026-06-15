/**
 * Usage example for the payout-eligibility engine. Illustrative, synthetic data only.
 *
 * Run with: `npx tsx eligibility.example.ts` (after `npm install`), or just read it.
 */

import {
  evaluatePayoutEligibility,
  type PayoutRuleset,
  type RecordSnapshot,
} from "./eligibility";

const standardRuleset: PayoutRuleset = {
  minQualifyingDays: 5,
  consistencyMaxDayPercent: 40,
  cooldownDays: 14,
  minimumPayoutAmount: 100,
  splitPercent: 80,
};

// An eligible record.
const eligibleRecord: RecordSnapshot = {
  qualifyingDays: 9,
  largestSingleDaySharePercent: 28,
  daysSinceLastPayout: 21,
  totalAmount: 300,
  withinComplianceLimits: true,
};

// A record that should fail on cooldown and minimum amount.
const rejectedRecord: RecordSnapshot = {
  qualifyingDays: 6,
  largestSingleDaySharePercent: 35,
  daysSinceLastPayout: 6,
  totalAmount: 75,
  withinComplianceLimits: true,
};

function show(label: string, record: RecordSnapshot): void {
  const result = evaluatePayoutEligibility(record, standardRuleset);
  // eslint-disable-next-line no-console
  console.log(`\n${label}: ${result.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}`);
  // eslint-disable-next-line no-console
  console.log(`  computed amount: ${result.computedAmount.toFixed(2)}`);
  if (result.failureReasons.length > 0) {
    for (const reason of result.failureReasons) {
      // eslint-disable-next-line no-console
      console.log(`  ✗ ${reason.rule}: ${reason.detail}`);
    }
  }
}

show("Eligible example", eligibleRecord);
show("Rejected example", rejectedRecord);
