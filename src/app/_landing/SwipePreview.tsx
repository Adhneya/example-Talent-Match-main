'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Cross, Heart } from '@/components/Icons';
import { RoleCardFace } from '@/components/RoleCard';
import { track } from '@/lib/analytics';
import type { Role } from '@/lib/types';
import s from './landing.module.css';

type DemoRole = Pick<Role, 'company' | 'title' | 'summary' | 'pay' | 'postedDaysAgo'> & { match: boolean };
const pay = (min: number, max: number): Role['pay'] => ({ min, max, currency: 'USD', period: 'year' });

/** Sample cards for the hero demo — fictional companies, rendered by the app's own card face. */
const DEMO: DemoRole[] = [
  {
    company: { name: 'Ledgerly', stage: 'Series C', sector: 'Fintech', location: 'Remote (US)' },
    title: 'Senior Product Manager, Payments',
    summary: 'Lead card issuing and usage-based billing for SMB finance teams.',
    pay: pay(175000, 210000),
    postedDaysAgo: 2,
    match: true,
  },
  {
    company: { name: 'Acme Freight', stage: 'Series B', sector: 'Logistics', location: 'San Francisco, CA' },
    title: 'Senior Product Manager, Shipper Platform',
    summary: 'Own the self-serve booking flow used by 4,000 mid-market shippers.',
    pay: pay(165000, 195000),
    postedDaysAgo: 3,
    match: false,
  },
  {
    company: { name: 'Northwind Labs', stage: 'Seed', sector: 'Developer tools', location: 'Remote (US)' },
    title: 'Founding Product Manager',
    summary: 'First PM hire — shape onboarding and activation for an API-first product.',
    pay: pay(150000, 180000),
    postedDaysAgo: 6,
    match: true,
  },
  {
    company: { name: 'Cadence', stage: 'Series C', sector: 'Productivity', location: 'New York, NY' },
    title: 'Product Manager, Calendar Reliability',
    summary: 'Make calendar sync boringly reliable for 2M weekly users.',
    pay: pay(155000, 185000),
    postedDaysAgo: 9,
    match: false,
  },
];

// The autoplay script: what the "demo candidate" does with each card.
const SCRIPT: Dir[] = ['yes', 'no', 'yes', 'no'];
type Dir = 'yes' | 'no';
export type DemoDecision = { dir: Dir; matched: boolean };

const AUTOPLAY_MS = 3400;
const EXIT_MS = 380;

export default function SwipePreview({ onDecision }: { onDecision?: (d: DemoDecision) => void }) {
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [exit, setExit] = useState<Dir | null>(null);
  const [dragging, setDragging] = useState(false);
  const [match, setMatch] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  const [announce, setAnnounce] = useState('');
  const startX = useRef(0);
  const draggingRef = useRef(false);
  const resumeAt = useRef(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const visible = useRef(true);
  const onDecisionRef = useRef(onDecision);
  onDecisionRef.current = onDecision;

  const card = DEMO[i % DEMO.length];
  const next = DEMO[(i + 1) % DEMO.length];

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Only autoplay while the preview is on screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => (visible.current = entry.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const commit = useCallback(
    (dir: Dir, by: 'button' | 'gesture' | 'auto') => {
      if (exit) return;
      if (by !== 'auto') {
        resumeAt.current = Date.now() + 8000; // give the visitor the wheel for a while
        track('landing_demo_swiped', { decision: dir === 'yes' ? 'interested' : 'pass', method: by });
      }
      setDragging(false);
      draggingRef.current = false;
      setExit(dir);
      const current = DEMO[i % DEMO.length];
      const matched = dir === 'yes' && current.match;
      onDecisionRef.current?.({ dir, matched });
      setAnnounce(dir === 'yes' ? `Interested in ${current.company.name}` : `Passed on ${current.company.name}`);
      window.setTimeout(() => {
        setI((n) => n + 1);
        setExit(null);
        setDx(0);
        if (matched) {
          setMatch(current.company.name);
          setAnnounce(`It’s a match with ${current.company.name}`);
          window.setTimeout(() => setMatch(null), 2200);
        }
      }, reduced ? 120 : EXIT_MS);
    },
    [exit, i, reduced],
  );

  // Autoplay — off for reduced motion, while hovered/focused, or right after the visitor swipes.
  useEffect(() => {
    if (reduced || paused) return;
    const t = window.setInterval(() => {
      if (!visible.current || draggingRef.current || Date.now() < resumeAt.current) return;
      commit(SCRIPT[i % SCRIPT.length], 'auto');
    }, AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [reduced, paused, commit, i]);

  function onPointerDown(e: React.PointerEvent) {
    if (exit) return;
    draggingRef.current = true;
    setDragging(true);
    startX.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    setDx(e.clientX - startX.current);
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    const offset = e.clientX - startX.current;
    if (offset > 80) commit('yes', 'gesture');
    else if (offset < -80) commit('no', 'gesture');
    else setDx(0);
  }

  const dir = exit === 'yes' ? 1 : exit === 'no' ? -1 : 0;
  const transform = exit
    ? reduced
      ? 'none'
      : `translateX(${dir * 130}%) rotate(${dir * 14}deg)`
    : `translateX(${dx}px) rotate(${reduced ? 0 : dx * 0.06}deg)`;
  const strength = Math.min(Math.abs(dx) / 80, 1);

  return (
    <div
      ref={rootRef}
      className={s.preview}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={s.frameWrap}>
        {/* Transient match toast (the pay band itself now leads the card, so no pay chip). */}
        <div className={`${s.chip} ${s.chipMatch} ${match ? s.chipMatchOn : ''}`} aria-hidden="true">
          <span className={s.chipIcon}>
            <Heart size={16} />
          </span>
          <span>
            It’s a match!
            <span className={s.chipSub}>{match ?? 'Ledgerly'} swiped right too</span>
          </span>
        </div>

        <section className={s.frame} aria-label="Interactive preview of the swipe deck">
          {/* Same stack as the app: the next card waits one step back and rises into place. */}
          <div className="deck__stack" data-advancing={exit ? 'true' : undefined}>
            <div className="deck__ghost deck__ghost--2" aria-hidden="true" />
            <div key={`peek-${i + 1}`} className="deck__peek" aria-hidden="true">
              <div className="rolecard">
                <RoleCardFace role={next} as="div" />
              </div>
            </div>
            <div key={i} className="deck__top deck__top--promoted">
              <article
                className="rolecard"
                aria-label={`${card.company.name}: ${card.title}`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => {
                  draggingRef.current = false;
                  setDragging(false);
                  setDx(0);
                }}
                style={{
                  transform,
                  opacity: exit ? 0 : 1,
                  transition: dragging
                    ? 'none'
                    : `transform ${EXIT_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${EXIT_MS}ms ease`,
                  cursor: dragging ? 'grabbing' : 'grab',
                }}
              >
                <RoleCardFace role={card} as="div" />
                <span className="rolecard__stamp rolecard__stamp--yes" style={{ opacity: dx > 4 ? strength : 0 }} aria-hidden="true">
                  Interested
                </span>
                <span className="rolecard__stamp rolecard__stamp--no" style={{ opacity: dx < -4 ? strength : 0 }} aria-hidden="true">
                  Pass
                </span>
              </article>
            </div>
          </div>

          <div className={s.previewActions}>
            <button type="button" className={s.roundBtn} aria-label="Pass on this sample role" onClick={() => commit('no', 'button')}>
              <Cross size={22} />
            </button>
            <button
              type="button"
              className={`${s.roundBtn} ${s.roundBtnYes}`}
              aria-label="Interested in this sample role"
              onClick={() => commit('yes', 'button')}
            >
              <Heart size={26} />
            </button>
          </div>
          <p className={s.previewHint}>Try it — drag the card or tap a button.</p>
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>
        </section>
      </div>
    </div>
  );
}
