'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStore, type Stage } from '@/store/AppStore';

/**
 * The single route guard (IA §2–3), combining the session (Sign in with
 * LinkedIn) with the candidate's onboarding stage.
 *
 *   Public:           Welcome, Sign in, Connect (signing in is part of Connect)
 *   Signed in only:   Build, Target and the app shell
 *
 * A signed-out visitor is always stage 'new' (their data is keyed by user, see
 * AppStore), so the stage rules below only ever see signed-in candidates past
 * Connect.
 */

type Requirement = 'welcome' | 'signin' | 'connect' | 'build' | 'target' | 'shell';

function requirementFor(pathname: string): Requirement {
  if (pathname === '/') return 'welcome';
  if (pathname.startsWith('/signin')) return 'signin';
  if (pathname.startsWith('/onboarding/connect')) return 'connect';
  if (pathname.startsWith('/onboarding/build')) return 'build';
  if (pathname.startsWith('/onboarding/target')) return 'target';
  return 'shell';
}

const ALLOWED: Record<Requirement, Stage[]> = {
  welcome: ['new', 'connected', 'confirmed'],
  signin: [], // signed in already: resume instead
  connect: ['new', 'connected'],
  build: ['connected', 'confirmed'], // confirmed: Back from Target returns to the confirm card
  target: ['confirmed'],
  shell: ['live'],
};

const PUBLIC: Requirement[] = ['welcome', 'signin', 'connect'];

/** Where each stage resumes. */
const RESUME: Record<Stage, string> = {
  new: '/onboarding/connect',
  connected: '/onboarding/build',
  confirmed: '/onboarding/target',
  live: '/swipe',
};

function decide(req: Requirement, signedIn: boolean, stage: Stage, pathname: string): string | null {
  if (!signedIn) {
    if (PUBLIC.includes(req)) return null;
    // Deep links into the app come back to the same place after sign-in.
    if (req === 'shell') return `/signin?callbackUrl=${encodeURIComponent(pathname)}`;
    return '/onboarding/connect';
  }
  return ALLOWED[req].includes(stage) ? null : RESUME[stage];
}

export default function ZoneGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrated, stage, user } = useStore();

  const req = requirementFor(pathname);
  const destination = decide(req, !!user, stage, pathname);

  useEffect(() => {
    if (hydrated && destination) router.replace(destination);
  }, [hydrated, destination, router]);

  // Welcome is public and has no state-dependent side effects, so it renders on
  // the server (real HTML for crawlers, link previews and first paint). A live
  // profile is redirected to the deck once the session and storage resolve.
  // Every other route waits: pages like /onboarding/build start work on mount
  // and must never run against the empty pre-hydration state.
  if (!hydrated) return req === 'welcome' ? <>{children}</> : null;
  if (destination) return null;
  return <>{children}</>;
}

export { RESUME };
