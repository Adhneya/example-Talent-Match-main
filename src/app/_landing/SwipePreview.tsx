'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';
import { Cross, Heart } from '@/components/Icons';
import { RoleCardFace } from '@/components/RoleCard';
import { AGGREGATED_ROLES } from '@/lib/fixtures/roles';
import { track } from '@/lib/analytics';

/**
 * The hero's product demo: the app's real role cards (fixture inventory, pay-
 * banded roles only — decision 4), fanned three deep. The top card tilts
 * toward the pointer in 3D (≤ 8°), drags with spring physics, and flies off on
 * a swipe; the card behind springs forward to take its place.
 *
 * TARGET_ROLES are role-family labels (no company, pay or summary), so they
 * can't fill a card; AGGREGATED_ROLES is the card-shaped inventory.
 */
const ROLES = AGGREGATED_ROLES.filter((r) => r.pay);

type Dir = 'yes' | 'no';
export type DemoDecision = { dir: Dir; matched: boolean; company: string };
type Method = 'button' | 'gesture' | 'keyboard' | 'auto';

/** Demo script only: in the preview, every other role "swipes back". */
const isMutual = (index: number) => index % 2 === 0;
const AUTOPLAY: Dir[] = ['yes', 'no', 'yes', 'no'];
const AUTOPLAY_MS = 3600;
const TILT = 8; // degrees, max
const SPRING = { type: 'spring', stiffness: 100, damping: 20 } as const;

/** Resting pose for each depth of the fan (0 = top). Transform + opacity only. */
const POSE = [
  { x: '0%', y: '0%', rotate: 0, scale: 1, opacity: 1 },
  { x: '-9%', y: '3%', rotate: -6, scale: 0.94, opacity: 1 },
  { x: '10%', y: '6%', rotate: 7, scale: 0.88, opacity: 0.9 },
  { x: '0%', y: '10%', rotate: 0, scale: 0.8, opacity: 0 },
];

let hoverTracked = false; // once per page view

/** Resolves once a spring has (nearly) reached `to` — or after a short cap, so a hidden tab can't stall the deck. */
function settled(value: MotionValue<number>, to: number) {
  return new Promise<void>((resolve) => {
    const done = () => {
      off();
      window.clearTimeout(cap);
      resolve();
    };
    const off = value.on('change', (v) => Math.abs(v - to) < 2 && done());
    const cap = window.setTimeout(done, 700);
  });
}

export default function SwipePreview({ onDecision }: { onDecision?: (d: DemoDecision) => void }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const busy = useRef(false);
  const hovering = useRef(false);
  const resumeAt = useRef(0);
  const visible = useRef(true);
  const rootRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const onDecisionRef = useRef(onDecision);
  onDecisionRef.current = onDecision;

  // Drag: the pointer sets `target`; the card renders a stiff spring of it, so it tracks the
  // finger closely, springs home on a short drag and flies off on a throw — one value, no
  // imperative animate() (which would pull a much larger slice of motion into the bundle).
  const target = useMotionValue(0);
  const x = useSpring(target, { stiffness: 520, damping: 38, mass: 0.8 });
  const dragRotate = useTransform(x, [-300, 0, 300], [-16, 0, 16]);
  const yesOpacity = useTransform(x, [20, 110], [0, 1]);
  const noOpacity = useTransform(x, [-110, -20], [1, 0]);
  // Hover tilt: springs, not CSS transitions.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 180, damping: 18 });
  const rotateY = useSpring(tiltY, { stiffness: 180, damping: 18 });

  const drag = useRef<{ id: number; startX: number; lastX: number; lastT: number; v: number } | null>(null);

  const commit = useCallback(
    async (dir: Dir, method: Method) => {
      if (busy.current) return;
      busy.current = true;
      if (method !== 'auto') {
        resumeAt.current = Date.now() + 8000; // the visitor has the wheel for a while
        track('landing_demo_swiped', { decision: dir === 'yes' ? 'interested' : 'pass', method });
      }
      const role = ROLES[i % ROLES.length];
      const matched = dir === 'yes' && isMutual(i);
      onDecisionRef.current?.({ dir, matched, company: role.company.name });
      setAnnounce(dir === 'yes' ? `Interested in ${role.company.name}` : `Passed on ${role.company.name}`);
      tiltX.set(0);
      tiltY.set(0);
      if (!reduced) {
        const off = (rootRef.current?.offsetWidth ?? 600) * 1.1;
        target.set(dir === 'yes' ? off : -off);
        await settled(x, dir === 'yes' ? off : -off);
      }
      setI((n) => n + 1); // x resets in the layout effect below, in the same frame the new top mounts
      if (matched) {
        setToast(role.company.name);
        setAnnounce(`It’s a match with ${role.company.name}`);
        window.setTimeout(() => setToast(null), 2200);
      }
      busy.current = false;
    },
    [i, reduced, x, target, tiltX, tiltY],
  );

  // The next card becomes the top card: reset the shared drag value before paint,
  // so it neither inherits the thrown card's offset nor flashes the old card centred.
  useLayoutEffect(() => {
    target.jump(0);
    x.jump(0);
  }, [i, x, target]);

  // Only autoplay while on screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Autoplay — never under reduced motion, while hovered or focused, or right after the visitor swipes.
  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => {
      const focused = rootRef.current?.contains(document.activeElement);
      if (!visible.current || hovering.current || focused || drag.current || Date.now() < resumeAt.current) return;
      void commit(AUTOPLAY[i % AUTOPLAY.length], 'auto');
    }, AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [reduced, commit, i]);

  function onPointerEnter() {
    hovering.current = true;
    if (!hoverTracked) {
      hoverTracked = true;
      track('landing_swipe_preview_hover');
    }
  }
  function onPointerLeave() {
    hovering.current = false;
    tiltX.set(0);
    tiltY.set(0);
  }

  function onCardPointerDown(e: React.PointerEvent) {
    if (busy.current) return;
    drag.current = { id: e.pointerId, startX: e.clientX, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
    tiltX.set(0);
    tiltY.set(0);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onCardPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (d && d.id === e.pointerId) {
      const dt = e.timeStamp - d.lastT;
      if (dt > 0) d.v = ((e.clientX - d.lastX) / dt) * 1000; // px/s — a fast flick counts as a swipe
      d.lastX = e.clientX;
      d.lastT = e.timeStamp;
      target.set(e.clientX - d.startX);
      return;
    }
    // Hover tilt (mouse/pen only): the card leans toward the pointer.
    if (reduced || e.pointerType === 'touch' || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tiltY.set(px * TILT * 2);
    tiltX.set(-py * TILT * 2);
  }
  function onCardPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const offset = e.clientX - d.startX;
    const fling = Math.abs(d.v) > 650;
    if (offset > 110 || (fling && d.v > 0)) void commit('yes', 'gesture').finally(() => (drag.current = null));
    else if (offset < -110 || (fling && d.v < 0)) void commit('no', 'gesture').finally(() => (drag.current = null));
    else {
      drag.current = null;
      target.set(0); // springs home
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      void commit('yes', 'keyboard');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      void commit('no', 'keyboard');
    }
  }

  const stack = [0, 1, 2].map((depth) => ({ depth, index: i + depth, role: ROLES[(i + depth) % ROLES.length] }));
  const top = stack[0];

  return (
    <section
      ref={rootRef}
      aria-roledescription="interactive preview"
      aria-label="Swipe deck preview with sample roles. Use the buttons, drag the card, or press the left and right arrow keys."
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className="relative mx-auto w-full max-w-[var(--deck-w)] rounded-[28px] outline-none focus-visible:ring-4 focus-visible:ring-navy/25"
    >
      <h2 className="sr-only">Try the swipe deck</h2>

      {/* The fan. Perspective on the stack gives the top card real depth when it tilts. */}
      <div className="relative aspect-[4/5] w-full [perspective:1000px]" data-deck>
        {stack
          .slice()
          .reverse()
          .map(({ depth, index, role }) => {
            const isTop = depth === 0;
            return (
              <m.div
                key={index}
                data-depth={depth}
                // Phones show one card at a time; the fan appears from sm up.
                className={`absolute inset-0 will-change-transform ${isTop ? '' : 'hidden sm:block'}`}
                initial={reduced ? false : POSE[3]}
                animate={POSE[depth]}
                transition={reduced ? { duration: 0 } : SPRING}
                style={{ zIndex: 10 - depth }}
                aria-hidden={isTop ? undefined : true}
              >
                {isTop ? (
                  <m.article
                    ref={cardRef}
                    className="rolecard touch-pan-y select-none will-change-transform"
                    aria-label={`${role.company.name}: ${role.title}`}
                    style={{ x, rotate: dragRotate, rotateX, rotateY, transformPerspective: 1000 }}
                    onPointerDown={onCardPointerDown}
                    onPointerMove={onCardPointerMove}
                    onPointerUp={onCardPointerUp}
                    onPointerCancel={() => {
                      drag.current = null;
                      target.set(0);
                    }}
                  >
                    <RoleCardFace role={role} as="div" />
                    <m.span className="rolecard__stamp rolecard__stamp--yes" style={{ opacity: yesOpacity }} aria-hidden="true">
                      Interested
                    </m.span>
                    <m.span className="rolecard__stamp rolecard__stamp--no" style={{ opacity: noOpacity }} aria-hidden="true">
                      Pass
                    </m.span>
                  </m.article>
                ) : (
                  <div className="rolecard" style={{ cursor: 'default' }}>
                    <RoleCardFace role={role} as="div" />
                  </div>
                )}
              </m.div>
            );
          })}

        {/* Mutual match toast — transform + opacity only. */}
        <m.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 bottom-[22%] z-20 flex items-center gap-3 rounded-2xl bg-navy px-4 py-3 font-l-sans text-sm font-semibold text-white shadow-[0_30px_60px_-30px_rgba(27,33,64,0.9)] sm:-right-10"
          initial={false}
          animate={toast ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.92 }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 18 }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-coral">
            <Heart size={16} />
          </span>
          <span>
            It’s a match
            <span className="block text-xs font-normal text-lilac-3">{toast ?? top.role.company.name} swiped right too</span>
          </span>
        </m.div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => void commit('no', 'button')}
          aria-label={`Pass on ${top.role.company.name}`}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-white text-muted shadow-[0_10px_22px_-14px_rgba(27,33,64,0.5)] transition-transform duration-200 hover:-translate-y-0.5 hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/25"
        >
          <Cross size={22} />
        </button>
        <button
          type="button"
          onClick={() => void commit('yes', 'button')}
          aria-label={`Interested in ${top.role.company.name}`}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-coral-pressed bg-coral text-white shadow-[0_16px_30px_-14px_rgba(226,74,80,0.75)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/25"
        >
          <Heart size={26} />
        </button>
      </div>
      <p className="mt-3 text-center font-l-sans text-[0.8rem] text-muted">Drag the card, tap a button, or use ← →</p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}
