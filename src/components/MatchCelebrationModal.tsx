'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/AppStore';
import { getRole } from '@/lib/api';
import { Heart } from '@/components/Icons';
import type { Match } from '@/lib/types';

/**
 * S-08 — "IT'S A MATCH" on a mutual right-swipe (Phase 1, flagged).
 * Motif from slide 1: two stacked cards and a heart affirmative.
 */
export default function MatchCelebrationModal({ match }: { match: Match }) {
  const router = useRouter();
  const { clearCelebrate, profile } = useStore();
  const role = getRole(match.roleId);
  const primary = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    primary.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') clearCelebrate();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearCelebrate]);

  if (!role) return null;

  return (
    <div className="celebrate-scrim" role="dialog" aria-modal="true" aria-labelledby="match-title">
      <div className="celebrate">
        <h2 id="match-title" className="celebrate__title">
          IT’S A MATCH
        </h2>
        <p style={{ marginTop: 8, color: 'var(--lilac-3)' }}>
          You and {role.company.name} both swiped right.
        </p>

        <div className="celebrate__cards" aria-hidden="true">
          <div className="celebrate__card celebrate__card--you">
            <div style={{ color: 'var(--muted)' }}>You</div>
            <div style={{ marginTop: 6 }}>{profile?.roleTitle}</div>
          </div>
          <div className="celebrate__card celebrate__card--role">
            <div style={{ color: 'var(--muted)' }}>{role.company.name}</div>
            <div style={{ marginTop: 6 }}>{role.title}</div>
          </div>
          <div className="celebrate__heart">
            <Heart size={28} />
          </div>
        </div>

        <p className="t-fine" style={{ color: 'var(--lilac-2)' }}>
          {role.company.name} will choose the next step — a paid trial or interviews. We’ll let you know.
        </p>

        <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
          <button ref={primary} className="btn btn--interested btn--lg btn--block" onClick={clearCelebrate}>
            Keep swiping
          </button>
          <button
            className="btn btn--lg btn--block"
            onClick={() => {
              clearCelebrate();
              router.push(`/matches/${match.id}`);
            }}
          >
            View match
          </button>
        </div>
      </div>
    </div>
  );
}
