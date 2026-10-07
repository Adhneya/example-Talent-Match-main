'use client';

import { useRouter } from 'next/navigation';

const STEPS = [
  { n: '01', t: 'Swipe', d: 'Browse companies hiring PMs. Swipe right on the ones you’d love to build with.' },
  { n: '02', t: 'Match', d: 'When the interest is mutual, you match — and a real conversation opens up.' },
  { n: '03', t: 'Paid trial', d: 'Skip the whiteboard. Do a short, paid trial on a real problem with the team.' },
  { n: '04', t: 'Get the job', d: 'Loved the work on both sides? Turn the trial into a full-time offer.' },
];

export default function HowItWorksPage() {
  const router = useRouter();
  return (
    <main className="wrap">
      <section className="reveal" style={{ padding: '24px 0 100px' }}>
        <div style={{ maxWidth: 680 }}>
          <span className="eyebrow">How it works</span>
          <h1 className="t-h1" style={{ marginTop: 18 }}>
            Four quiet steps from swipe to signed.
          </h1>
          <p className="t-lead" style={{ marginTop: 18 }}>
            No résumés, no cover letters, no take-home gauntlet. Just real work, paid from day one,
            with teams that already want to meet you.
          </p>
        </div>

        <div className="steps" style={{ marginTop: 64 }}>
          {STEPS.map((s) => (
            <div className="step" key={s.n}>
              <span className="step__num serif">{s.n}</span>
              <h3 className="serif">{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 72, padding: '40px 36px', textAlign: 'center' }}>
          <h2 className="t-h2">Your next role starts with a swipe.</h2>
          <p className="t-lead" style={{ marginTop: 14, marginInline: 'auto', maxWidth: '46ch' }}>
            Start as a PM, or set up your first role as a company.
          </p>
          <div
            className="btn-row"
            style={{ maxWidth: 420, margin: '28px auto 0' }}
          >
            <button className="btn btn--primary btn--lg" onClick={() => router.push('/')}>
              Get started
            </button>
            <button className="btn btn--lg" onClick={() => router.push('/for-companies')}>
              For companies
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
