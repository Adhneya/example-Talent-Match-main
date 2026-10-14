'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import Link from 'next/link';
import { RESUME } from '@/components/ZoneGuard';
import { useStore } from '@/store/AppStore';
import { Arrow, Bookmark, Doc, Heart, Spark, Star, Tick, Undo, Users } from '@/components/Icons';
import LandingHeader, { NAV, scrollToHash } from './_landing/LandingHeader';
import SwipePreview from './_landing/SwipePreview';
import EmployerNotify from './_landing/EmployerNotify';
import GrowthTree from './_landing/GrowthTree';
import { track } from '@/lib/analytics';
import s from './_landing/landing.module.css';

/** S-01 Welcome — the marketplace in three pillars (slide 2), with the swipe demonstrated up front. */

const PILLARS = [
  {
    title: 'Fast onboarding',
    body: 'Sign in with LinkedIn, add your resume, get an optimized profile — three steps, under two minutes.',
    meta: '3 steps · ~2 min',
    icon: <Spark size={22} />,
  },
  {
    title: 'Two-sided match',
    body: 'Both sides opt in by swiping, so a match signals genuine mutual interest rather than a cold application.',
    meta: 'Mutual opt-in',
    icon: <Heart size={22} />,
  },
  {
    title: 'Flexible engagement',
    body: 'On a match, the employer can run a paid trial or go straight to a standard interview.',
    meta: 'Paid trial or interview',
    icon: <Users size={22} />,
  },
];

const TRUTHS = [
  { value: '3 steps', label: 'Connect, auto-build, target' },
  { value: '~2 min', label: 'From sign-in to first swipe' },
  { value: '1 tap', label: 'To pass or say you’re interested' },
  { value: 'Mutual', label: 'A match means both said yes' },
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

const delay = (ms: number) => ({ '--delay': `${ms}ms` }) as CSSProperties;

export default function HomePage() {
  const { stage, user } = useStore();
  const resumeHref = RESUME[stage];
  const resuming = stage !== 'new';
  // Returning candidates sign in with LinkedIn; once signed in, Log In just resumes.
  const loginHref = user ? resumeHref : '/signin';

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
      className={`${s.cta} ${s.ctaPrimary}`}
      onClick={() => track('landing_cta_clicked', { cta: 'find_roles', location })}
    >
      {resuming ? 'Continue to roles' : 'Find Roles'} <Arrow size={18} />
    </Link>
  );
  const postRole = (location: CtaLocation) => (
    <a
      href="#employers"
      className={`${s.cta} ${s.ctaSecondary}`}
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
        {/* ── Hero ─────────────────────────────────────────── */}
        <section id="hero" className={s.hero} aria-labelledby="hero-title">
          <div className={s.heroBg} aria-hidden="true" />
          <div className={s.heroGridLines} aria-hidden="true" />
          <div className={`${s.container} ${s.heroGrid}`}>
            <div className={s.heroCopy}>
              <span className={`${s.eyebrow} ${s.enter}`}>
                <span className={s.pulse} aria-hidden="true" />A two-sided hiring marketplace
              </span>
              <h1 id="hero-title" className={`${s.headline} ${s.enter}`} style={delay(80)}>
                <span className={s.headlineLine}>Swipe on roles.</span>
                <span className={s.headlineLine}>
                  Match when it’s <em className={s.headlineAccent}>mutual.</em>
                </span>
              </h1>
              <p className={`${s.sub} ${s.enter}`} style={delay(180)}>
                Live roles with the pay shown up front. One tap to pass, one tap to say you’re interested.
              </p>
              <div className={`${s.ctaRow} ${s.enter}`} style={delay(260)}>
                {findRoles('hero')}
                {postRole('hero')}
              </div>
              <ul className={`${s.assurances} ${s.enter}`} style={delay(340)}>
                {['About two minutes to set up', 'Pay shown up front', 'You approve your profile first'].map((t) => (
                  <li key={t}>
                    <span className={s.check} aria-hidden="true">
                      <Tick size={12} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className={s.enter} style={delay(220)}>
              <SwipePreview />
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

        {/* ── How it works ─────────────────────────────────── */}
        <section id="how" className={s.section} aria-labelledby="how-title" tabIndex={-1}>
          <div className={s.container}>
            <div className={`${s.sectionHead} ${s.reveal}`} data-reveal>
              <span className={s.kicker}>How it works</span>
              <h2 id="how-title" className={s.h2}>
                From resume to a <em>real match</em>, in three moves.
              </h2>
              <p className={s.lead}>
                A profile you approve, a deck of live roles, and matches that only happen when both sides say yes.
              </p>
            </div>

            <div className={s.stepsWrap}>
              <span className={s.connector} data-reveal aria-hidden="true" />
              <ol className={s.steps}>
                {PILLARS.map((p, i) => (
                  <li key={p.title} className={`${s.step} ${s.reveal}`} data-reveal style={delay(i * 140)}>
                    <span className={s.node} aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <article className={s.stepCard}>
                      <span className={s.iconBadge} aria-hidden="true">
                        {p.icon}
                      </span>
                      <h3 className={s.stepTitle}>
                        <span className="sr-only">Step {i + 1}: </span>
                        {p.title}
                      </h3>
                      <p className={s.stepBody}>{p.body}</p>
                      <span className={s.stepMeta}>{p.meta}</span>
                    </article>
                  </li>
                ))}
              </ol>
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

            <div className={`${s.profileVisual} ${s.reveal}`} data-reveal style={delay(160)} aria-hidden="true">
              <div className={s.inputs}>
                <span className={s.inputPill}>
                  <span style={{ color: '#0a66c2', fontWeight: 800 }}>in</span> Sign in with LinkedIn
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
              <div className={s.pcard}>
                <div className={s.pcardHead}>
                  <div className={s.pcardEyebrow}>Your profile</div>
                  <div className={s.pcardTitle}>Senior Product Manager</div>
                  <p className={s.pcardSummary}>
                    7 years in B2B SaaS product, most recently leading payments at a Series C fintech.
                  </p>
                </div>
                <div className={s.pcardBody}>
                  <div className={s.tags}>
                    {['Roadmapping', 'User Research', 'SQL', 'A/B Testing', 'Payments'].map((t) => (
                      <span key={t} className={s.tag}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className={s.standout}>
                    <Star size={16} />
                    Launched usage-based billing that lifted net revenue retention from 104% to 118%.
                  </div>
                  <div className={s.salaryRow}>
                    <span className={s.fine}>Salary expectation</span>
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
