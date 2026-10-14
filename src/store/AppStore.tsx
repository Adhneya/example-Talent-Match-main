'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { FLAGS } from '@/lib/flags';
import { employerSwipedRight, getRole, postSwipe, uid } from '@/lib/api';
import { track, type SwipeMethod } from '@/lib/analytics';
import type { Decision, Match, OnboardingDraft, Profile, Role, SwipeRecord } from '@/lib/types';

/**
 * State model (IA §5). One owner per domain:
 *   draft    — onboarding draft, client-persisted, cleared once onboarding ends
 *   profile  — confirmed structured profile           (server in production)
 *   ledger   — append-only swipe records               (server in production)
 *   matches  — match records                           (server in production)
 *   saved    — derived: aggregated roles marked Interested, minus removals
 * The deck itself is server-fetched and buffered by the deck component.
 *
 * Until a backend exists, the "server" domains persist to localStorage.
 */

export interface Sources {
  linkedinUrl: string;
  resumeName: string;
}

interface Persisted {
  draft: OnboardingDraft;
  sources: Sources | null;
  profile: Profile | null;
  targetRoleId: string | null;
  ledger: SwipeRecord[];
  unsaved: string[];
  applied: string[];
  matches: Match[];
  notificationsSeenAt: number;
}

export interface Notice {
  id: string;
  tone: 'error' | 'info';
  text: string;
}

const EMPTY_DRAFT: OnboardingDraft = { linkedinUrl: '', resume: null, generated: null };

const EMPTY: Persisted = {
  draft: EMPTY_DRAFT,
  sources: null,
  profile: null,
  targetRoleId: null,
  ledger: [],
  unsaved: [],
  applied: [],
  matches: [],
  notificationsSeenAt: 0,
};

const STORAGE_KEY = 'talentmatch.v1';

/**
 * Where the candidate is in the product. Zones are gated by profile state,
 * not by authentication — the deck never introduces an account step.
 */
export type Stage = 'new' | 'connected' | 'confirmed' | 'live';

export function stageOf(s: Pick<Persisted, 'draft' | 'profile' | 'targetRoleId'>): Stage {
  if (s.profile && s.targetRoleId) return 'live';
  if (s.profile) return 'confirmed';
  if (s.draft.linkedinUrl && s.draft.resume) return 'connected';
  return 'new';
}

/** Fold the ledger into each role's current decision. Undo cancels the record it reverses. */
export function effectiveDecisions(records: SwipeRecord[]) {
  const map = new Map<string, { recordId: string; decision: Decision }>();
  for (const r of records) {
    if (r.kind === 'decision') map.set(r.roleId, { recordId: r.id, decision: r.decision });
    else if (map.get(r.roleId)?.recordId === r.reverses) map.delete(r.roleId);
  }
  return map;
}

interface StoreValue extends Persisted {
  hydrated: boolean;
  stage: Stage;
  pending: SwipeRecord[];
  decisions: Map<string, { recordId: string; decision: Decision }>;
  lastDecision: { recordId: string; role: Role; decision: Decision } | null;
  savedRoles: Role[];
  notice: Notice | null;
  celebrate: string | null;

  setConnect: (linkedinUrl: string, resume: { name: string; size: number }) => void;
  setGenerated: (p: Profile | null) => void;
  confirmProfile: (p: Profile) => void;
  chooseTarget: (targetRoleId: string) => void;
  updateProfile: (p: Profile) => void;
  decide: (role: Role, decision: Decision, method: SwipeMethod) => void;
  undo: () => void;
  removeSaved: (roleId: string) => void;
  markApplied: (roleId: string) => void;
  respondToTrial: (matchId: string, response: 'accepted' | 'declined') => void;
  markNotificationsSeen: () => void;
  dismissNotice: () => void;
  clearCelebrate: () => void;
  reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [pending, setPending] = useState<SwipeRecord[]>([]);
  const [lastDecision, setLastDecision] = useState<StoreValue['lastDecision']>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, [state, hydrated]);

  const flash = useCallback((tone: Notice['tone'], text: string) => {
    window.clearTimeout(noticeTimer.current);
    setNotice({ id: uid(), tone, text });
    noticeTimer.current = window.setTimeout(() => setNotice(null), 4200);
  }, []);

  /** Optimistic write: enqueue, then reconcile with the server's answer. */
  const submit = useCallback(
    (record: SwipeRecord, onFail: () => void, onOk?: () => void) => {
      setPending((p) => [...p, record]);
      postSwipe(record).then(
        () => {
          setPending((p) => p.filter((x) => x.id !== record.id));
          setState((s) => ({ ...s, ledger: [...s.ledger, record] }));
          onOk?.();
        },
        () => {
          setPending((p) => p.filter((x) => x.id !== record.id));
          onFail();
        },
      );
    },
    [],
  );

  const decide = useCallback<StoreValue['decide']>(
    (role, decision, method) => {
      const record: SwipeRecord = { id: uid(), at: Date.now(), roleId: role.id, kind: 'decision', decision };
      setLastDecision({ recordId: record.id, role, decision });
      track('swipe', { role_id: role.id, decision, source_kind: role.source.kind, method });
      submit(
        record,
        () => {
          setLastDecision((l) => (l?.recordId === record.id ? null : l));
          track('swipe_failed', { role_id: role.id });
          flash('error', `Couldn’t save your choice on ${role.company.name}. It’s back on top of the deck.`);
        },
        () => {
          const mutual =
            FLAGS.matches && decision === 'interested' && role.source.kind === 'native' && employerSwipedRight(role.id);
          if (!mutual) return;
          const match: Match = { id: uid(), roleId: role.id, createdAt: Date.now() };
          setState((s) => ({ ...s, matches: [match, ...s.matches] }));
          setLastDecision((l) => (l?.recordId === record.id ? null : l)); // a match can't be undone
          setCelebrate(match.id);
          track('match_created', { role_id: role.id });
        },
      );
    },
    [submit, flash],
  );

  const undo = useCallback(() => {
    if (!lastDecision) return;
    const { recordId, role } = lastDecision;
    const record: SwipeRecord = { id: uid(), at: Date.now(), roleId: role.id, kind: 'undo', reverses: recordId };
    setLastDecision(null);
    track('swipe_undone', { role_id: role.id });
    submit(record, () => flash('error', 'Couldn’t undo that swipe. Try again in a moment.'));
  }, [lastDecision, submit, flash]);

  // Ordered by creation time so an undo confirmed before its decision still folds correctly.
  const decisions = useMemo(
    () => effectiveDecisions([...state.ledger, ...pending].sort((a, b) => a.at - b.at)),
    [state.ledger, pending],
  );

  const savedRoles = useMemo(() => {
    const out: Role[] = [];
    decisions.forEach((d, roleId) => {
      if (d.decision !== 'interested' || state.unsaved.includes(roleId)) return;
      const role = getRole(roleId);
      if (role?.source.kind === 'aggregated') out.push(role);
    });
    return out.reverse(); // most recent first
  }, [decisions, state.unsaved]);

  // Functional updates only, so these are stable for the provider's lifetime.
  const actions = useMemo(
    () => ({
      setConnect: (linkedinUrl: string, resume: { name: string; size: number }) =>
        setState((s) => ({ ...s, draft: { linkedinUrl, resume, generated: null } })),
      setGenerated: (generated: Profile | null) => setState((s) => ({ ...s, draft: { ...s.draft, generated } })),
      confirmProfile: (profile: Profile) =>
        setState((s) => ({
          ...s,
          profile,
          sources: { linkedinUrl: s.draft.linkedinUrl, resumeName: s.draft.resume?.name ?? '' },
        })),
      // Onboarding ends at Target, so the draft is cleared here rather than at confirm.
      chooseTarget: (targetRoleId: string) => setState((s) => ({ ...s, targetRoleId, draft: EMPTY_DRAFT })),
      updateProfile: (profile: Profile) => setState((s) => ({ ...s, profile })),
      removeSaved: (roleId: string) => setState((s) => ({ ...s, unsaved: [...s.unsaved, roleId] })),
      markApplied: (roleId: string) =>
        setState((s) => (s.applied.includes(roleId) ? s : { ...s, applied: [...s.applied, roleId] })),
      respondToTrial: (matchId: string, response: 'accepted' | 'declined') => {
        track('trial_responded', { response });
        setState((s) => ({
          ...s,
          matches: s.matches.map((m) => (m.id === matchId ? { ...m, trialResponse: response } : m)),
        }));
      },
      markNotificationsSeen: () => setState((s) => ({ ...s, notificationsSeenAt: Date.now() })),
      dismissNotice: () => setNotice(null),
      clearCelebrate: () => setCelebrate(null),
      reset: () => {
        setState(EMPTY);
        setPending([]);
        setLastDecision(null);
        setCelebrate(null);
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      },
    }),
    [],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      hydrated,
      stage: stageOf(state),
      pending,
      decisions,
      lastDecision,
      savedRoles,
      notice,
      celebrate,
      decide,
      undo,
      ...actions,
    }),
    [state, hydrated, pending, decisions, lastDecision, savedRoles, notice, celebrate, decide, undo, actions],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within an AppStoreProvider');
  return ctx;
}
