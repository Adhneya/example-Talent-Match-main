'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/AppStore';
import { PROCESSING_STEPS, ParseError, buildProfile } from '@/lib/api';
import { track } from '@/lib/analytics';
import { Tick } from '@/components/Icons';
import ProfileConfirmCard from '@/components/ProfileConfirmCard';
import type { Profile } from '@/lib/types';

/**
 * S-03 Processing → S-04 Confirm, one route. Processing completes into the
 * confirm card by cross-fade, without a route change (IA §8).
 */
export default function BuildPage() {
  const { draft, profile, stage } = useStore();
  // Back from Target: the profile is already confirmed — show it for tweaking.
  const initial = stage === 'confirmed' ? profile : draft.generated;
  return initial ? <ConfirmState initial={initial} alreadyConfirmed={stage === 'confirmed'} /> : <ProcessingState />;
}

/* ── S-03 ──────────────────────────────────────────────────────── */

function ProcessingState() {
  const router = useRouter();
  const { draft, setGenerated } = useStore();
  const [step, setStep] = useState(0);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    const c = new AbortController();
    const startedAt = Date.now();
    ctrl.current = c;
    setFailed(null);
    setStep(0);
    buildProfile(draft, setStep, c.signal).then(
      (p) => {
        if (c.signal.aborted) return;
        track('profile_build_succeeded', { duration_ms: Date.now() - startedAt });
        setGenerated(p);
      },
      (err) => {
        if (c.signal.aborted) return;
        track('profile_build_failed');
        setFailed(err instanceof ParseError ? err.message : 'Something went wrong while building your profile.');
      },
    );
    return () => c.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const cancel = useCallback(() => {
    ctrl.current?.abort();
    router.push('/onboarding/connect');
  }, [router]);

  if (failed) {
    return (
      <div className="reveal">
        <h1 className="t-h1">{failed}</h1>
        <p className="t-lead" style={{ marginTop: 12 }}>
          This usually happens with scanned or image-only files. Try again, or upload a different version — a PDF exported
          from Word or Google Docs works best.
        </p>
        <div style={{ display: 'grid', gap: 10, marginTop: 28 }}>
          <button className="btn btn--primary btn--lg btn--block" onClick={() => setAttempt((a) => a + 1)}>
            Try again
          </button>
          <button className="btn btn--lg btn--block" onClick={() => router.push('/onboarding/connect')}>
            Upload a different resume
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reveal">
      <h1 className="t-h1">Building your profile</h1>
      <p className="t-lead" style={{ marginTop: 12 }}>
        Reading {draft.resume?.name ?? 'your resume'} and your LinkedIn profile.
      </p>

      <div className="card" style={{ marginTop: 28, padding: '14px 20px' }}>
        <ol className="timeline" aria-label="Profile engine progress">
          {PROCESSING_STEPS.map((label, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'todo';
            return (
              <li key={label} className={`timeline__item timeline__item--${state}`}>
                <span className="timeline__mark" aria-hidden="true">
                  {state === 'done' && <Tick size={14} />}
                </span>
                <span>
                  {label}
                  <span className="sr-only">{state === 'done' ? ' — done' : state === 'active' ? ' — in progress' : ''}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="sr-only" aria-live="polite">
        {step < PROCESSING_STEPS.length ? PROCESSING_STEPS[step] : 'Profile ready'}
      </p>

      <button className="btn btn--ghost" style={{ marginTop: 20 }} onClick={cancel}>
        Cancel
      </button>
    </div>
  );
}

/* ── S-04 (blocking) ───────────────────────────────────────────── */

function ConfirmState({ initial, alreadyConfirmed }: { initial: Profile; alreadyConfirmed: boolean }) {
  const router = useRouter();
  const { setGenerated, confirmProfile } = useStore();
  const [p, setP] = useState(initial);

  function change(next: Profile) {
    setP(next);
    if (!alreadyConfirmed) setGenerated(next); // keep the draft so a refresh doesn't lose tweaks
  }

  return (
    <div className="fade-in">
      <h1 className="t-h1">Here’s your profile</h1>
      <p className="t-lead" style={{ marginTop: 12 }}>
        Check it over and tap Edit on anything that’s off. Nothing goes live until you confirm.
      </p>

      <div style={{ marginTop: 28 }}>
        <ProfileConfirmCard value={p} onChange={change} />
      </div>

      <button
        className="btn btn--primary btn--lg btn--block"
        style={{ marginTop: 24 }}
        onClick={() => {
          if (!alreadyConfirmed) track('profile_confirmed', { edited: JSON.stringify(p) !== JSON.stringify(initial) });
          confirmProfile(p);
          router.push('/onboarding/target');
        }}
      >
        {alreadyConfirmed ? 'Continue' : 'Confirm profile'}
      </button>
    </div>
  );
}
