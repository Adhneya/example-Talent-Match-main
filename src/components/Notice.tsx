'use client';

import { useStore } from '@/store/AppStore';

/** Non-blocking status line — used for optimistic-swipe failures (slide 10). */
export default function Notice() {
  const { notice, dismissNotice } = useStore();
  return (
    <div aria-live="polite" role="status">
      {notice && (
        <div key={notice.id} className={`notice${notice.tone === 'error' ? ' notice--error' : ''}`}>
          <span>{notice.text}</span>
          <button onClick={dismissNotice} aria-label="Dismiss">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
