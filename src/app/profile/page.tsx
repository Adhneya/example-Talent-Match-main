'use client';

import { useRouter } from 'next/navigation';
import { useForm } from '@/context/FormContext';
import { Sliders } from '@/components/Icons';

const SKILLS = [
  'User Research',
  'Data Analysis',
  'Roadmapping',
  'SQL',
  'Figma',
  'A/B Testing',
  'Agile/Scrum',
  'Strategy',
  'Stakeholder Management',
  'Technical',
];

// Real PM funnel — this is genuinely step 2 of 3.
const STEP = 2;
const TOTAL = 3;

export default function ProfilePage() {
  const router = useRouter();
  const { name, oneLiner, skills, update, toggleSkill } = useForm();

  const canContinue = name.trim().length > 0 && skills.length > 0;
  const pct = Math.round((STEP / TOTAL) * 100);

  return (
    <main className="wrap">
      <section className="col reveal" style={{ padding: '24px 0 100px' }}>
        {/* Progress — honest about position in the funnel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="t-label">
            Step {STEP} of {TOTAL} · Your profile
          </span>
          <span className="t-label">{pct}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 4, background: 'rgba(26,26,26,0.08)', overflow: 'hidden' }}>
          <div
            style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', transition: 'width 300ms ease' }}
          />
        </div>

        {/* Name */}
        <div className="field" style={{ marginTop: 40 }}>
          <label htmlFor="name" className="t-h3" style={{ display: 'block', marginBottom: 14, color: 'var(--ink)' }}>
            What&apos;s your name?
          </label>
          <input id="name" type="text" placeholder="Alex Johnson" value={name} onChange={(e) => update({ name: e.target.value })} autoFocus />
        </div>

        {/* One-liner */}
        <div className="field" style={{ marginTop: 32 }}>
          <label htmlFor="oneliner" className="t-h3" style={{ display: 'block', marginBottom: 14, color: 'var(--ink)' }}>
            Describe yourself in one line
          </label>
          <input
            id="oneliner"
            type="text"
            placeholder="Ex-consultant ready to build products"
            value={oneLiner}
            onChange={(e) => update({ oneLiner: e.target.value })}
          />
        </div>

        {/* Skills */}
        <div style={{ marginTop: 40 }}>
          <h3 className="t-h3" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sliders size={26} style={{ color: 'var(--accent-ink)' }} />
            Pick up to 3 skills
          </h3>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {SKILLS.map((skill) => {
              const selected = skills.includes(skill);
              const disabled = !selected && skills.length >= 3;
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill, 3)}
                  aria-pressed={selected}
                  disabled={disabled}
                  style={{
                    padding: '0.95em 1em',
                    borderRadius: 12,
                    fontWeight: 500,
                    fontSize: '0.98rem',
                    textAlign: 'center',
                    background: selected ? 'var(--accent-tint)' : 'var(--surface)',
                    color: selected ? 'var(--accent-ink)' : 'var(--ink)',
                    border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--hairline)'}`,
                    opacity: disabled ? 0.45 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 160ms ease',
                  }}
                >
                  {skill}
                </button>
              );
            })}
          </div>
          <p className="t-label" style={{ marginTop: 14 }}>
            {skills.length} of 3 selected
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, marginTop: 30 }}>
          <button className="btn btn--neutral btn--lg" onClick={() => router.push('/')}>
            Back
          </button>
          <button className="btn btn--primary btn--lg btn--block" disabled={!canContinue} onClick={() => router.push('/discover')}>
            Start Swiping
          </button>
        </div>
      </section>
    </main>
  );
}
