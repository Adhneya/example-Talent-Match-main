'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';

/** Three fixed steps — slide 3's hard constraint. Any new input must replace an existing one. */
const STEPS = [
  { path: '/onboarding/connect', label: 'Connect' },
  { path: '/onboarding/build', label: 'Auto-build' },
  { path: '/onboarding/target', label: 'Target' },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="stepper" aria-label="Onboarding progress">
      {STEPS.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li
            key={s.path}
            className={`stepper__item stepper__item--${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="stepper__bar" aria-hidden="true" />
            <span>
              {i + 1}. {s.label}
              {state === 'done' && <span className="sr-only"> (complete)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = Math.max(
    0,
    STEPS.findIndex((s) => pathname.startsWith(s.path)),
  );

  return (
    <>
      <Header />
      <main className="wrap">
        {/* Width-capped throughout: extra space is breathing room, never a second column. */}
        <section className="col onb">
          <StepIndicator current={current} />
          {children}
        </section>
      </main>
    </>
  );
}
