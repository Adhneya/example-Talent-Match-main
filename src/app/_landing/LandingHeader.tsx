'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import s from './landing.module.css';

export const NAV = [
  { href: '#how', label: 'How it Works' },
  { href: '#talent', label: 'For Talent' },
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

export default function LandingHeader({ resumeHref, resuming }: { resumeHref: string; resuming: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  // "Log In" resumes saved progress — there is no account system yet.
  const loginLabel = 'Log In';

  return (
    <header className={s.header} data-scrolled={scrolled || open}>
      <div className={`${s.container} ${s.headerInner}`}>
        <Link href="/" className={s.brand} aria-label="TalentMatch home">
          TalentMatch
          <span className={s.brandDot} aria-hidden="true" />
        </Link>

        <nav className={s.nav} aria-label="Primary">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className={s.navLink} onClick={(e) => scrollToHash(e, n.href)}>
              {n.label}
            </a>
          ))}
        </nav>

        <div className={s.actions}>
          <Link
            href={resumeHref}
            className={`${s.cta} ${s.ctaGhost} ${s.ctaSm} ${s.loginDesktop}`}
            title={resuming ? 'Pick up where you left off' : undefined}
          >
            {loginLabel}
          </Link>
          <Link href={resumeHref} className={`${s.cta} ${s.ctaPrimary} ${s.ctaSm} ${s.headerGetStarted}`}>
            Get Started
          </Link>
          <button
            ref={menuBtn}
            type="button"
            className={s.menuBtn}
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      <div id="landing-menu" className={s.menuPanel} hidden={!open}>
        <nav aria-label="Mobile">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className={s.menuLink}
              onClick={(e) => {
                setOpen(false);
                scrollToHash(e, n.href);
              }}
            >
              {n.label}
            </a>
          ))}
          <div className={s.menuDivider} />
          <Link href={resumeHref} className={s.menuLink}>
            {loginLabel}
          </Link>
        </nav>
      </div>
    </header>
  );
}
