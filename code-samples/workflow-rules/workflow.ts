/**
 * Workflow rules — illustrative, standalone state machine.
 *
 * Sanitized reconstruction of the PATTERN BlixFlex uses to model operational workflows
 * (e.g. onboarding) as explicit states with guarded transitions. Modeling workflows this
 * way makes them observable, testable, and automatable instead of implicit in habits.
 *
 * No production dependencies; no real data.
 */

/** The ordered states a participant moves through during onboarding. */
export type OnboardingState =
  | "application_approved"
  | "account_setup"
  | "agreement_signed"
  | "payment_complete"
  | "discord_linked"
  | "orientation_done"
  | "tracking_active"
  | "fully_onboarded";

export const ONBOARDING_ORDER: OnboardingState[] = [
  "application_approved",
  "account_setup",
  "agreement_signed",
  "payment_complete",
  "discord_linked",
  "orientation_done",
  "tracking_active",
  "fully_onboarded",
];

/** Facts about a participant a guard may consult before allowing a transition. */
export interface ParticipantContext {
  hasAccount: boolean;
  agreementSigned: boolean;
  paymentComplete: boolean;
  discordLinked: boolean;
  orientationComplete: boolean;
  trackingActive: boolean;
}

/** A guard returns ok=true to allow a transition, or a reason it's blocked. */
type Guard = (ctx: ParticipantContext) => { ok: true } | { ok: false; reason: string };

const always: Guard = () => ({ ok: true });

/**
 * Each state maps to the guard that must pass to ADVANCE OUT of it.
 * Guards reference context so transitions are deterministic and explainable.
 */
const GUARDS: Record<OnboardingState, Guard> = {
  application_approved: (ctx) =>
    ctx.hasAccount ? { ok: true } : { ok: false, reason: "account not set up" },
  account_setup: (ctx) =>
    ctx.agreementSigned ? { ok: true } : { ok: false, reason: "agreement not signed" },
  agreement_signed: (ctx) =>
    ctx.paymentComplete ? { ok: true } : { ok: false, reason: "payment not complete" },
  payment_complete: (ctx) =>
    ctx.discordLinked ? { ok: true } : { ok: false, reason: "community access not linked" },
  discord_linked: (ctx) =>
    ctx.orientationComplete ? { ok: true } : { ok: false, reason: "orientation not complete" },
  orientation_done: (ctx) =>
    ctx.trackingActive ? { ok: true } : { ok: false, reason: "account tracking not active" },
  tracking_active: always,
  fully_onboarded: always,
};

export interface TransitionResult {
  moved: boolean;
  from: OnboardingState;
  to: OnboardingState;
  reason?: string;
}

/** Index of a state in the canonical order. */
function indexOf(state: OnboardingState): number {
  return ONBOARDING_ORDER.indexOf(state);
}

/** The next state after `state`, or null if already terminal. */
export function nextState(state: OnboardingState): OnboardingState | null {
  const i = indexOf(state);
  return i >= 0 && i < ONBOARDING_ORDER.length - 1 ? ONBOARDING_ORDER[i + 1] : null;
}

/**
 * Attempt to advance one step. Only moves forward, only by one state, and only if the
 * guard for the current state passes. Returns a structured result either way.
 */
export function advance(
  current: OnboardingState,
  ctx: ParticipantContext,
): TransitionResult {
  const target = nextState(current);
  if (target === null) {
    return { moved: false, from: current, to: current, reason: "already fully onboarded" };
  }
  const guard = GUARDS[current](ctx);
  if (!guard.ok) {
    return { moved: false, from: current, to: target, reason: guard.reason };
  }
  return { moved: true, from: current, to: target };
}

/** Progress as a percentage (0–100) through the onboarding order. */
export function progressPercent(state: OnboardingState): number {
  const i = indexOf(state);
  if (i < 0) return 0;
  return Math.round((i / (ONBOARDING_ORDER.length - 1)) * 100);
}

/**
 * A participant is "stalled" if they've been in the same state past a threshold without
 * advancing. This drives the scheduled reminder automation.
 */
export function isStalled(daysInCurrentState: number, thresholdDays: number): boolean {
  return daysInCurrentState >= thresholdDays;
}
