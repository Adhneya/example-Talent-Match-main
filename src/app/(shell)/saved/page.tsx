'use client';

import Link from 'next/link';
import { useStore } from '@/store/AppStore';
import { formatPay, roleMeta } from '@/lib/format';
import { Bookmark } from '@/components/Icons';
import { ApplyOutButton, SourceBadge } from '@/components/RoleCard';
import { detailNav } from '@/components/swipe/SwipeDeck';

/**
 * Saved — where Interested lands for aggregated roles. Those roles are
 * one-sided apply (slide 8), so instead of sending the candidate out to the
 * source mid-deck, Interested bookmarks the role here to apply when ready.
 */
export default function SavedPage() {
  const { savedRoles, applied, markApplied, removeSaved } = useStore();

  return (
    <section className="col page">
      <div className="page__head">
        <h1 className="t-h1">Saved roles</h1>
        <p className="t-lead" style={{ marginTop: 8 }}>
          Roles you were interested in. Apply on the employer’s own posting when you’re ready.
        </p>
      </div>

      {savedRoles.length === 0 ? (
        <div className="card empty">
          <div className="empty__icon">
            <Bookmark size={26} />
          </div>
          <h2 className="t-h3">Nothing saved yet</h2>
          <p className="t-body t-muted" style={{ marginTop: 8 }}>
            Tap Interested on a role and it lands here, ready to apply.
          </p>
          <Link href="/swipe" className="btn btn--primary btn--lg" style={{ marginTop: 20 }}>
            Go to the deck
          </Link>
        </div>
      ) : (
        <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {savedRoles.map((r) => {
            const done = applied.includes(r.id);
            return (
              <li key={r.id} className="card item">
                <div className="item__top">
                  <div style={{ minWidth: 0 }}>
                    <div className="item__company">{r.company.name}</div>
                    <h2 className="item__title">{r.title}</h2>
                    <div className="t-fine" style={{ marginTop: 4 }}>
                      {roleMeta(r)}
                    </div>
                  </div>
                  {done && (
                    <span className="status status--applied">
                      <span className="status__dot" />
                      Applied
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 12 }}>
                  <span className="item__pay">{r.pay ? `${formatPay(r.pay)} / yr` : 'Pay not published'}</span>
                  <SourceBadge role={r} />
                </div>

                <div className="item__actions">
                  <ApplyOutButton
                    role={r}
                    className={done ? 'btn' : 'btn btn--primary'}
                    onApply={() => markApplied(r.id)}
                  />
                  <Link href={`/swipe/${r.id}`} className="btn" onClick={() => (detailNav.openedInApp = true)}>
                    Details
                  </Link>
                  <button className="btn btn--ghost" onClick={() => removeSaved(r.id)}>
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
