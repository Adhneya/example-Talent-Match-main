'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from '@/context/FormContext';
import { COMPANIES, type Company } from '@/lib/companies';
import { Heart, Cards, MapPin, Users, Spark, Tick } from '@/components/Icons';
import ChatModal from '@/components/ChatModal';
import { useChat } from '@/hooks/useChat';

type Tab = 'swipe' | 'matches';

export default function DiscoverPage() {
  const { liked, passed, update } = useForm();
  const [tab, setTab] = useState<Tab>('swipe');
  const [matchOf, setMatchOf] = useState<Company | null>(null);
  const { peer, messages, openChat, closeChat, send } = useChat();

  const deck = useMemo(
    () => COMPANIES.filter((c) => !liked.includes(c.id) && !passed.includes(c.id)),
    [liked, passed],
  );
  const current = deck[0];

  function decide(action: 'like' | 'pass') {
    if (!current) return;
    if (action === 'like') {
      update({ liked: [...liked, current.id] });
      setMatchOf(current); // celebrate the match before the next card
    } else {
      update({ passed: [...passed, current.id] });
    }
  }

  const matched = COMPANIES.filter((c) => liked.includes(c.id));

  return (
    <main className="wrap" style={{ paddingBottom: 120 }}>
      <section className="col" style={{ padding: '20px 0 40px' }}>
        <h1 className="t-h1" style={{ textAlign: 'center', marginBottom: 28 }}>
          {tab === 'swipe' ? 'Discover Companies' : 'Your Matches'}
        </h1>

        {tab === 'swipe' ? (
          matchOf ? (
            <MatchScreen company={matchOf} onNext={() => setMatchOf(null)} />
          ) : current ? (
            <SwipeDeck company={current} onDecide={decide} />
          ) : (
            <EmptyDeck count={matched.length} onSeeMatches={() => setTab('matches')} />
          )
        ) : (
          <MatchesList
            companies={matched}
            onBack={() => setTab('swipe')}
            hasDeck={!!current}
            onChat={(c) => openChat({ id: c.id, name: c.name, subtitle: c.tagline })}
          />
        )}
      </section>

      <ChatModal peer={peer} messages={messages} onSend={send} onClose={closeChat} />
      <BottomNav tab={tab} setTab={setTab} matchCount={matched.length} />
    </main>
  );
}

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

function SwipeDeck({ company, onDecide }: { company: Company; onDecide: (a: 'like' | 'pass') => void }) {
  const reduced = useReducedMotion();
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<null | 'like' | 'pass'>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const lastX = useRef(0);
  const lastT = useRef(0);
  const vel = useRef(0);
  const decided = useRef(false);

  // New card → reset swipe state (deck + buttons stay mounted/focusable).
  useEffect(() => {
    setDx(0);
    setDragging(false);
    setExit(null);
    decided.current = false;
    vel.current = 0;
  }, [company.id]);

  const commit = (action: 'like' | 'pass') => {
    if (exit || decided.current) return;
    setDragging(false);
    setExit(action);
  };

  // Keyboard: ← pass, → interested (the buttons are focusable too).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') commit('pass');
      else if (e.key === 'ArrowRight') commit('like');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exit]);

  function onPointerDown(e: React.PointerEvent) {
    if (exit) return;
    if ((e.target as HTMLElement).closest('button')) return; // let buttons fire their own click
    setDragging(true);
    startX.current = e.clientX;
    lastX.current = e.clientX;
    lastT.current = e.timeStamp;
    vel.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dt = e.timeStamp - lastT.current;
    if (dt > 0) vel.current = (e.clientX - lastX.current) / dt;
    lastX.current = e.clientX;
    lastT.current = e.timeStamp;
    setDx(e.clientX - startX.current);
  }
  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    const width = deckRef.current?.offsetWidth ?? 320;
    const dist = width * 0.35; // 35% of card width
    const fast = Math.abs(vel.current) > 0.6; // px/ms — velocity-based commit
    if (dx > dist || (fast && vel.current > 0)) commit('like');
    else if (dx < -dist || (fast && vel.current < 0)) commit('pass');
    else setDx(0); // spring back to center
  }

  function onTransitionEnd(e: React.TransitionEvent) {
    const finished = e.propertyName === 'transform' || (reduced && e.propertyName === 'opacity');
    if (exit && !decided.current && finished) {
      decided.current = true;
      onDecide(exit);
    }
  }

  const width = deckRef.current?.offsetWidth ?? 320;
  const dir = exit === 'like' ? 1 : exit === 'pass' ? -1 : 0;
  const rot = reduced ? 0 : Math.max(-12, Math.min(12, dx * 0.05));

  const transform = exit
    ? reduced
      ? 'translateX(0) rotate(0deg)'
      : `translateX(${dir * 110}%) rotate(${dir * 10}deg)`
    : `translateX(${dx}px) rotate(${rot}deg)`;
  const opacity = exit ? 0 : 1 - Math.min(Math.abs(dx) / width, 1) * 0.85;
  const transition = dragging
    ? 'none'
    : exit
      ? reduced
        ? 'opacity 180ms ease'
        : 'transform 350ms cubic-bezier(0.4,0,0.2,1), opacity 320ms ease'
      : 'transform 300ms cubic-bezier(0.22,0.61,0.36,1), opacity 200ms ease';

  // Directional drag cue (subtle tint): green = interested, grey = pass.
  const cue = Math.min(Math.abs(dx) / (width * 0.35), 1) * 0.16;
  const tint = dx > 4 ? `rgba(22,163,74,${cue})` : dx < -4 ? `rgba(7,11,22,${cue})` : 'transparent';

  // Borderless while in motion (drag / fly-out); bordered card only at rest.
  const moving = dragging || exit !== null;

  return (
    <div>
      <div className="stage" ref={deckRef}>
        <div key={company.id} className="stage__enter">
          <div
            className="stage__card card"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onTransitionEnd={onTransitionEnd}
            style={{
              transform,
              opacity,
              transition,
              cursor: dragging ? 'grabbing' : 'grab',
              border: moving ? '1px solid transparent' : undefined,
              boxShadow: moving ? 'none' : undefined,
            }}
          >
            <h2 className="t-h1">{company.name}</h2>
            <p className="t-lead" style={{ marginTop: 6 }}>
              {company.tagline}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
              <span className="pill">
                <MapPin /> {company.location}
              </span>
              <span className="pill">
                <Users /> {company.size}
              </span>
              <span className="pill">
                <Spark /> {company.stage}
              </span>
            </div>

            <div
              style={{
                marginTop: 22,
                padding: '18px 22px',
                borderRadius: 14,
                background: 'var(--accent-tint)',
                border: '1px solid var(--accent-line)',
              }}
            >
              <span style={{ fontSize: '1.12rem', fontWeight: 700, color: 'var(--accent-ink)' }}>{company.trial}</span>
            </div>

            <p className="t-body t-muted" style={{ marginTop: 22 }}>
              {company.brief}
            </p>

            {/* Directional drag cue */}
            <div className="stage__tint" style={{ background: tint }} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="stage__actions">
        <button className="btn btn--neutral btn--lg" onClick={() => commit('pass')}>
          Pass
        </button>
        <button className="btn btn--primary btn--lg" onClick={() => commit('like')}>
          Interested →
        </button>
      </div>
    </div>
  );
}

/* ── "It's a match" interstitial (after a right swipe / like) ── */
function MatchScreen({ company, onNext }: { company: Company; onNext: () => void }) {
  return (
    <div className="card reveal" style={{ padding: '44px 36px 36px', textAlign: 'center' }}>
      <span className="eyebrow" style={{ color: 'var(--accent-ink)' }}>
        It’s a match
      </span>

      <div
        style={{
          width: 76,
          height: 76,
          margin: '22px auto 24px',
          borderRadius: '50%',
          background: '#16a34a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 16px 36px -16px rgba(22,163,74,0.6)',
          animation: 'popIn 0.42s cubic-bezier(0.22,1.2,0.36,1) both',
        }}
      >
        <Tick size={36} style={{ color: '#fff' }} />
      </div>

      <h2 className="t-h2">{company.name} is interested too</h2>

      <div style={{ textAlign: 'left', marginTop: 26 }}>
        <span className="eyebrow" style={{ color: 'var(--accent-ink)' }}>
          Why this matched
        </span>
        <p className="t-body t-muted" style={{ marginTop: 10 }}>
          Your work maps straight onto {company.name}’s roadmap, and interest is high on both
          sides — so we’ve turned this into a {company.trial}, skipping the interview loop.
        </p>
      </div>

      <button className="btn btn--primary btn--lg btn--block" style={{ marginTop: 30 }} onClick={onNext}>
        See next role →
      </button>
    </div>
  );
}

function EmptyDeck({ count, onSeeMatches }: { count: number; onSeeMatches: () => void }) {
  return (
    <div className="card" style={{ padding: '48px 34px', textAlign: 'center' }}>
      <h2 className="t-h2">You&apos;ve seen everyone for now.</h2>
      <p className="t-body t-muted" style={{ marginTop: 12 }}>
        {count > 0
          ? `You matched with ${count} ${count === 1 ? 'company' : 'companies'}.`
          : 'No matches yet — check back as new companies join.'}
      </p>
      {count > 0 && (
        <button className="btn btn--primary btn--lg" style={{ marginTop: 24 }} onClick={onSeeMatches}>
          View matches
        </button>
      )}
    </div>
  );
}

function MatchesList({
  companies,
  onBack,
  hasDeck,
  onChat,
}: {
  companies: Company[];
  onBack: () => void;
  hasDeck: boolean;
  onChat: (c: Company) => void;
}) {
  if (companies.length === 0) {
    return (
      <div className="card" style={{ padding: '48px 34px', textAlign: 'center' }}>
        <h2 className="t-h2">No matches yet.</h2>
        <p className="t-body t-muted" style={{ marginTop: 12 }}>
          Swipe right on a company to start a conversation.
        </p>
        {hasDeck && (
          <button className="btn btn--primary btn--lg" style={{ marginTop: 24 }} onClick={onBack}>
            Back to swiping
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {companies.map((c) => (
        <div key={c.id} className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <h3 className="t-h3">{c.name}</h3>
            <span className="t-label" style={{ color: 'var(--accent-ink)', flex: '0 0 auto' }}>
              Matched
            </span>
          </div>
          <p className="t-body t-muted" style={{ marginTop: 4 }}>
            {c.tagline}
          </p>
          <p style={{ marginTop: 12, fontSize: '0.92rem', fontWeight: 600, color: 'var(--accent-ink)' }}>{c.trial}</p>
          <button className="btn btn--primary btn--block" style={{ marginTop: 16 }} onClick={() => onChat(c)}>
            Open Chat
          </button>
        </div>
      ))}
    </div>
  );
}

function BottomNav({ tab, setTab, matchCount }: { tab: Tab; setTab: (t: Tab) => void; matchCount: number }) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid var(--hairline)',
        display: 'flex',
        justifyContent: 'center',
        gap: 80,
        padding: '12px 0 calc(env(safe-area-inset-bottom, 0px) + 16px)',
      }}
    >
      <NavItem active={tab === 'swipe'} onClick={() => setTab('swipe')} label="Swipe">
        <Cards />
      </NavItem>
      <NavItem active={tab === 'matches'} onClick={() => setTab('matches')} label="Matches" badge={matchCount}>
        <Heart filled={tab === 'matches'} size={22} />
      </NavItem>
    </nav>
  );
}

function NavItem({
  active,
  onClick,
  label,
  children,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        background: 'transparent',
        border: 'none',
        color: active ? 'var(--accent-ink)' : 'var(--muted)',
        fontWeight: 600,
        fontSize: '0.8rem',
        position: 'relative',
      }}
    >
      {children}
      <span>{label}</span>
      {badge ? (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: 2,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            borderRadius: 999,
            background: 'var(--accent-ink)',
            color: '#fff',
            fontSize: '0.66rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
