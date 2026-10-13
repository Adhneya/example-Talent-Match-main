'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/AppStore';
import { getRole } from '@/lib/api';
import { postedLabel } from '@/lib/format';
import { Cross, Heart } from '@/components/Icons';
import { ApplyOutButton, RoleCardStatic, SourceBadge } from '@/components/RoleCard';
import { detailNav } from '@/components/swipe/SwipeDeck';

/**
 * S-07 Role detail — "detail lives one tap deeper" (slide 5). A route so a
 * shared or refreshed URL resolves, rendered over the retained deck: a sheet
 * below 1280px, a side panel from 1280px. Contents are scoped to the card
 * fields plus the apply-out action, since the deck doesn't specify more.
 */
export default function RoleDetailSheet({ roleId }: { roleId: string }) {
  const router = useRouter();
  const { decisions, decide, markApplied, applied } = useStore();
  const role = getRole(roleId);
  const decision = decisions.get(roleId)?.decision;
  const closeRef = useRef<HTMLButtonElement | null>(null);

  function close() {
    if (detailNav.openedInApp) {
      detailNav.openedInApp = false;
      router.back();
    } else {
      router.replace('/swipe');
    }
  }

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="sheet-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <aside className="sheet" role="dialog" aria-modal="true" aria-label={role ? `${role.title} at ${role.company.name}` : 'Role'}>
        <div className="sheet__grab" aria-hidden="true" />
        <div className="sheet__bar">
          <span className="t-label">Role detail</span>
          <button ref={closeRef} className="btn btn--ghost" aria-label="Close role detail" onClick={close}>
            <Cross size={20} />
          </button>
        </div>

        {!role ? (
          <div className="sheet__content" style={{ paddingBottom: 32 }}>
            <h2 className="t-h3">This role is no longer listed</h2>
            <p className="t-body t-muted" style={{ marginTop: 8 }}>
              It may have been filled or taken down at the source.
            </p>
            <button className="btn btn--primary btn--lg btn--block" style={{ marginTop: 20 }} onClick={close}>
              Back to the deck
            </button>
          </div>
        ) : (
          <>
            <div className="sheet__content">
              <RoleCardStatic role={role} />

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 18 }}>
                <span className="t-fine">{postedLabel(role.postedDaysAgo)}</span>
                <SourceBadge role={role} />
              </div>

              <h3 className="t-h3" style={{ marginTop: 22 }}>
                About the role
              </h3>
              <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                {role.about.map((p) => (
                  <p key={p} className="t-body t-muted">
                    {p}
                  </p>
                ))}
              </div>

              {role.source.kind === 'aggregated' && (
                <p className="t-fine" style={{ marginTop: 20 }}>
                  This listing comes from {role.source.name}. Applications go to the employer’s own posting there —
                  TalentMatch doesn’t host them.
                </p>
              )}
            </div>

            <div className="sheet__actions">
              {decision && (
                <p className="t-fine" style={{ textAlign: 'center' }}>
                  {decision === 'interested'
                    ? role.source.kind === 'aggregated'
                      ? 'You saved this role.'
                      : 'You’re interested — waiting on the employer.'
                    : 'You passed on this role.'}
                  {applied.includes(role.id) && ' You’ve applied.'}
                </p>
              )}
              <ApplyOutButton role={role} onApply={() => markApplied(role.id)} />
              {!decision && (
                <div className="sheet__actions-row">
                  <button
                    className="btn btn--pass btn--lg"
                    onClick={() => {
                      decide(role, 'pass');
                      close();
                    }}
                  >
                    <Cross size={20} /> Pass
                  </button>
                  <button
                    className="btn btn--interested btn--lg"
                    onClick={() => {
                      decide(role, 'interested');
                      close();
                    }}
                  >
                    <Heart size={20} /> Interested
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
