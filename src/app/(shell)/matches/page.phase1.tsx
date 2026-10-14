'use client';

import Link from 'next/link';
import { useStore } from '@/store/AppStore';
import { getRole, matchStatus } from '@/lib/api';
import { useNow } from '@/hooks/useNotifications';
import { Heart } from '@/components/Icons';
import { StatusChip } from '@/components/EngagementStatus';

/** S-09 Matches — list with engagement status (slide 6). */
export default function MatchesPage() {
  const { matches } = useStore();
  const now = useNow();

  return (
    <section className="col page">
      <div className="page__head">
        <h1 className="t-h1">Matches</h1>
        <p className="t-lead" style={{ marginTop: 8 }}>
          Both of you swiped right. The employer chooses what happens next.
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="card empty">
          <div className="empty__icon">
            <Heart size={26} />
          </div>
          <h2 className="t-h3">No matches yet</h2>
          <p className="t-body t-muted" style={{ marginTop: 8 }}>
            When an employer you’re interested in swipes right on you too, it shows up here.
          </p>
          <Link href="/swipe" className="btn btn--primary btn--lg" style={{ marginTop: 20 }}>
            Keep swiping
          </Link>
        </div>
      ) : (
        <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {matches.map((m) => {
            const role = getRole(m.roleId);
            if (!role) return null;
            return (
              <li key={m.id}>
                <Link href={`/matches/${m.id}`} className="card item item--link">
                  <div className="item__top">
                    <div style={{ minWidth: 0 }}>
                      <div className="item__company">{role.company.name}</div>
                      <h2 className="item__title">{role.title}</h2>
                    </div>
                    <StatusChip status={matchStatus(m, now)} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
