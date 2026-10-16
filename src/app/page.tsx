'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { RESUME } from '@/components/ZoneGuard';
import { useStore } from '@/store/AppStore';
import { Arrow, Bookmark, Doc, Heart, Star, Tick, Undo } from '@/components/Icons';
import { RoleCardFace } from '@/components/RoleCard';
import LandingHeader, { NAV, scrollToHash } from './_landing/LandingHeader';
import SwipePreview, { type DemoDecision } from './_landing/SwipePreview';
import EmployerNotify from './_landing/EmployerNotify';
import GrowthTree from './_landing/GrowthTree';
import { track } from '@/lib/analytics';
import s from './_landing/landing.module.css';

/** S-01 Welcome — the swipe card is the hero; the page then walks one card through the product. */

const TRUTHS = [
  { value: '3 steps', label: 'Connect, auto-build, target' },
  { value: '~2 min', label: 'From sign-in to first swipe' },
  { value: '1 tap', label: 'To pass or say you’re interested' },
  { value: 'Mutual', label: 'A match means both said yes' },
];

/** The three moves of the pinned chapter — one card travels through all three. */
const MOVES = [
  {
    title: 'Connect',
    body: 'Sign in with LinkedIn and add your resume. We build a structured profile, and nothing goes live until you approve it.',
    meta: '3 steps · ~2 min',
  },
  {
    title: 'Swipe',
    body: 'Live roles, ranked for the role you’re after, with the pay band leading every card. One tap to pass, one to say you’re interested.',
    meta: 'Pay shown up front',
  },
  {
    title: 'Match',
    body: 'Employers swipe too. When both sides say yes, they choose what happens next: a paid trial or a standard interview.',
    meta: 'Mutual opt-in',
  },
];

const TALENT = [
  {
    title: 'Pay shown up front',
    body: 'The pay band leads the card, so you can judge a role in seconds.',
    icon: <span style={{ fontWeight: 700 }}>$</span>,
  },
  {
    title: 'Detail one tap deeper',
    body: 'Cards stay scannable. Tap for the full role when you want it.',
    icon: <Doc size={18} />,
  },
  {
    title: 'Undo your last swipe',
    body: 'Swiped too fast? Take it straight back.',
    icon: <Undo size={18} />,
  },
  {
    title: 'Save now, apply later',
    body: 'Interested roles land in your Saved list, ready to apply on the employer’s own posting.',
    icon: <Bookmark size={18} />,
  },
];

const JOURNEY_ROLE = {
  company: { name: 'Ledgerly', stage: 'Series C', sector: 'Fintech', location: 'Remote (US)' },
  title: 'Senior Product Manager, Payments',
  summary: 'Lead card issuing and usage-based billing for SMB finance teams.',
  pay: { min: 175000, max: 210000, currency: 'USD' as const, period: 'year' as const },
  postedDaysAgo: 2,
};

const delay = (ms: number) => ({ '--delay': `${ms}ms` }) as CSSProperties;

type Lit = 'off' | 'spark' | 'match';

/** "mutual." answers the demo: a right swipe brightens it, a mutual match fills it. */
function useLitAccent() {
  const [lit, setLit] = useState<Lit>('off');
  const timer = useRef<number>();
  const onDecision = useCallback(({ dir, matched }: DemoDecision) => {
    if (dir !== 'yes') return;
    window.clearTimeout(timer.current);
    setLit(matched ? 'match' : 'spark');
    timer.current = window.setTimeout(() => setLit('off'), matched ? 2600 : 900);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { lit, onDecision };
}

/** Scroll position through the pinned chapter → which of the three moves is showing. */
function useMoveStep() {
  const ref = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const travel = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / travel));
      setStep(Math.min(MOVES.length - 1, Math.floor(p * MOVES.length)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return { ref, step };
}

export default function HomePage() {
  const { stage, user } = useStore();
  const resumeHref = RESUME[stage];
  const resuming = stage !== 'new';
  // Returning candidates sign in with LinkedIn; once signed in, Log In just resumes.
  const loginHref = user ? resumeHref : '/signin';
  const { lit, onDecision } = useLitAccent();
  const moves = useMoveStep();

  // Scroll reveal: mark elements as shown once they enter the viewport.
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.shown = 'true';
          io.unobserve(e.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // The background tree is brighter while the hero is in view, fainter behind section copy.
  const pageRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const io = new IntersectionObserver(([entry]) => {
      pageRef.current?.setAttribute('data-hero', String(entry.intersectionRatio > 0.45));
    }, { threshold: [0, 0.45, 1] });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  type CtaLocation = 'hero' | 'talent' | 'final';
  const findRoles = (location: CtaLocation) => (
    <Link
      href={resumeHref}
      className="btn btn--primary btn--lg"
      onClick={() => track('landing_cta_clicked', { cta: 'find_roles', location })}
    >
      {resuming ? 'Continue to roles' : 'Find Roles'} <Arrow size={18} />
    </Link>
  );
  const postRole = (location: CtaLocation) => (
    <a
      href="#employers"
      className="btn btn--lg"
      onClick={(e) => {
        track('landing_cta_clicked', { cta: 'post_role', location });
        scrollToHash(e, '#employers', 'input');
      }}
    >
      Post a Role
    </a>
  );

  return (
    <div ref={pageRef} className={s.page} data-hero="true">
      <GrowthTree />
      <a href="#main" className={s.skip}>
        Skip to content
      </a>
      <LandingHeader resumeHref={resumeHref} loginHref={loginHref} resuming={resuming} />

      <main id="main">
        {/* ── Hero: the card is the centrepiece, the headline frames it ── */}
        <section id="hero" className={s.hero} aria-labelledby="hero-title">
          <div className={s.heroBg} aria-hidden="true" />
          <div className={s.heroGridLines} aria-hidden="true" />
          <div className={`${s.container} ${s.heroGrid}`}>
            <span className={`${s.eyebrow} ${s.enter}`}>
              <span className={s.pulse} aria-hidden="true" />A two-sided hiring marketplace
            </span>
            <h1 id="hero-title" className={s.headline}>
              <span className={`${s.headlineLine} ${s.line1} ${s.enter}`} style={delay(80)}>
                Swipe on roles.{' '}
              </span>
              <span className={`${s.headlineLine} ${s.line2} ${s.enter}`} style={delay(200)}>
                Match when it’s{' '}
                <em className={s.headlineAccent} data-lit={lit}>
                  mutual.
                </em>
              </span>
            </h1>
            <div className={`${s.heroCopy} ${s.enter}`} style={delay(280)}>
              <p className={s.sub}>Live roles with the pay shown up front. One tap to pass, one tap to say you’re interested.</p>
              <div className={s.ctaRow}>
                {findRoles('hero')}
                {postRole('hero')}
              </div>
            </div>
            <ul className={`${s.assurances} ${s.enter}`} style={delay(360)}>
              {['About two minutes to set up', 'Pay shown up front', 'You approve your profile first'].map((t) => (
                <li key={t}>
                  <span className={s.check} aria-hidden="true">
                    <Tick size={12} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div className={`${s.heroStage} ${s.enter}`} style={delay(140)}>
              <SwipePreview onDecision={onDecision} />
            </div>
          </div>
        </section>

        {/* ── Product truths ───────────────────────────────── */}
        <section className={s.truths} aria-label="At a glance">
          <div className={`${s.container} ${s.truthsGrid}`}>
            {TRUTHS.map((t, i) => (
              <div key={t.value} className={`${s.truth} ${s.reveal}`} data-reveal style={delay(i * 80)}>
                <div className={s.truthValue}>{t.value}</div>
                <div className={s.truthLabel}>{t.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works: a pinned chapter, one card travels Connect → Swipe → Match ── */}
        <section
          id="how"
          ref={moves.ref}
          className={s.moves}
          aria-labelledby="how-title"
          tabIndex={-1}
          data-step={moves.step}
        >
          <div className={s.movesPin}>
            <div className={`${s.container} ${s.movesGrid}`}>
              <div className={s.movesHead}>
                <span className={`${s.kicker} ${s.kickerLight}`}>How it works</span>
                <h2 id="how-title" className={`${s.h2} ${s.h2Light}`}>
                  From resume to a <em>real match</em>, in three moves.
                </h2>
              </div>

              <ol className={s.steps}>
                {MOVES.map((m, i) => (
                  <li key={m.title} className={s.move} data-active={i === moves.step} aria-current={i === moves.step ? 'step' : undefined}>
                    <span className={s.moveNum} aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className={s.moveTitle}>
                        <span className="sr-only">Step {i + 1}: </span>
                        {m.title}
                      </h3>
                      <p className={s.moveBody}>{m.body}</p>
                      <span className={s.moveMeta}>{m.meta}</span>
                    </div>
                  </li>
                ))}
              </ol>

              <div className={s.journey} data-step={moves.step} aria-hidden="true">
                <div className={s.jInputs}>
                  <span className={s.inputPill}>
                    <span style={{ color: 'var(--linkedin)', fontWeight: 700 }}>in</span> Sign in with LinkedIn
                  </span>
                  <span className={s.inputPill}>
                    <Doc size={14} /> resume.pdf
                  </span>
                </div>
                <div className={`card pcard ${s.jProfile}`}>
                  <div className="pcard__head">
                    <span className="eyebrow">Your profile</span>
                    <div className={s.jProfileTitle}>Senior Product Manager</div>
                  </div>
                  <div className={s.jProfileBody}>
                    {['Roadmapping', 'SQL', 'Payments'].map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={`rolecard ${s.jRole}`}>
                  <RoleCardFace role={JOURNEY_ROLE} as="div" />
                  <span className="rolecard__stamp rolecard__stamp--yes">Interested</span>
                </div>
                <div className={s.jHeart}>
                  <Heart size={30} />
                </div>
                <div className={s.jMatch}>It’s a match</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── For talent ───────────────────────────────────── */}
        <section id="talent" className={`${s.section} ${s.talent}`} aria-labelledby="talent-title" tabIndex={-1}>
          <div className={`${s.container} ${s.split}`}>
            <div className={s.reveal} data-reveal>
              <div className={s.sectionHead}>
                <span className={s.kicker}>For talent</span>
                <h2 id="talent-title" className={s.h2}>
                  Built for the person <em>doing the swiping.</em>
                </h2>
                <p className={s.lead}>
                  Sign in with LinkedIn and we turn your resume into a structured profile. You check it over, and the
                  deck is ranked for the role you’re after.
                </p>
              </div>
              <ul className={s.features}>
                {TALENT.map((f) => (
                  <li key={f.title} className={s.feature}>
                    <span className={s.featureIcon} aria-hidden="true">
                      {f.icon}
                    </span>
                    <div className={s.featureTitle}>{f.title}</div>
                    <p className={s.featureBody}>{f.body}</p>
                  </li>
                ))}
              </ul>
              <div className={s.ctaRow}>{findRoles('talent')}</div>
            </div>

            {/* The app's own profile card (ProfileConfirmCard's classes), not a look-alike. */}
            <div className={`${s.profileVisual} ${s.reveal}`} data-reveal style={delay(160)} aria-hidden="true">
              <div className={s.inputs}>
                <span className={s.inputPill}>
                  <span style={{ color: 'var(--linkedin)', fontWeight: 700 }}>in</span> Sign in with LinkedIn
                </span>
                <span className={s.inputPill}>
                  <Doc size={14} /> resume.pdf
                </span>
              </div>
              <div className={s.arrowDown}>
                <svg width="20" height="28" viewBox="0 0 20 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M10 2v22M3 17l7 7 7-7" />
                </svg>
              </div>
              <div className="card pcard">
                <div className="pcard__head">
                  <span className="eyebrow">Your profile</span>
                  <div className="t-h3" style={{ marginTop: 8 }}>
                    Senior Product Manager
                  </div>
                  <p className="t-fine" style={{ marginTop: 8, color: 'var(--lilac-3)' }}>
                    7 years in B2B SaaS product, most recently leading payments at a Series C fintech.
                  </p>
                </div>
                <div className="pcard__body">
                  <div className="pcard__section" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['Roadmapping', 'User Research', 'SQL', 'A/B Testing', 'Payments'].map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="pcard__section">
                    <div className="standout">
                      <Star size={16} />
                      <span>Launched usage-based billing that lifted net revenue retention from 104% to 118%.</span>
                    </div>
                  </div>
                  <div className="pcard__section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span className="t-fine">Salary expectation</span>
                    <span className={s.salary}>$160K – $185K</span>
                  </div>
                </div>
              </div>
              <div className={s.confirmBadge}>
                <span className={s.check}>
                  <Tick size={12} />
                </span>
                You confirm before it goes live
              </div>
            </div>
          </div>
        </section>

        {/* ── For employers ────────────────────────────────── */}
        <section id="employers" className={s.section} aria-labelledby="employers-title" tabIndex={-1}>
          <div className={s.container}>
            <div className={`${s.employersPanel} ${s.reveal}`} data-reveal>
              <div>
                <span className={`${s.kicker} ${s.kickerLight}`}>For employers</span>
                <h2 id="employers-title" className={`${s.h2} ${s.h2Light}`}>
                  Meet candidates who already said yes.
                </h2>
                <p className={`${s.lead} ${s.leadLight}`}>
                  Employers swipe too. When the interest is mutual, you choose what happens next.
                </p>
                <div className={s.paths}>
                  <div className={s.path}>
                    <div className={s.pathTitle}>3-week paid trial</div>
                    <p className={s.pathBody}>Internship-style, to test fit both ways before anyone commits.</p>
                  </div>
                  <div className={s.path}>
                    <div className={s.pathTitle}>Interview track</div>
                    <p className={s.pathBody}>The standard stages: screen, panel, offer.</p>
                  </div>
                </div>
              </div>
              <EmployerNotify />
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────── */}
        <section className={s.final} aria-labelledby="final-title">
          <div className={`${s.container} ${s.reveal}`} data-reveal>
            <span className={s.kicker}>Ready when you are</span>
            <h2 id="final-title" className={s.h2}>
              Your next role is <em>one swipe</em> away.
            </h2>
            <p className={s.lead}>Takes about two minutes. You’ll need a LinkedIn account and a resume.</p>
            <div className={s.finalCtas}>
              {findRoles('final')}
              {postRole('final')}
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={`${s.container} ${s.footerInner}`}>
          <Link href="/" className={s.brand} aria-label="TalentMatch home" style={{ fontSize: '1.3rem' }}>
            TalentMatch
            <span className={s.brandDot} aria-hidden="true" />
          </Link>
          <nav className={s.footerLinks} aria-label="Footer">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={(e) => scrollToHash(e, n.href)}>
                {n.label}
              </a>
            ))}
          </nav>
          <span className={s.fine}>© 2026 TalentMatch</span>
        </div>
      </footer>
    </div>
  );
}
