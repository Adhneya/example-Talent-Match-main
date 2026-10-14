'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/store/AppStore';
import { fetchDeck } from '@/lib/api';
import { track, type SwipeMethod } from '@/lib/analytics';
import { TARGET_ROLES } from '@/lib/fixtures/roles';
import type { Decision, Role } from '@/lib/types';
import { Cards, Cross, Heart, Undo } from '@/components/Icons';
import { CompanyHeader, PayRangePanel, RoleSummary, SourceBadge } from '@/components/RoleCard';
import MatchCelebrationModal from '@/components/MatchCelebrationModal';

/**
 * Tracks whether the detail sheet was opened from inside the app, so closing
 * it can go back (preserving history) rather than pushing a duplicate entry.
 * Resets naturally on a full page load of a shared /swipe/[roleId] link.
 */
export const detailNav = { openedInApp: false };

/** S-06 Swipe deck. Server-fetched, client-buffered; decisions are optimistic (slide 10). */
export default function SwipeDeck() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, targetRoleId, decisions, decide, lastDecision, undo, savedRoles, celebrate, matches } = useStore();
  const [queue, setQueue] = useState<Role[] | null>(null);
  const [checking, setChecking] = useState(false);
  const detailOpen = pathname !== '/swipe';

  useEffect(() => {
    if (!profile || !targetRoleId) return;
    let live = true;
    fetchDeck(profile, targetRoleId).then((roles) => live && setQueue(roles));
    return () => {
      live = false;
    };
  }, [profile, targetRoleId]);

  async function checkForNew() {
    if (!profile || !targetRoleId) return;
    setChecking(true);
    setQueue(await fetchDeck(profile, targetRoleId));
    setChecking(false);
  }

  const deck = useMemo(() => (queue ?? []).filter((r) => !decisions.has(r.id)), [queue, decisions]);
  const top = deck[0];
  const target = TARGET_ROLES.find((t) => t.id === targetRoleId);
  const celebrating = celebrate ? matches.find((m) => m.id === celebrate) : undefined;

  // Impressions: the denominator for swipe-through rates.
  useEffect(() => {
    if (!top || !queue) return;
    track('deck_card_shown', { role_id: top.id, source_kind: top.source.kind, position: queue.indexOf(top) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top?.id]);

  // Exhaustion, once per transition from "has cards" to "empty".
  const exhausted = queue !== null && !top;
  useEffect(() => {
    if (exhausted) track('deck_exhausted', { decided: decisions.size });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exhausted]);

  const openDetail = useCallback(
    (r: Role) => {
      detailNav.openedInApp = true;
      router.push(`/swipe/${r.id}`);
    },
    [router],
  );

  // ⌘/Ctrl+Z undoes the last swipe.
  useEffect(() => {
    if (detailOpen || celebrating) return;
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'z' && (e.metaKey || e.ctrlKey) && lastDecision) {
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailOpen, celebrating, lastDecision, undo]);

  return (
    <div className={`deck${detailOpen ? ' deck--detail' : ''}`}>
      <h1 className="sr-only">Swipe deck{target ? ` — ${target.label} roles` : ''}</h1>

      {queue === null ? (
        <DeckLoading />
      ) : top ? (
        <CardStack
          role={top}
          behind={Math.min(2, deck.length - 1)}
          onDecide={(d, method) => decide(top, d, method)}
          onOpen={() => openDetail(top)}
          keyboard={!detailOpen && !celebrating}
        />
      ) : (
        <DeckEmptyState
          targetLabel={target?.label}
          savedCount={savedRoles.length}
          checking={checking}
          onCheck={checkForNew}
        />
      )}

      <div className="deck__sub" style={top ? undefined : { justifyContent: 'center' }}>
        <UndoControl />
        {top && !lastDecision && (
          <>
            <span className="deck__hint deck__hint--keys">← Pass · → Interested · Interested saves the role</span>
            <span className="deck__hint deck__hint--touch">Swipe right if interested, left to pass</span>
          </>
        )}
      </div>

      {celebrating && <MatchCelebrationModal match={celebrating} />}
    </div>
  );
}

/* ── CardStack — gesture + buttons, optimistic advance ───────────── */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

function CardStack({
  role,
  behind,
  onDecide,
  onOpen,
  keyboard,
}: {
  role: Role;
  behind: number;
  onDecide: (d: Decision, method: SwipeMethod) => void;
  onOpen: () => void;
  keyboard: boolean;
}) {
  const reduced = useReducedMotion();
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<Decision | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const lastX = useRef(0);
  const lastT = useRef(0);
  const vel = useRef(0);
  const moved = useRef(0);
  // Ref mirror of `dragging`: pointerdown and pointerup can land in the same frame on a quick tap.
  const draggingRef = useRef(false);
  const decided = useRef(false);
  const exitRef = useRef<Decision | null>(null);
  const methodRef = useRef<SwipeMethod>('button');
  const onDecideRef = useRef(onDecide);
  onDecideRef.current = onDecide;

  // New card at the head → reset gesture state.
  useEffect(() => {
    setDx(0);
    setDragging(false);
    setExit(null);
    exitRef.current = null;
    decided.current = false;
    vel.current = 0;
  }, [role.id]);

  const finish = useCallback(() => {
    if (decided.current || !exitRef.current) return;
    decided.current = true;
    onDecideRef.current(exitRef.current, methodRef.current);
  }, []);

  const commit = useCallback((d: Decision, method: SwipeMethod) => {
    if (exitRef.current || decided.current) return;
    exitRef.current = d;
    methodRef.current = method;
    setDragging(false);
    setExit(d);
  }, []);

  // Safety net in case transitionend never fires (e.g. background tab).
  useEffect(() => {
    if (!exit) return;
    const t = window.setTimeout(finish, 480);
    return () => window.clearTimeout(t);
  }, [exit, finish]);

  useEffect(() => {
    if (!keyboard) return;
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || el?.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'ArrowLeft') commit('pass', 'keyboard');
      else if (e.key === 'ArrowRight') commit('interested', 'keyboard');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyboard, commit]);

  function onPointerDown(e: React.PointerEvent) {
    if (exit) return;
    if ((e.target as HTMLElement).closest('button, a')) return; // let controls fire their own click
    draggingRef.current = true;
    setDragging(true);
    startX.current = e.clientX;
    lastX.current = e.clientX;
    lastT.current = e.timeStamp;
    vel.current = 0;
    moved.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const dt = e.timeStamp - lastT.current;
    if (dt > 0) vel.current = (e.clientX - lastX.current) / dt;
    lastX.current = e.clientX;
    lastT.current = e.timeStamp;
    const next = e.clientX - startX.current;
    moved.current = Math.max(moved.current, Math.abs(next));
    setDx(next);
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    if (moved.current < 6) {
      setDx(0);
      onOpen(); // a tap on the card body opens detail, one tap deeper (slide 5)
      return;
    }
    const width = stackRef.current?.offsetWidth ?? 320;
    const dist = width * 0.33;
    const fast = Math.abs(vel.current) > 0.6; // px/ms — velocity-based commit
    const offset = e.clientX - startX.current;
    if (offset > dist || (fast && vel.current > 0)) commit('interested', 'gesture');
    else if (offset < -dist || (fast && vel.current < 0)) commit('pass', 'gesture');
    else setDx(0); // spring back
  }
  function onPointerCancel() {
    draggingRef.current = false;
    setDragging(false);
    setDx(0);
  }
  function onTransitionEnd(e: React.TransitionEvent) {
    if (e.target !== e.currentTarget) return;
    const done = e.propertyName === 'transform' || (reduced && e.propertyName === 'opacity');
    if (exit && done) finish();
  }

  const width = stackRef.current?.offsetWidth ?? 320;
  const dir = exit === 'interested' ? 1 : exit === 'pass' ? -1 : 0;
  const rot = reduced ? 0 : Math.max(-12, Math.min(12, dx * 0.05));
  const transform = exit
    ? reduced
      ? 'none'
      : `translateX(${dir * 120}%) rotate(${dir * 12}deg)`
    : `translateX(${dx}px) rotate(${rot}deg)`;
  const opacity = exit ? 0 : 1 - Math.min(Math.abs(dx) / width, 1) * 0.6;
  const transition = dragging
    ? 'none'
    : exit
      ? reduced
        ? 'opacity 160ms ease'
        : 'transform 320ms cubic-bezier(0.4,0,0.2,1), opacity 300ms ease'
      : 'transform 280ms cubic-bezier(0.22,0.61,0.36,1), opacity 200ms ease';

  const strength = Math.min(Math.abs(dx) / (width * 0.33), 1);
  const yes = dx > 4 ? strength : 0;
  const no = dx < -4 ? strength : 0;

  return (
    <>
      <div className="deck__stack" ref={stackRef}>
        {behind >= 2 && <div className="deck__ghost deck__ghost--2" aria-hidden="true" />}
        {behind >= 1 && <div className="deck__ghost deck__ghost--1" aria-hidden="true" />}
        <div key={role.id} className="deck__top">
          <div
            className="rolecard"
            role="group"
            aria-roledescription="role card"
            aria-label={`${role.company.name}: ${role.title}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onTransitionEnd={onTransitionEnd}
            style={{ transform, opacity, transition, cursor: dragging ? 'grabbing' : 'grab' }}
          >
            <CompanyHeader role={role} />
            <div className="rolecard__body">
              <RoleSummary role={role} />
              <div className="rolecard__foot">
                <SourceBadge role={role} />
                <button type="button" className="rolecard__more" onClick={onOpen}>
                  More details
                </button>
              </div>
            </div>
            <PayRangePanel role={role} />

            <span className="rolecard__stamp rolecard__stamp--yes" style={{ opacity: yes }} aria-hidden="true">
              Interested
            </span>
            <span className="rolecard__stamp rolecard__stamp--no" style={{ opacity: no }} aria-hidden="true">
              Pass
            </span>
          </div>
        </div>
      </div>

      <div className="actionbar">
        <button className="btn btn--pass btn--lg" onClick={() => commit('pass', 'button')} aria-keyshortcuts="ArrowLeft">
          <Cross size={20} /> Pass
        </button>
        <button
          className="btn btn--interested btn--lg"
          onClick={() => commit('interested', 'button')}
          aria-keyshortcuts="ArrowRight"
        >
          <Heart size={20} /> Interested
        </button>
      </div>
    </>
  );
}

/* ── UndoControl — last swipe only (slide 10) ─────────────────────── */

function UndoControl() {
  const { lastDecision, undo } = useStore();
  return (
    <div aria-live="polite">
      {lastDecision && (
        <button key={lastDecision.recordId} className="undo" onClick={undo} aria-keyshortcuts="Control+Z Meta+Z">
          <Undo size={16} />
          <span>
            {lastDecision.decision === 'interested'
              ? `Saved ${lastDecision.role.company.name}`
              : `Passed on ${lastDecision.role.company.name}`}
            {' · '}
            <strong>Undo</strong>
          </span>
        </button>
      )}
    </div>
  );
}

/* ── Derived surfaces ─────────────────────────────────────────────── */

function DeckLoading() {
  return (
    <div className="deck__stack" aria-busy="true">
      <div className="deck__ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="t-fine">Finding roles for you…</span>
      </div>
    </div>
  );
}

/** Deck exhausted — derived from slide 8's "feel alive on day one" reasoning. */
function DeckEmptyState({
  targetLabel,
  savedCount,
  checking,
  onCheck,
}: {
  targetLabel?: string;
  savedCount: number;
  checking: boolean;
  onCheck: () => void;
}) {
  return (
    <div className="card empty fade-in">
      <div className="empty__icon">
        <Cards size={28} />
      </div>
      <h2 className="t-h2">You’re all caught up</h2>
      <p className="t-body t-muted" style={{ marginTop: 10 }}>
        You’ve seen every live {targetLabel ? `${targetLabel} ` : ''}role we have right now. New listings from the last 30
        days arrive daily.
      </p>
      <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
        {savedCount > 0 && (
          <Link href="/saved" className="btn btn--primary btn--lg btn--block">
            Review {savedCount} saved {savedCount === 1 ? 'role' : 'roles'}
          </Link>
        )}
        <button className="btn btn--lg btn--block" onClick={onCheck} disabled={checking}>
          {checking ? 'Checking…' : 'Check for new roles'}
        </button>
        <Link href="/profile#target" className="link" style={{ marginTop: 6 }}>
          Change target role
        </Link>
      </div>
    </div>
  );
}
