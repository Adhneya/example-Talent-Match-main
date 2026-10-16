'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMotionTemplate, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import * as m from 'motion/react-m';
import { Arrow } from '@/components/Icons';
import { track } from '@/lib/analytics';
import MagneticLink from './MagneticLink';
import SwipePreview, { type DemoDecision } from './SwipePreview';
import { scrollToHash } from './LandingHeader';

const SPRING = { type: 'spring', stiffness: 100, damping: 20 } as const;
/** Page-load order: heading → subtext → deck → CTA, ~100ms apart. */
const ORDER = { heading: 0, sub: 0.1, deck: 0.2, cta: 0.3 } as const;

/** Scroll distance (px) over which the heading's weight travels 300 → 800. */
const WEIGHT_SCROLL = 520;

type Lit = 'off' | 'spark' | 'match';

/**
 * Viewport 1. Asymmetric: the live swipe deck takes the left 60%, the heading,
 * subtext and CTA the right 40% (stacked heading → deck → CTA on phones).
 *
 * Signature moment: the heading's real `wght` axis (Inter, variable) follows
 * scroll from 300 to 800. Lines never wrap and the heading box has a fixed
 * height per line, so the weight change can't move anything else (no CLS).
 *
 * Parallax: the gradient field moves at 0.3× scroll speed (translateY 0.7×
 * scroll against the page) and the deck at 0.8× (translateY 0.2×).
 */
export default function Hero({ resumeHref, resuming }: { resumeHref: string; resuming: boolean }) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  // Take the current offset on mount (reload mid-page, or a scroll before hydration).
  useEffect(() => scrollY.set(window.scrollY), [scrollY]);

  const weightRaw = useTransform(scrollY, [0, WEIGHT_SCROLL], [300, 800], { clamp: true });
  const weight = useSpring(weightRaw, { stiffness: 120, damping: 28 });
  const fontVariationSettings = useMotionTemplate`'wght' ${weight}`;

  // Bound even under reduced motion (mapped to 0), so no stale offset survives a preference change.
  const bgY = useTransform(scrollY, [0, 1200], reduced ? [0, 0] : [0, 840], { clamp: true });
  const deckY = useTransform(scrollY, [0, 1200], reduced ? [0, 0] : [0, 240], { clamp: true });

  // "mutual." answers the demo: a right swipe lifts its highlight, a mutual match fills it.
  const [lit, setLit] = useState<Lit>('off');
  const litTimer = useRef<number>();
  const onDecision = useCallback(({ dir, matched }: DemoDecision) => {
    if (dir !== 'yes') return;
    window.clearTimeout(litTimer.current);
    setLit(matched ? 'match' : 'spark');
    litTimer.current = window.setTimeout(() => setLit('off'), matched ? 2600 : 900);
  }, []);
  useEffect(() => () => window.clearTimeout(litTimer.current), []);

  const enter = (delay: number, fade = true) =>
    reduced
      ? { initial: false as const }
      : {
          // Text blocks only rise (no fade), so they paint with the server HTML — the heading and
          // subtext are the LCP candidates, and an opacity-0 start would hold LCP until hydration.
          initial: fade ? { opacity: 0, y: 28 } : { y: '0.35em' },
          animate: fade ? { opacity: 1, y: 0 } : { y: 0 },
          transition: { ...SPRING, delay },
        };

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative isolate min-h-[100svh] overflow-hidden pb-16 pt-[96px] lg:flex lg:items-center lg:pb-10"
    >
      {/* Gradient field — parallax at 0.3× scroll speed. */}
      <m.div
        aria-hidden="true"
        style={{ y: bgY }}
        className="pointer-events-none absolute inset-x-0 -top-[20%] -z-10 h-[140%] will-change-transform"
      >
        <div className="absolute left-[8%] top-[18%] h-[52vmax] w-[52vmax] rounded-full bg-[radial-gradient(circle,rgba(174,182,228,0.55),transparent_62%)]" />
        <div className="absolute left-[34%] top-[46%] h-[34vmax] w-[34vmax] rounded-full bg-[radial-gradient(circle,rgba(249,97,103,0.16),transparent_62%)]" />
        <div className="absolute right-[-10%] top-[4%] h-[40vmax] w-[40vmax] rounded-full bg-[radial-gradient(circle,rgba(207,214,245,0.7),transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(47,60,126,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(47,60,126,0.06)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_55%_50%_at_32%_45%,#000_10%,transparent_75%)]" />
      </m.div>

      <div data-hero-grid className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-y-10 px-4 [--deck-w:min(360px,84vw)] [grid-template-areas:'copy'_'deck'_'cta'] sm:px-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-x-12 lg:gap-y-10 lg:[--deck-w:clamp(280px,min(30vw,calc((100svh-280px)*0.8)),420px)] lg:[grid-template-areas:'deck_copy'_'deck_cta'] lg:[grid-template-rows:1fr_1fr] xl:px-12">
        {/* Right 40% on desktop (heading, subtext); first on phones. */}
        <div className="flex flex-col justify-end [grid-area:copy]" data-hero-copy>
          <m.p
            {...enter(ORDER.heading, false)}
            className="mb-6 inline-flex w-fit items-center gap-2.5 rounded-full border border-border bg-white/70 px-3.5 py-1.5 font-l-sans text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-navy backdrop-blur"
          >
            <span className="h-2 w-2 rounded-full bg-coral" aria-hidden="true" />
            Smart job matching · pay up front
          </m.p>

          <m.h1
            id="hero-title"
            {...enter(ORDER.heading, false)}
            style={{ fontVariationSettings: reduced ? "'wght' 800" : fontVariationSettings }}
            className="landing-heading text-[clamp(2.3rem,12.4vw,4rem)] leading-[0.94] tracking-[-0.045em] text-ink lg:text-[clamp(3rem,5.1vw,6rem)]"
          >
            {/* One line per box, never wrapping: weight changes widen glyphs, never the layout. */}
            <span className="block h-[0.94em] whitespace-nowrap">Swipe on roles.</span>
            <span className="block h-[0.94em] whitespace-nowrap">Match when</span>
            <span className="block h-[0.94em] whitespace-nowrap">
              it’s{' '}
              <span className="relative inline-block font-l-serif italic tracking-[-0.02em] text-coral-pressed">
                <m.span
                  aria-hidden="true"
                  className="absolute inset-x-[-0.04em] bottom-[0.06em] -z-10 h-[0.86em] origin-bottom rounded-[0.08em] bg-highlight"
                  initial={false}
                  animate={{ scaleY: lit === 'match' ? 1 : lit === 'spark' ? 0.5 : 0.16 }}
                  transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 18 }}
                />
                mutual.
              </span>
            </span>
          </m.h1>

          <m.p {...enter(ORDER.sub, false)} className="mt-7 max-w-[34ch] text-[1.2rem] leading-[1.5] text-muted lg:text-[1.3rem]">
            Live roles ranked against your resume, with the pay band leading every card. One tap to pass, one to say
            you’re interested — and a match only when they say yes too.
          </m.p>
        </div>

        {/* Left 60% on desktop: the deck, at 0.8× scroll speed. */}
        <m.div style={{ y: deckY }} className="flex items-center justify-center [grid-area:deck]">
          <m.div {...enter(ORDER.deck)} className="w-full">
            <SwipePreview onDecision={onDecision} />
          </m.div>
        </m.div>

        {/* Under the subtext on desktop; after the deck on phones (heading → deck → CTA). */}
        <m.div
          {...enter(ORDER.cta)}
          className="flex flex-col items-center gap-4 [grid-area:cta] sm:flex-row sm:justify-center lg:items-start lg:justify-start lg:gap-6"
        >
          <Cta resumeHref={resumeHref} resuming={resuming} />
        </m.div>
      </div>
    </section>
  );
}

function Cta({ resumeHref, resuming }: { resumeHref: string; resuming: boolean }) {
  const label = resuming ? 'Continue to roles' : 'Find Roles';
  return (
    <>
      <MagneticLink
        href={resumeHref}
        label={label}
        onClick={() => track('landing_cta_clicked', { cta: 'find_roles', location: 'hero' })}
      >
        {label} <Arrow size={18} />
      </MagneticLink>
      <a
        href="#employers"
        onClick={(e) => {
          track('landing_cta_clicked', { cta: 'post_role', location: 'hero' });
          scrollToHash(e, '#employers', 'input');
        }}
        className="inline-flex min-h-[44px] items-center font-l-sans text-[0.98rem] font-semibold text-navy underline decoration-navy/30 underline-offset-[6px] transition-colors hover:decoration-navy"
      >
        Hiring? Post a role
      </a>
    </>
  );
}
