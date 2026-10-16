'use client';

import Link from 'next/link';
import { LazyMotion, MotionConfig } from 'motion/react';
import { RESUME } from '@/components/ZoneGuard';
import { useStore } from '@/store/AppStore';
import { landingSans, landingSerif } from './fonts';
import LandingHeader, { NAV, scrollToHash } from './LandingHeader';
import Hero from './Hero';
import HowItWorks from './HowItWorks';
import EmployerNotify from './EmployerNotify';

/**
 * S-01 Welcome, three viewports:
 *   1. Hero — the live swipe deck (left 60%) + variable-weight heading and CTA (right 40%)
 *   2. How it works — horizontal scroll-snap strip: Upload → Match → Interview
 *   3. For employers — the waitlist form
 *
 * Rendered by src/app/page.tsx (this folder is private, so this file is not a
 * route of its own). Motion: `m` components (motion/react-m) under LazyMotion,
 * with domAnimation loaded asynchronously, keep the first load small.
 * MotionConfig additionally honours the OS reduced-motion setting for any
 * transform the components don't gate themselves with useReducedMotion().
 */

/** The animation runtime loads after first paint, outside the route's First Load JS. */
const loadFeatures = () => import('./motionFeatures').then((mod) => mod.default);

export default function LandingPage() {
  const { stage, user } = useStore();
  const resumeHref = RESUME[stage];
  const resuming = stage !== 'new';
  // Returning candidates sign in with LinkedIn; once signed in, Log In just resumes.
  const loginHref = user ? resumeHref : '/signin';

  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <div className={`landing ${landingSans.variable} ${landingSerif.variable} overflow-x-clip`}>
          <a
            href="#main"
            className="fixed left-4 top-[-60px] z-[100] rounded-xl bg-navy px-4 py-2.5 font-l-sans font-semibold text-white transition-[top] focus:top-3"
          >
            Skip to content
          </a>
          <LandingHeader resumeHref={resumeHref} loginHref={loginHref} resuming={resuming} />

          <main id="main">
            <Hero resumeHref={resumeHref} resuming={resuming} />
            <HowItWorks />
            <EmployerNotify />
          </main>

          <footer className="border-t border-border">
            <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-8 font-l-sans sm:px-8 xl:px-12">
              <Link href="/" aria-label="TalentMatch home" className="inline-flex items-center gap-2 font-serif text-[1.3rem] font-bold text-navy">
                TalentMatch
                <span className="h-2 w-2 rounded-full bg-coral" aria-hidden="true" />
              </Link>
              <nav aria-label="Footer" className="flex flex-wrap gap-x-5 text-[0.88rem] text-muted">
                {NAV.map((n) => (
                  <a key={n.href} href={n.href} onClick={(e) => scrollToHash(e, n.href)} className="inline-flex min-h-[44px] items-center hover:text-ink">
                    {n.label}
                  </a>
                ))}
              </nav>
              <span className="text-[0.82rem] text-muted">© 2026 TalentMatch</span>
            </div>
          </footer>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
