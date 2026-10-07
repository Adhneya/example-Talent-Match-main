'use client';

import { useRouter } from 'next/navigation';
import { useForm } from '@/context/FormContext';
import { Tick } from '@/components/Icons';

const CO_POINTS = [
  'See candidates build before you commit',
  'Cut weeks of screening down to one trial',
  'Meet PMs who chose you back',
];

const HOW = [
  { n: '01', t: 'Post a role', d: 'Describe the work and set a paid trial scope — a real first task, not a puzzle.' },
  { n: '02', t: 'Match', d: 'Interested PMs swipe on you. Match with the ones you want to meet.' },
  { n: '03', t: 'Run the trial', d: 'Watch them work on something that matters, then make the offer with confidence.' },
];

export default function ForCompaniesPage() {
  const router = useRouter();
  const { update } = useForm();

  function startHiring() {
    update({ role: 'hiring', isDemo: true });
    router.push('/dashboard');
  }

  return (
    <main className="wrap">
      <section className="reveal" style={{ padding: '24px 0 100px' }}>
        <div style={{ maxWidth: 680 }}>
          <span className="eyebrow">For companies</span>
          <h1 className="t-h1" style={{ marginTop: 18 }}>
            Hire what you can&nbsp;<span className="sans" style={{ fontWeight: 500 }}>see.</span>
          </h1>
          <p className="t-lead" style={{ marginTop: 18 }}>
            Stop guessing from a résumé. Meet product managers through a short, paid trial on a real
            problem — and hire the ones who prove it by doing it.
          </p>
          <div className="btn-row" style={{ maxWidth: 420, marginTop: 30 }}>
            <button className="btn btn--primary btn--lg" onClick={startHiring}>
              Start hiring
            </button>
            <button className="btn btn--lg" onClick={() => router.push('/how-it-works')}>
              How it works
            </button>
          </div>
        </div>

        {/* Value */}
        <div className="card" style={{ marginTop: 64, padding: '40px 38px' }}>
          <span className="eyebrow" style={{ color: 'var(--accent-ink)' }}>
            Why teams use TalentMatch
          </span>
          <ul className="feat" style={{ marginTop: 22 }}>
            {CO_POINTS.map((p) => (
              <li key={p}>
                <Tick size={20} />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* How it works for companies */}
        <h2 className="t-h2" style={{ marginTop: 72 }}>
          From open role to confident offer.
        </h2>
        <div className="steps" style={{ marginTop: 36, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {HOW.map((s) => (
            <div className="step" key={s.n}>
              <span className="step__num serif">{s.n}</span>
              <h3 className="serif">{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 72, padding: '40px 36px', textAlign: 'center' }}>
          <h2 className="t-h2">Meet PMs through real work.</h2>
          <p className="t-lead" style={{ marginTop: 14, marginInline: 'auto', maxWidth: '46ch' }}>
            Set up your first role and start reviewing interested candidates today.
          </p>
          <button className="btn btn--primary btn--lg" style={{ marginTop: 26 }} onClick={startHiring}>
            Open the company dashboard
          </button>
        </div>
      </section>
    </main>
  );
}
