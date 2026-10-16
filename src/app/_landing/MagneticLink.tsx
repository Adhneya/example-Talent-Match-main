'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import * as m from 'motion/react-m';
import { GlowRing, useGlowClass } from './GlowBorder';

/** The pointer starts pulling once it is within this many px of the button's edge. */
const RADIUS = 40;
/** How far the button follows (fraction of the pointer offset) and its cap, in px. */
const PULL = 0.32;
const MAX = 14;

const clamp = (v: number) => Math.max(-MAX, Math.min(MAX, v));

/**
 * Magnetic primary CTA: within 40px of the button, it leans toward a mouse
 * pointer on a spring, and its label leans a little further (a parallax
 * inside the button). Listens on the window rather than a padded wrapper, so
 * the 40px zone never steals clicks from neighbouring controls. Mouse only —
 * touch and reduced motion get a still button.
 */
export default function MagneticLink({
  href,
  label,
  children,
  onClick,
}: {
  href: string;
  /** Accessible name; matches the visible label. */
  label: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const reduced = useReducedMotion();
  const glow = useGlowClass();
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });
  const lx = useTransform(sx, (v) => v * 0.45);
  const ly = useTransform(sy, (v) => v * 0.45);

  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return;
    function onMove(e: PointerEvent) {
      const el = ref.current;
      if (!el || e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const inside =
        e.clientX > r.left - RADIUS && e.clientX < r.right + RADIUS && e.clientY > r.top - RADIUS && e.clientY < r.bottom + RADIUS;
      if (!inside) {
        x.set(0);
        y.set(0);
        return;
      }
      x.set(clamp((e.clientX - (r.left + r.width / 2)) * PULL));
      y.set(clamp((e.clientY - (r.top + r.height / 2)) * PULL));
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced, x, y]);

  return (
    <m.div ref={ref} style={{ x: sx, y: sy }} className={`${glow} inline-flex rounded-full`}>
      <Link
        href={href}
        aria-label={label}
        onClick={onClick}
        className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-navy px-8 font-l-sans text-[1.05rem] font-semibold tracking-[-0.01em] text-white shadow-[0_18px_40px_-18px_rgba(47,60,126,0.9)] transition-colors duration-200 hover:bg-navy-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/25"
      >
        <m.span style={{ x: lx, y: ly }} className="inline-flex items-center gap-2">
          {children}
        </m.span>
      </Link>
      <GlowRing />
    </m.div>
  );
}
