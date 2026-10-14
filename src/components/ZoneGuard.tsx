'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStore, type Stage } from '@/store/AppStore';

/**
 * The single route guard (IA §2–3).
 *
 * The deck never introduces an account step, so access is decided by profile
 * stage alone and the session is assumed to exist implicitly from Connect.
 * When real auth lands, it replaces this component — route structure is
 * untouched.
 */

type Requirement = 'welcome' | 'connect' | 'build' | 'target' | 'shell';

function requirementFor(pathname: string): Requirement {
  if (pathname === '/') return 'welcome';
  if (pathname.startsWith('/onboarding/connect')) return 'connect';
  if (pathname.startsWith('/onboarding/build')) return 'build';
  if (pathname.startsWith('/onboarding/target')) return 'target';
  return 'shell';
}

const ALLOWED: Record<Requirement, Stage[]> = {
  welcome: ['new', 'connected', 'confirmed'],
  connect: ['new', 'connected'],
  build: ['connected', 'confirmed'], // confirmed: Back from Target returns to the confirm card
  target: ['confirmed'],
  shell: ['live'],
};

/** Where each stage resumes. */
const RESUME: Record<Stage, string> = {
  new: '/onboarding/connect',
  connected: '/onboarding/build',
  confirmed: '/onboarding/target',
  live: '/swipe',
};

export default function ZoneGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrated, stage } = useStore();

  const req = requirementFor(pathname);
  const allowed = ALLOWED[req].includes(stage);
  const destination = stage === 'new' && req === 'shell' ? '/' : RESUME[stage];

  useEffect(() => {
    if (hydrated && !allowed) router.replace(destination);
  }, [hydrated, allowed, destination, router]);

  // Welcome is public and has no state-dependent side effects, so it renders on
  // the server (real HTML for crawlers, link previews and first paint). A live
  // profile is redirected to the deck once storage hydrates.
  // Every other route waits for hydration: pages like /onboarding/build start
  // work on mount and must never run against the empty pre-hydration state.
  if (!hydrated) return req === 'welcome' ? <>{children}</> : null;
  if (!allowed) return null;
  return <>{children}</>;
}

export { RESUME };
