'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/AppStore';
import { getRole } from '@/lib/api';
import { confetti, prefersReducedMotion, tick } from '@/lib/motion';
import { Heart } from '@/components/Icons';
import { CompanyMark, companyInitials } from '@/components/RoleCard';
import type { Match } from '@/lib/types';

/**
 * S-08 — "IT'S A MATCH" on a mutual right-swipe (Phase 1, flagged).
 * Motif from slide 1: two cards and a heart. The cards slide in from opposite
 * edges and meet; the heart lands and confetti bursts where they touch. Under
 * reduced motion everything simply appears in place.
 *
 * A true modal: portalled to <body>, everything else made `inert` while it is
 * open, Tab kept inside, focus returned on close.
 */

/** The heart lands when the two cards meet (the `match-*` keyframes in globals.css). */
const MEET_MS = 560;

function useModalFocus(dialog: React.RefObject<HTMLElement>, onEscape: () => void) {
  const escape = useRef(onEscape);
  escape.current = onEscape;

  useEffect(() => {
    const root = dialog.current?.closest('.celebrate-scrim');
    const returnTo = document.activeElement as HTMLElement | null;
    // Everything outside the modal stops being reachable — by Tab, pointer and screen reader.
    const others = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== root && !el.hasAttribute('inert'),
    );
    others.forEach((el) => el.setAttribute('inert', ''));

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        escape.current();
        return;
      }
      if (e.key !== 'Tab' || !dialog.current) return;
      // Fallback trap for browsers without `inert`.
      const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>('button, a[href]'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      others.forEach((el) => el.removeAttribute('inert'));
      if (returnTo?.isConnected) returnTo.focus();
    };
  }, [dialog]);
}

export default function MatchCelebrationModal({ match }: { match: Match }) {
  const router = useRouter();
  const { clearCelebrate, profile, user } = useStore();
  const role = getRole(match.roleId);
  const dialog = useRef<HTMLDivElement | null>(null);
  const primary = useRef<HTMLButtonElement | null>(null);
  const heart = useRef<HTMLDivElement | null>(null);

  useModalFocus(dialog, clearCelebrate);

  useEffect(() => {
    primary.current?.focus();
    tick();
    if (prefersReducedMotion()) return;
    const t = window.setTimeout(() => {
      const r = heart.current?.getBoundingClientRect();
      if (r) confetti(r.left + r.width / 2, r.top + r.height / 2);
    }, MEET_MS);
    return () => window.clearTimeout(t);
  }, []);

  if (!role) return null;
  const name = user?.name ?? 'You';

  return createPortal(
    <div className="celebrate-scrim">
      <div ref={dialog} className="celebrate" role="dialog" aria-modal="true" aria-labelledby="match-title">
        <h2 id="match-title" className="celebrate__title">
          IT’S A MATCH
        </h2>
        <p className="celebrate__lead">You and {role.company.name} both swiped right.</p>

        <div className="celebrate__cards" aria-hidden="true">
          <div className="celebrate__card celebrate__card--you">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- LinkedIn avatar, remote and tiny
              <img className="celebrate__avatar" src={user.image} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="celebrate__avatar celebrate__avatar--initials">{companyInitials(name)}</span>
            )}
            <div className="celebrate__who">{name}</div>
            <div className="celebrate__what">{profile?.roleTitle}</div>
          </div>
          <div className="celebrate__card celebrate__card--role">
            <CompanyMark name={role.company.name} />
            <div className="celebrate__who">{role.company.name}</div>
            <div className="celebrate__what">{role.title}</div>
          </div>
          <div ref={heart} className="celebrate__heart">
            <Heart size={30} />
          </div>
        </div>

        <p className="celebrate__next">
          {role.company.name} will choose the next step — a paid trial or interviews. We’ll let you know.
        </p>

        <div className="celebrate__actions">
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
    </div>,
    document.body,
  );
}
