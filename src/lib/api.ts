/**
 * Mock service layer. Every call is async with latency so the UI is built
 * against the same shape a real backend will have.
 *
 * Failure injection for testing the derived error states — set in DevTools:
 *   localStorage.setItem('talentmatch.debug', 'swipe-fail')   // server rejects swipes
 *   localStorage.setItem('talentmatch.debug', 'parse-fail')   // profile engine fails
 * (comma-separate to combine). A resume whose filename contains "unreadable"
 * also fails to parse.
 */

import { FLAGS } from './flags';
import { AGGREGATED_ROLES, NATIVE_ROLES, TARGET_ROLES } from './fixtures/roles';
import type {
  AppNotification,
  InterviewStage,
  Match,
  MatchStatus,
  OnboardingDraft,
  Profile,
  Role,
  SwipeRecord,
} from './types';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function debug(name: string) {
  try {
    return (window.localStorage.getItem('talentmatch.debug') || '').split(',').includes(name);
  } catch {
    return false;
  }
}

export function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

/* ── Profile engine (slide 4) ──────────────────────────────────── */

export const PROCESSING_STEPS = [
  'Parse and normalize skills, roles and achievements',
  'Map your experience to role requirements',
  'Rank and surface your strongest highlights',
  'Store as a structured profile',
] as const;

const STEP_MS = [1100, 900, 900, 600];

export class ParseError extends Error {}

export async function buildProfile(
  draft: OnboardingDraft,
  onStep: (index: number) => void,
  signal: AbortSignal,
): Promise<Profile> {
  for (let i = 0; i < PROCESSING_STEPS.length; i++) {
    onStep(i);
    await wait(STEP_MS[i]);
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    const unreadable = draft.resume?.name.toLowerCase().includes('unreadable');
    if (i === 0 && (unreadable || debug('parse-fail'))) {
      throw new ParseError('We couldn’t read that resume.');
    }
  }
  onStep(PROCESSING_STEPS.length);
  return {
    roleTitle: 'Senior Product Manager',
    summary: '7 years in B2B SaaS product, most recently leading payments at a Series C fintech.',
    skills: ['Roadmapping', 'User Research', 'SQL', 'A/B Testing', 'Stakeholder Management', 'Payments'],
    standout: 'Launched usage-based billing that lifted net revenue retention from 104% to 118%.',
    salary: { min: 160000, max: 185000 },
  };
}

/* ── Inventory + match & rank v1 (slide 10: rules + keyword weighting) ── */

type InventoryRole = Role & { demoEmployer?: (typeof NATIVE_ROLES)[number]['demoEmployer'] };

function inventory(): InventoryRole[] {
  // Phase 0 is a deck on aggregated jobs only; native roles arrive with Phase 1.
  return FLAGS.matches ? [...NATIVE_ROLES, ...AGGREGATED_ROLES] : AGGREGATED_ROLES;
}

export function getRole(id: string): Role | undefined {
  return inventory().find((r) => r.id === id);
}

export function rank(roles: Role[], profile: Profile, targetRoleId: string): Role[] {
  const family = TARGET_ROLES.find((t) => t.id === targetRoleId)?.family;
  const skills = profile.skills.map((s) => s.toLowerCase());
  return roles
    .map((r) => {
      let score = r.family === family ? 10 : 0;
      score += r.keywords.filter((k) => skills.includes(k)).length * 2;
      if (r.pay && r.pay.max >= profile.salary.min) score += 1;
      score += Math.max(0, 30 - r.postedDaysAgo) / 30; // freshness tiebreak
      return { ...r, fitScore: score };
    })
    .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
}

export async function fetchDeck(profile: Profile, targetRoleId: string): Promise<Role[]> {
  await wait(350);
  return rank(inventory(), profile, targetRoleId);
}

/* ── Swipe ledger ──────────────────────────────────────────────── */

export async function postSwipe(record: SwipeRecord): Promise<void> {
  await wait(260);
  if (debug('swipe-fail')) throw new Error('Swipe rejected');
}

/** Phase 1: has the employer behind a native role already swiped right on this candidate? */
export function employerSwipedRight(roleId: string): boolean {
  const role = inventory().find((r) => r.id === roleId);
  return role?.source.kind === 'native' && !!role.demoEmployer?.likesCandidate;
}

/* ── Engagement (slide 6) — employer-owned, derived for the demo ── */

const EMPLOYER_DECIDES_AFTER = 15_000;

function interviewStage(elapsed: number): InterviewStage {
  if (elapsed > 90_000) return 'offer';
  if (elapsed > 45_000) return 'panel';
  return 'screen';
}

export function matchStatus(match: Match, now: number): MatchStatus {
  const role = inventory().find((r) => r.id === match.roleId);
  const elapsed = now - match.createdAt;
  if (!role?.demoEmployer || elapsed < EMPLOYER_DECIDES_AFTER) return { state: 'awaiting' };
  const { path, trialTerms } = role.demoEmployer;
  if (path === 'pass') return { state: 'pass' };
  if (path === 'trial') return { state: 'trial', terms: trialTerms ?? '3 weeks · paid' };
  return { state: 'interview', stage: interviewStage(elapsed) };
}

/* ── Notifications (slide 10: new match, employer action, trial/interview updates) ── */

export function deriveNotifications(matches: Match[], now: number): AppNotification[] {
  const out: AppNotification[] = [];
  for (const m of matches) {
    const role = getRole(m.roleId);
    if (!role) continue;
    out.push({
      id: `${m.id}:match`,
      at: m.createdAt,
      kind: 'new-match',
      matchId: m.id,
      title: `It’s a match with ${role.company.name}`,
      body: role.title,
    });
    const status = matchStatus(m, now);
    if (status.state === 'awaiting') continue;
    const at = m.createdAt + EMPLOYER_DECIDES_AFTER;
    if (status.state === 'pass') {
      out.push({ id: `${m.id}:pass`, at, kind: 'employer-action', matchId: m.id, title: `${role.company.name} closed this match`, body: role.title });
    } else if (status.state === 'trial') {
      out.push({ id: `${m.id}:trial`, at, kind: 'employer-action', matchId: m.id, title: `${role.company.name} offered a paid trial`, body: status.terms });
    } else {
      out.push({ id: `${m.id}:interview`, at, kind: 'employer-action', matchId: m.id, title: `${role.company.name} started interviews`, body: 'First stage: screen' });
      if (status.stage !== 'screen') {
        out.push({ id: `${m.id}:${status.stage}`, at: m.createdAt + (status.stage === 'panel' ? 45_000 : 90_000), kind: 'engagement-update', matchId: m.id, title: `${role.company.name}: moved to ${status.stage}`, body: role.title });
      }
    }
  }
  return out.sort((a, b) => b.at - a.at);
}
