/**
 * Data contracts the UI consumes (slides 7, 8, 10).
 * Two role types travel one deck; `source.kind` is the discriminator and is
 * present from the first fetch so nothing downstream has to infer it.
 */

export type RoleFamily = 'product' | 'design' | 'engineering' | 'data' | 'marketing';

export interface PayRange {
  min: number;
  max: number;
  currency: 'USD';
  period: 'year';
}

export type RoleSource =
  | {
      kind: 'aggregated';
      /** Display name of the feed — vocabulary pending open decision 1. */
      name: string;
      /** Outbound apply link. Aggregated roles are one-sided apply (slide 8). */
      applyUrl: string;
    }
  | {
      kind: 'native';
      employerId: string;
    };

export interface Role {
  id: string;
  family: RoleFamily;
  company: {
    name: string;
    stage: string;
    sector: string;
    location: string; // city, or "Remote (US)"
  };
  title: string;
  summary: string; // the one-line description on the card
  /** null when the listing omits a band — open decision 4. */
  pay: PayRange | null;
  postedDaysAgo: number; // aggregation window is the last 30 days (slide 8)
  about: string[]; // detail-only paragraphs
  keywords: string[];
  source: RoleSource;
  /**
   * Ranking slot reserved on the contract (open decision 3). Populated by the
   * ranker, never rendered on the card until the decision is made.
   */
  fitScore?: number;
}

export interface Salary {
  min: number;
  max: number;
}

export interface Profile {
  roleTitle: string;
  summary: string;
  skills: string[];
  standout: string;
  salary: Salary;
}

export interface OnboardingDraft {
  linkedinUrl: string;
  resume: { name: string; size: number } | null;
  generated: Profile | null;
}

export type Decision = 'pass' | 'interested';

/** Swipes are append-only. Undo appends a compensating record (slide 10). */
export type SwipeRecord =
  | { id: string; at: number; roleId: string; kind: 'decision'; decision: Decision }
  | { id: string; at: number; roleId: string; kind: 'undo'; reverses: string };

/* ── Phase 1: two-sided match (flagged) ──────────────────────── */

export type EngagementPath = 'pass' | 'trial' | 'interview';
export type InterviewStage = 'screen' | 'panel' | 'offer';

export interface Match {
  id: string;
  roleId: string;
  createdAt: number;
  /** Candidate's reply to a trial offer — the only candidate action (slide 6). */
  trialResponse?: 'accepted' | 'declined';
}

export type MatchStatus =
  | { state: 'awaiting' }
  | { state: 'pass' }
  | { state: 'trial'; terms: string }
  | { state: 'interview'; stage: InterviewStage };

/* ── Phase 2: notifications (flagged) ────────────────────────── */

export interface AppNotification {
  id: string;
  at: number;
  kind: 'new-match' | 'employer-action' | 'engagement-update';
  matchId: string;
  title: string;
  body: string;
}
