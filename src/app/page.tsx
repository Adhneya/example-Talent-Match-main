'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Role } from '@/context/FormContext';

export default function LandingPage() {
  const router = useRouter();
  const { role, email, update } = useForm();
  const [touched, setTouched] = useState(false);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // PMs build a profile then swipe; companies go straight to their dashboard.
  const destination = role === 'hiring' ? '/dashboard' : '/profile';

  function getStarted() {
    setTouched(true);
    if (!emailOk) return;
    update({ isDemo: false });
    router.push(destination);
  }

  function startDemo() {
    update({ isDemo: true, email: email || 'demo@talentmatch.app' });
    router.push(destination);
  }

  return (
    <main className="wrap">
      <section className="col reveal" style={{ maxWidth: 540, padding: '40px 0 100px', textAlign: 'center' }}>
        <h1 className="t-display">
          <span style={{ fontWeight: 600 }}>Get hired</span> as a PM through real work,{' '}
          <span style={{ fontWeight: 600 }}>not résumés.</span>
        </h1>
        <p className="t-lead" style={{ marginTop: 22 }}>
          Swipe on companies. Match. Do a paid trial. Get the job.
        </p>

        <div className="card" style={{ marginTop: 40, padding: '28px 28px 30px', textAlign: 'left' }}>
          {/* Role toggle */}
          <div
            role="tablist"
            aria-label="I am a"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              padding: 5,
              background: 'rgba(26,26,26,0.04)',
              border: '1px solid var(--hairline)',
              borderRadius: 13,
            }}
          >
            <RoleTab active={role === 'pm'} onClick={() => update({ role: 'pm' as Role })}>
              I&apos;m a PM
            </RoleTab>
            <RoleTab active={role === 'hiring'} onClick={() => update({ role: 'hiring' as Role })}>
              I&apos;m hiring
            </RoleTab>
          </div>

          {/* Email */}
          <div className="field" style={{ marginTop: 18 }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => update({ email: e.target.value })}
              onBlur={() => setTouched(true)}
              aria-invalid={touched && !emailOk}
              style={
                touched && !emailOk
                  ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(220,38,38,0.12)' }
                  : undefined
              }
            />
            {touched && !emailOk && (
              <span style={{ display: 'block', marginTop: 7, fontSize: 'var(--fs-fine)', color: 'var(--danger)' }}>
                Enter a valid email to continue.
              </span>
            )}
          </div>

          {/* The ONE primary action */}
          <button className="btn btn--primary btn--lg btn--block" style={{ marginTop: 16 }} onClick={getStarted}>
            Get Started
          </button>

          {/* Secondary path, demoted to a quiet link */}
          <p className="t-fine" style={{ marginTop: 18, textAlign: 'center' }}>
            or{' '}
            <button className="link-accent" onClick={startDemo}>
              start a demo without email
            </button>
          </p>

          <p className="t-fine" style={{ marginTop: 16, textAlign: 'center', color: 'var(--faint)' }}>
            We&apos;ll send you a magic link to sign in.
          </p>
        </div>
      </section>
    </main>
  );
}

function RoleTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        border: 'none',
        borderRadius: 9,
        padding: '0.7em 0',
        fontWeight: 600,
        fontSize: '0.95rem',
        transition: 'all 180ms ease',
        background: active ? 'var(--accent-ink)' : 'transparent',
        color: active ? '#fff' : 'var(--muted)',
      }}
    >
      {children}
    </button>
  );
}
