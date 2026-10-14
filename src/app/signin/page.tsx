'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import LinkedInButton from '@/components/LinkedInButton';
import { track } from '@/lib/analytics';
import { clearPendingSignIn } from '@/lib/session';

/**
 * Sign in — for returning candidates ("Log In" on Welcome) and deep links into
 * the app. Also Auth.js's error page (see `pages` in src/auth.ts). New
 * candidates sign in inside Connect instead, so onboarding stays 3 steps.
 */

type Reason = 'access_denied' | 'configuration' | 'other';

// Auth.js error codes → what the candidate can do about it.
function reasonFor(code: string): Reason {
  if (code === 'OAuthCallbackError' || code === 'AccessDenied') return 'access_denied';
  if (code === 'Configuration') return 'configuration';
  return 'other';
}

const MESSAGES: Record<Reason, string> = {
  access_denied: 'Sign-in was cancelled, or LinkedIn didn’t confirm it. Try again and choose Allow when LinkedIn asks.',
  configuration: 'LinkedIn sign-in isn’t available right now. Please try again in a few minutes.',
  other: 'Sign-in didn’t finish. Please try again.',
};

/** Only same-site paths — never an absolute or protocol-relative URL. */
function safeRedirect(raw: string | null) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/swipe';
}

function SignIn() {
  const params = useSearchParams();
  const error = params.get('error');
  const reason = error ? reasonFor(error) : null;
  const redirectTo = safeRedirect(params.get('callbackUrl'));

  useEffect(() => {
    if (!reason) return;
    clearPendingSignIn();
    track('sign_in_failed', { reason });
  }, [reason]);

  return (
    <div className="reveal">
      <h1 className="t-h1">Sign in to TalentMatch</h1>
      <p className="t-lead" style={{ marginTop: 12 }}>
        Pick up where you left off — your profile and saved roles are waiting.
      </p>

      {reason && (
        <p className="card field__msg field__msg--error" role="alert" style={{ marginTop: 24, padding: '14px 18px' }}>
          {MESSAGES[reason]}
        </p>
      )}

      <div style={{ marginTop: 32 }}>
        <LinkedInButton location="signin" redirectTo={redirectTo} />
      </div>

      <p className="t-body t-muted" style={{ marginTop: 24 }}>
        New here?{' '}
        <Link href="/onboarding/connect" className="link">
          Get started
        </Link>{' '}
        — it takes about two minutes.
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <>
      <Header />
      <main className="wrap">
        <section className="col onb">
          {/* useSearchParams needs a Suspense boundary to keep this page static. */}
          <Suspense fallback={null}>
            <SignIn />
          </Suspense>
        </section>
      </main>
    </>
  );
}
