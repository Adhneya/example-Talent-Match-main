'use client';

import { useId, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { Tick } from '@/components/Icons';
import { track } from '@/lib/analytics';
import { GlowRing, useGlowClass } from './GlowBorder';
import RevealHeading from './RevealHeading';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KEY = 'talentmatch.employerWaitlist';

/**
 * Viewport 3 — employer interest capture while employer accounts are Phase 1.
 * Minimal and centred; the input and button carry the gradient border glow.
 * TODO: no backend yet — entries are kept in this browser only (localStorage,
 * KEY above). Wire to a waitlist endpoint before launch.
 */
export default function EmployerNotify() {
  const id = useId();
  const reduced = useReducedMotion();
  const glow = useGlowClass();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const valid = EMAIL.test(email.trim());
  const showError = !valid && (submitted || (touched && email !== ''));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!valid) return;
    const value = email.trim();
    try {
      const list: string[] = JSON.parse(window.localStorage.getItem(KEY) || '[]');
      if (!list.includes(value)) window.localStorage.setItem(KEY, JSON.stringify([...list, value]));
    } catch {
      /* storage unavailable — still confirm */
    }
    track('employer_interest_submitted'); // never the email itself
    setDone(value);
  }

  return (
    <section
      id="employers"
      tabIndex={-1}
      aria-labelledby="employers-title"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 py-24 text-center outline-none sm:px-8"
    >
      <p className="font-l-sans text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-navy">For employers</p>
      <RevealHeading
        id="employers-title"
        className="mt-5 max-w-[16ch] font-l-sans text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.045em] text-ink"
        lines={['Meet people who', <em key="b" className="font-l-serif font-normal italic text-coral-pressed">already said yes.</em>]}
      />
      <p className="mt-7 max-w-[44ch] text-[1.2rem] leading-[1.55] text-muted">
        Employers swipe too. When the interest is mutual, you choose what happens next — a paid trial or your usual
        interview loop. Employer accounts are opening soon.
      </p>

      <div className="mt-12 w-full max-w-[520px]" aria-live="polite">
        {done ? (
          <m.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20 }}
            className="flex items-start gap-3 rounded-2xl bg-[#eef8f2] p-5 text-left font-l-sans text-[0.95rem] leading-[1.5] text-ink"
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
              <Tick size={14} />
            </span>
            <span>
              Thanks — we’ll email <strong>{done}</strong> when employer accounts open.
            </span>
          </m.div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-3 text-left sm:flex-row sm:items-start">
            <div className="flex-1">
              <label htmlFor={id} className="sr-only">
                Work email
              </label>
              <div className={`${glow} rounded-full`}>
                <input
                  id={id}
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  aria-label="Work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={showError}
                  aria-describedby={`${id}-err`}
                  className={`block min-h-[56px] w-full rounded-full border bg-white px-6 font-l-sans text-[1rem] text-ink outline-none placeholder:text-muted focus-visible:ring-4 focus-visible:ring-navy/20 ${showError ? 'border-danger' : 'border-transparent'}`}
                />
                <GlowRing />
              </div>
              <span id={`${id}-err`} role={showError ? 'alert' : undefined} className="mt-2 block min-h-[1.25rem] px-6 font-l-sans text-[0.85rem] text-danger">
                {showError ? 'Enter a valid work email.' : ''}
              </span>
            </div>
            <div className={`${glow} rounded-full`}>
              <button
                type="submit"
                aria-label="Notify me when employer accounts open"
                className="min-h-[56px] w-full rounded-full bg-navy px-8 font-l-sans text-[1rem] font-semibold text-white transition-colors hover:bg-navy-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/25 sm:w-auto"
              >
                Notify me
              </button>
              <GlowRing />
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
