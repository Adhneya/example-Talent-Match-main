'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Role } from '@/context/FormContext';
import { Tick } from '@/components/Icons';

export default function SignInPage() {
  const router = useRouter();
  const { role, email, update } = useForm();
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function sendLink() {
    setTouched(true);
    if (!emailOk) return;
    setSent(true);
  }

  function startDemo() {
    update({ isDemo: true, email: email || 'demo@talentmatch.app' });
    router.push(role === 'hiring' ? '/dashboard' : '/profile');
  }

  return (
    <main className="wrap">
      <section className="col reveal" style={{ maxWidth: 460, padding: '40px 0 100px', textAlign: 'center' }}>
        <h1 className="t-h1">Welcome back.</h1>
        <p className="t-lead" style={{ marginTop: 16 }}>
          Sign in with a magic link — no password to remember.
        </p>

        <div className="card" style={{ marginTop: 36, padding: '30px 28px', textAlign: 'left' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  margin: '0 auto 18px',
                  borderRadius: 14,
                  border: '1.5px solid var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Tick size={26} />
              </div>
              <h2 className="t-h3">Check your inbox.</h2>
              <p className="t-body t-muted" style={{ marginTop: 10 }}>
                We sent a sign-in link to <strong style={{ color: 'var(--ink)' }}>{email}</strong>.
                It expires in 15 minutes.
              </p>
              <button className="btn btn--block" style={{ marginTop: 22 }} onClick={() => setSent(false)}>
                Use a different email
              </button>
            </div>
          ) : (
            <>
              {/* Role toggle */}
              <div
                role="tablist"
                aria-label="I am a"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  padding: 5,
                  background: 'rgba(7,11,22,0.04)',
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

              <div className="field" style={{ marginTop: 18 }}>
                <label htmlFor="email">Work email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
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

              <button className="btn btn--primary btn--lg btn--block" style={{ marginTop: 16 }} onClick={sendLink}>
                Send magic link
              </button>

              <p className="t-fine" style={{ marginTop: 18, textAlign: 'center' }}>
                or{' '}
                <button className="link-accent" onClick={startDemo}>
                  continue with a demo account
                </button>
              </p>
            </>
          )}
        </div>

        <p className="t-fine" style={{ marginTop: 22 }}>
          New here?{' '}
          <button className="link-accent" onClick={() => router.push('/')}>
            Get started
          </button>
        </p>
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
