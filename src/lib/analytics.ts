/**
 * Event layer (IA §1 — Phase 2 extension point: "an event layer").
 *
 * One typed catalogue of product events, fanned out to pluggable sinks:
 *   • Vercel Web Analytics custom events (production on Vercel)
 *   • an in-page buffer + console when NEXT_PUBLIC_ANALYTICS_DEBUG=1 (E2E tests,
 *     local debugging) — read it from window.__TM_EVENTS__
 *
 * Privacy: events carry ids, enums, counts and durations only. Never emails,
 * LinkedIn URLs, resume file names or free text.
 *
 * Page views are tracked separately by <Analytics /> in the root layout.
 */

import { track as vercelTrack } from '@vercel/analytics';
import type { Decision } from './types';

type SourceKind = 'aggregated' | 'native';
export type SwipeMethod = 'button' | 'gesture' | 'keyboard' | 'detail';
type OnboardingStep = 'connect' | 'build' | 'target';
export type AuthProvider = 'linkedin' | 'test';

/** The catalogue. Props must stay flat primitives (a Vercel custom-event constraint). */
export interface EventMap {
  // Landing
  landing_cta_clicked: { cta: 'find_roles' | 'post_role' | 'get_started' | 'log_in'; location: 'header' | 'hero' | 'talent' | 'final' | 'menu' };
  landing_demo_swiped: { decision: Decision; method: 'button' | 'gesture' };
  employer_interest_submitted: Record<string, never>;

  // Auth (decision "Auth": Sign in with LinkedIn). Never the name, email or LinkedIn id.
  sign_in_started: { provider: AuthProvider; location: 'connect' | 'signin' };
  sign_in_succeeded: { provider: AuthProvider };
  sign_in_failed: { reason: 'access_denied' | 'configuration' | 'other' };
  sign_out: Record<string, never>;

  // Onboarding funnel (slide 3: 3 steps, under 2 minutes)
  onboarding_step_viewed: { step: OnboardingStep };
  connect_file_rejected: { extension: string };
  connect_submitted: Record<string, never>;
  profile_build_succeeded: { duration_ms: number };
  profile_build_failed: Record<string, never>;
  profile_confirmed: { edited: boolean };
  target_selected: { target: string; suggested: boolean };
  onboarding_completed: { duration_s: number };

  // Deck
  deck_card_shown: { role_id: string; source_kind: SourceKind; position: number };
  swipe: { role_id: string; decision: Decision; source_kind: SourceKind; method: SwipeMethod };
  swipe_failed: { role_id: string };
  swipe_undone: { role_id: string };
  deck_exhausted: { decided: number };
  role_detail_opened: { role_id: string; via: 'in_app' | 'link' };
  apply_out_clicked: { role_id: string; source: string; from: 'detail' | 'saved' };
  saved_removed: { role_id: string };

  // Profile
  profile_updated: Record<string, never>;
  target_changed: { target: string };

  // Phase 1 / 2
  match_created: { role_id: string };
  trial_responded: { response: 'accepted' | 'declined' };
}

export type EventName = keyof EventMap;
type Props = Record<string, string | number | boolean>;
type Sink = (name: EventName, props: Props) => void;

const DEBUG = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === '1';

declare global {
  interface Window {
    __TM_EVENTS__?: { name: EventName; props: Props; at: number }[];
  }
}

const sinks: Sink[] = [
  (name, props) => vercelTrack(name, props),
  ...(DEBUG
    ? [
        ((name, props) => {
          (window.__TM_EVENTS__ ??= []).push({ name, props, at: Date.now() });
          console.debug('[analytics]', name, props);
        }) satisfies Sink,
      ]
    : []),
];

export function track<E extends EventName>(name: E, ...[props]: EventMap[E] extends Record<string, never> ? [] : [EventMap[E]]) {
  if (typeof window === 'undefined') return;
  for (const sink of sinks) {
    try {
      sink(name, (props ?? {}) as Props);
    } catch {
      /* analytics must never break the product */
    }
  }
}

/* ── Onboarding timer (IA §7: the two-minute budget, measured for real) ── */

const START_KEY = 'talentmatch.onboardingStartedAt';

export function markOnboardingStart() {
  try {
    if (!window.sessionStorage.getItem(START_KEY)) window.sessionStorage.setItem(START_KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
}

/** Seconds since the first onboarding screen in this session, then clears the mark. */
export function takeOnboardingDuration(): number | null {
  try {
    const start = Number(window.sessionStorage.getItem(START_KEY));
    window.sessionStorage.removeItem(START_KEY);
    return start ? Math.round((Date.now() - start) / 1000) : null;
  } catch {
    return null;
  }
}
