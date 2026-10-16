'use client';

import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { useReducedMotion, useScroll, useTransform } from 'motion/react';
import * as m from 'motion/react-m';
import { Arrow, Doc, Heart, Upload, Users } from '@/components/Icons';
import { track } from '@/lib/analytics';
import RevealHeading from './RevealHeading';

type StepKey = 'upload' | 'match' | 'interview';

const STEPS: { key: StepKey; title: string; body: string; meta: string; visual: ReactNode }[] = [
  {
    key: 'upload',
    title: 'Upload',
    body: 'Sign in with LinkedIn and drop in your resume. We turn it into a structured profile — and nothing goes live until you approve it.',
    meta: 'About two minutes',
    visual: <UploadVisual />,
  },
  {
    key: 'match',
    title: 'Match',
    body: 'Live roles ranked against your profile, pay band first. Swipe right on the ones you want; it’s a match only when the employer says yes too.',
    meta: 'Mutual opt-in',
    visual: <MatchVisual />,
  },
  {
    key: 'interview',
    title: 'Interview',
    body: 'On a match, the employer picks the next step: a three-week paid trial to test fit both ways, or the standard screen, panel and offer.',
    meta: 'Paid trial or interview',
    visual: <InterviewVisual />,
  },
];

/**
 * Viewport 2. "How it works" as a horizontal scroll-snap strip on full-bleed
 * navy. Each step card scales up as it reaches the centre of the strip (its
 * own horizontal scroll progress → scale/opacity). Prev/next buttons and the
 * focusable strip keep it usable with a mouse wheel or keyboard.
 */
export default function HowItWorks() {
  const strip = useRef<HTMLOListElement | null>(null);

  function page(dir: 1 | -1) {
    const el = strip.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('li');
    el.scrollBy({ left: dir * (card?.offsetWidth ?? el.clientWidth * 0.7), behavior: 'smooth' });
  }

  // One analytics event per step, the first time it reaches the centre.
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const key = (e.target as HTMLElement).dataset.step as StepKey;
          if (e.isIntersecting && !seen.has(key)) {
            seen.add(key);
            track('landing_how_step_viewed', { step: key });
          }
        }
      },
      { root: el, threshold: 0.75 },
    );
    el.querySelectorAll('li').forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="how"
      tabIndex={-1}
      aria-labelledby="how-title"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-navy py-24 text-white outline-none"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_45%_at_80%_20%,rgba(136,145,201,0.45),transparent_70%),radial-gradient(30%_35%_at_10%_90%,rgba(249,97,103,0.16),transparent_70%)]" />

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-wrap items-end justify-between gap-6 px-4 sm:px-8 xl:px-12">
        <div>
          <p className="font-l-sans text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-highlight">How it works</p>
          <RevealHeading
            id="how-title"
            className="mt-4 font-l-sans text-[clamp(2.4rem,6vw,5.25rem)] font-bold leading-[0.95] tracking-[-0.04em]"
            lines={[
              'From resume to interview,',
              <span key="b">
                in <em className="font-l-serif font-normal italic text-highlight">three moves.</em>
              </span>,
            ]}
          />
        </div>
        <div className="flex gap-3">
          <StripButton label="Previous step" onClick={() => page(-1)} flip />
          <StripButton label="Next step" onClick={() => page(1)} />
        </div>
      </div>

      <ol
        ref={strip}
        id="how-strip"
        tabIndex={0}
        aria-label="How it works, three steps — scroll sideways"
        className="relative mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto px-[max(1rem,calc(50vw-min(40vw,280px)))] pb-6 outline-none [scrollbar-width:none] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/30 [&::-webkit-scrollbar]:hidden"
      >
        {STEPS.map((step, i) => (
          <StepCard key={step.key} index={i} step={step} container={strip} />
        ))}
      </ol>
    </section>
  );
}

function StepCard({
  index,
  step,
  container,
}: {
  index: number;
  step: (typeof STEPS)[number];
  container: RefObject<HTMLOListElement>;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLLIElement | null>(null);
  const { scrollXProgress } = useScroll({ container, target: ref, axis: 'x', offset: ['start end', 'end start'] });
  // 0 = entering from the right edge, 0.5 = centred, 1 = leaving on the left.
  // Always bound (never `style={undefined}`): motion keeps the last value it wrote, so reduced
  // motion must map to identity rather than unbind — otherwise a card can stay at 0.45 opacity.
  const scale = useTransform(scrollXProgress, [0, 0.5, 1], reduced ? [1, 1, 1] : [0.84, 1, 0.84]);
  const opacity = useTransform(scrollXProgress, [0, 0.5, 1], reduced ? [1, 1, 1] : [0.45, 1, 0.45]);

  return (
    <m.li
      ref={ref}
      data-step={step.key}
      style={{ scale, opacity }}
      className="w-[min(80vw,560px)] shrink-0 snap-center will-change-transform"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-[28px] bg-white text-ink shadow-[0_50px_100px_-50px_rgba(0,0,0,0.6)]">
        <div className="relative flex h-[220px] items-center justify-center overflow-hidden bg-tint sm:h-[260px]">
          {/* Decorative watermark numeral — generated content, so it isn't text to assistive tech or contrast checks. */}
          <span
            aria-hidden="true"
            data-num={String(index + 1).padStart(2, '0')}
            className="pointer-events-none absolute -left-2 -top-8 font-l-sans text-[11rem] font-black leading-none tracking-[-0.06em] text-navy/[0.07] before:content-[attr(data-num)]"
          />
          <div aria-hidden="true" className="relative">
            {step.visual}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-7 sm:p-9">
          <h3 className="font-l-sans text-[2rem] font-bold leading-none tracking-[-0.03em] sm:text-[2.4rem]">
            <span className="sr-only">Step {index + 1}: </span>
            {step.title}
          </h3>
          <p className="mt-4 text-[1.1rem] leading-[1.55] text-muted">{step.body}</p>
          <span className="mt-6 w-fit rounded-full bg-tint px-3.5 py-1.5 font-l-sans text-[0.8rem] font-semibold text-navy">
            {step.meta}
          </span>
        </div>
      </article>
    </m.li>
  );
}

function StripButton({ label, onClick, flip = false }: { label: string; onClick: () => void; flip?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-controls="how-strip"
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
    >
      <Arrow size={18} style={flip ? { transform: 'scaleX(-1)' } : undefined} />
    </button>
  );
}

/* ── Step visuals: inline, palette-only, decorative ─────────────── */

function UploadVisual() {
  return (
    <div className="flex flex-col items-center gap-3 font-l-sans">
      <div className="flex gap-2">
        <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-[0.8rem] font-semibold shadow-sm">
          <span className="font-bold text-[#0a66c2]">in</span> LinkedIn
        </span>
        <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-[0.8rem] font-semibold shadow-sm">
          <Doc size={14} /> resume.pdf
        </span>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white">
        <Upload size={18} />
      </span>
      <span className="rounded-xl bg-navy px-4 py-2.5 text-[0.85rem] font-semibold text-white">Your profile · ready to review</span>
    </div>
  );
}

function MatchVisual() {
  return (
    <div className="relative h-[150px] w-[230px] font-l-sans">
      <div className="absolute left-0 top-3 h-[130px] w-[110px] -rotate-6 rounded-2xl border border-border bg-white p-3 text-[0.7rem] font-semibold shadow-md">
        <span className="block text-muted">You</span>Senior PM
      </div>
      <div className="absolute right-0 top-3 h-[130px] w-[110px] rotate-6 rounded-2xl border border-border bg-white p-3 text-[0.7rem] font-semibold shadow-md">
        <span className="block text-muted">Ledgerly</span>$175K – $210K
      </div>
      <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-coral text-white shadow-[0_0_0_6px_#F2F3F9]">
        <Heart size={22} />
      </span>
    </div>
  );
}

function InterviewVisual() {
  return (
    <div className="flex flex-col items-center gap-3 font-l-sans text-[0.8rem] font-semibold">
      <span className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-white">
        <Users size={16} /> 3-week paid trial
      </span>
      <span className="text-muted">or</span>
      <div className="flex gap-1.5">
        {['Screen', 'Panel', 'Offer'].map((s, i) => (
          <span key={s} className={`rounded-lg px-3 py-2 ${i === 2 ? 'bg-highlight text-navy' : 'border border-border bg-white text-navy'}`}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
