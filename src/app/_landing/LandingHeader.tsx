'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useReducedMotion, useScroll, useTransform } from 'motion/react';
import * as m from 'motion/react-m';
import { track } from '@/lib/analytics';

export const NAV = [
  { href: '#how', label: 'How it Works' },
  { href: '#employers', label: 'For Employers' },
];

/** Smooth in-page scroll that respects reduced motion and moves focus for keyboard users. */
export function scrollToHash(e: React.MouseEvent, hash: string, focusSelector?: string) {
  const el = document.querySelector<HTMLElement>(hash);
  if (!el) return;
  e.preventDefault();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', hash);
  const target = focusSelector ? el.querySelector<HTMLElement>(focusSelector) : el;
  target?.focus({ preventScroll: true });
}

/**
 * Fixed header. Its frosted background is scroll-linked: it fades in (opacity
 * only) over the first 80px and the hairline beneath it a little later, so
 * the header sits weightless over the hero and solid over everything else.
 */
export default function LandingHeader({
  resumeHref,
  loginHref,
  resuming,
}: {
  resumeHref: string;
  loginHref: string;
  resuming: boolean;
}) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], [0, 1], { clamp: true });
  const rule = useTransform(scrollY, [40, 140], [0, 1], { clamp: true });
  const [open, setOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement | null>(null);

  // useScroll only reports on the next scroll event; a reload restores a scrolled position
  // (or the visitor scrolls before hydration), so take the current offset on mount.
  useEffect(() => scrollY.set(window.scrollY), [scrollY]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        menuBtn.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-[60]" data-landing-header>
      <m.div
        aria-hidden="true"
        style={{ opacity: open ? 1 : reduced ? 1 : bg }}
        className="absolute inset-0 bg-white/80 backdrop-blur-xl backdrop-saturate-150"
      />
      <m.div aria-hidden="true" style={{ opacity: reduced ? 1 : rule }} className="absolute inset-x-0 bottom-0 h-px bg-border" />

      <div className="relative mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8 xl:px-12">
        {/* The wordmark stays in the brand face (Cambria) — the landing fonts are for the page, not the mark. */}
        <Link href="/" aria-label="TalentMatch home" className="inline-flex items-center gap-2 rounded-lg font-serif text-[1.55rem] font-bold tracking-[-0.015em] text-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/25">
          TalentMatch
          <span className="h-2 w-2 rounded-full bg-coral" aria-hidden="true" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 font-l-sans md:flex" data-landing-nav>
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={(e) => scrollToHash(e, n.href)}
              className="inline-flex min-h-[40px] items-center rounded-full px-4 text-[0.92rem] font-medium text-muted transition-colors hover:bg-tint hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/25"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 font-l-sans">
          <Link
            href={loginHref}
            title={resuming ? 'Pick up where you left off' : undefined}
            onClick={() => track('landing_cta_clicked', { cta: 'log_in', location: 'header' })}
            className="hidden min-h-[44px] items-center rounded-full px-4 text-[0.92rem] font-semibold text-ink transition-colors hover:bg-tint focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/25 md:inline-flex"
          >
            Log In
          </Link>
          <Link
            href={resumeHref}
            onClick={() => track('landing_cta_clicked', { cta: 'get_started', location: 'header' })}
            className="inline-flex min-h-[44px] items-center rounded-full bg-navy px-5 text-[0.92rem] font-semibold text-white transition-colors hover:bg-navy-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/25"
          >
            Get Started
          </Link>
          <button
            ref={menuBtn}
            type="button"
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/25 md:hidden"
            data-landing-menu-button
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      <div
        id="landing-menu"
        hidden={!open}
        className="absolute inset-x-3 top-[76px] rounded-2xl border border-border bg-white p-2.5 font-l-sans shadow-[0_40px_80px_-36px_rgba(27,33,64,0.42)] md:hidden"
      >
        <nav aria-label="Mobile">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={(e) => {
                setOpen(false);
                scrollToHash(e, n.href);
              }}
              className="flex min-h-[48px] items-center rounded-xl px-3.5 font-medium text-ink hover:bg-tint focus-visible:bg-tint focus-visible:outline-none"
            >
              {n.label}
            </a>
          ))}
          <div className="mx-1.5 my-2 h-px bg-border" />
          <Link
            href={loginHref}
            onClick={() => track('landing_cta_clicked', { cta: 'log_in', location: 'menu' })}
            className="flex min-h-[48px] items-center rounded-xl px-3.5 font-medium text-ink hover:bg-tint focus-visible:bg-tint focus-visible:outline-none"
          >
            Log In
          </Link>
        </nav>
      </div>
    </header>
  );
}
