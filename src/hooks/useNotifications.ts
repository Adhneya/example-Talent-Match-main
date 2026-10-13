'use client';

import { useEffect, useMemo, useState } from 'react';
import { deriveNotifications } from '@/lib/api';
import { FLAGS } from '@/lib/flags';
import { useStore } from '@/store/AppStore';

/** Re-render on an interval so employer-side state (derived from time) stays current. */
export function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useNotifications() {
  const { matches, notificationsSeenAt } = useStore();
  const now = useNow();
  const items = useMemo(
    () => (FLAGS.notifications ? deriveNotifications(matches, now) : []),
    [matches, now],
  );
  const unread = items.filter((n) => n.at > notificationsSeenAt).length;
  return { items, unread, now };
}
