'use client';

import { useState } from 'react';
import { LinkedInMark } from '@/components/Icons';
import { DEV_SIGNIN, startSignIn } from '@/lib/session';

/**
 * Sign in with LinkedIn (decision "Auth"). Leaves for LinkedIn and returns to
 * `redirectTo`. In `next dev` a second button signs in a fake test user, so
 * the app is usable before LinkedIn credentials exist.
 */
export default function LinkedInButton({
  location,
  redirectTo,
}: {
  location: 'connect' | 'signin';
  redirectTo: string;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <button
        type="button"
        className="btn btn--linkedin btn--lg btn--block"
        disabled={busy}
        aria-busy={busy}
        onClick={() => {
          setBusy(true);
          startSignIn('linkedin', location, redirectTo).catch(() => setBusy(false));
        }}
      >
        <LinkedInMark size={20} />
        {busy ? 'Opening LinkedIn…' : 'Continue with LinkedIn'}
      </button>

      {DEV_SIGNIN && (
        <button
          type="button"
          className="btn btn--ghost btn--block"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            startSignIn('test', location, redirectTo).catch(() => setBusy(false));
          }}
        >
          Continue as test user (dev only)
        </button>
      )}
    </div>
  );
}
