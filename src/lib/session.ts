'use client';

import { signIn, signOut } from 'next-auth/react';
import { track, type AuthProvider } from '@/lib/analytics';

/**
 * Client side of Sign in with LinkedIn (server config: src/auth.ts).
 *
 * Sign-in leaves the app for LinkedIn and comes back on a full page load, so a
 * sessionStorage mark carries "a sign-in is in flight" across the round trip;
 * AppStore reports success once the session appears.
 */

const PENDING_KEY = 'talentmatch.signInPending';

/** The dev-only test user (see TEST_SIGNIN_ENABLED in src/auth.ts). */
export const DEV_SIGNIN = process.env.NODE_ENV === 'development';

export function startSignIn(provider: AuthProvider, location: 'connect' | 'signin', redirectTo: string) {
  track('sign_in_started', { provider, location });
  try {
    window.sessionStorage.setItem(PENDING_KEY, provider);
  } catch {
    /* storage unavailable */
  }
  return signIn(provider, { redirectTo });
}

/** Returns the provider of a sign-in that just completed, at most once. */
export function takePendingSignIn(): AuthProvider | null {
  try {
    const p = window.sessionStorage.getItem(PENDING_KEY);
    window.sessionStorage.removeItem(PENDING_KEY);
    return p === 'linkedin' || p === 'test' ? p : null;
  } catch {
    return null;
  }
}

/** A failed sign-in clears the mark so a later session isn't miscounted as its success. */
export function clearPendingSignIn() {
  try {
    window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Ends the session. The candidate's saved data stays on this device for their next sign-in. */
export function endSession() {
  track('sign_out');
  return signOut({ redirectTo: '/' });
}
