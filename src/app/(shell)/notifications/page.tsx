'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/AppStore';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell } from '@/components/Icons';

/** S-12 Notifications — destination for the three named triggers (slide 10). */
export default function NotificationsPage() {
  const { notificationsSeenAt, markNotificationsSeen } = useStore();
  const { items } = useNotifications();
  // Freeze the "unread" line for this visit, then mark everything seen.
  const seenBefore = useRef(notificationsSeenAt);

  useEffect(() => {
    markNotificationsSeen();
  }, [items.length, markNotificationsSeen]);

  return (
    <section className="col page">
      <div className="page__head">
        <h1 className="t-h1">Notifications</h1>
      </div>

      {items.length === 0 ? (
        <div className="card empty">
          <div className="empty__icon">
            <Bell size={26} />
          </div>
          <h2 className="t-h3">You’re up to date</h2>
          <p className="t-body t-muted" style={{ marginTop: 8 }}>
            New matches and employer updates will appear here.
          </p>
        </div>
      ) : (
        <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((n) => (
            <li key={n.id}>
              <Link
                href={`/matches/${n.matchId}`}
                className={`card item item--link${n.at > seenBefore.current ? ' item--unread' : ''}`}
              >
                <div style={{ fontWeight: 600 }}>{n.title}</div>
                <div className="t-fine" style={{ marginTop: 4 }}>
                  {n.body} · {new Date(n.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
