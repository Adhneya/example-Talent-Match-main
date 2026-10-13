'use client';

import { useId, useState } from 'react';
import { Tick } from '@/components/Icons';
import s from './landing.module.css';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KEY = 'talentmatch.employerWaitlist';

/**
 * Employer interest capture while employer accounts are Phase 1.
 * TODO: no backend yet — entries are kept in this browser only. Wire to a
 * waitlist endpoint before launch.
 */
export default function EmployerNotify() {
  const id = useId();
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
    setDone(value);
  }

  return (
    <div className={s.notify}>
      <h3 className={s.notifyTitle}>Employer accounts are opening soon.</h3>
      {/* Copy promises no contact until the waitlist is wired to a backend (see TODO above). */}
      <p className={s.notifyBody}>
        Posting roles and swiping on candidates isn’t open yet. Register your interest with your work email.
      </p>

      {done ? (
        <div className={s.notifyDone} role="status">
          <Tick size={20} style={{ color: 'var(--success)', marginTop: 1 }} />
          <span>
            Thanks — interest registered for <strong>{done}</strong>. Employer accounts aren’t open yet, so check
            back here soon.
          </span>
        </div>
      ) : (
        <form className={s.notifyForm} onSubmit={submit} noValidate>
          <label htmlFor={id} className={s.notifyLabel}>
            Work email
          </label>
          <input
            id={id}
            className={s.notifyInput}
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={showError}
            aria-describedby={`${id}-err`}
          />
          <span id={`${id}-err`} className={s.notifyError} role={showError ? 'alert' : undefined}>
            {showError ? 'Enter a valid work email.' : ''}
          </span>
          <button type="submit" className={`${s.cta} ${s.ctaPrimary}`}>
            Notify me
          </button>
        </form>
      )}
    </div>
  );
}
