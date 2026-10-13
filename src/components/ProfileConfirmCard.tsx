'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Cross, Pencil, Star } from '@/components/Icons';
import { formatSalary } from '@/lib/format';
import type { Profile, Salary } from '@/lib/types';

/**
 * The generated candidate card (slide 4): role title, experience summary,
 * skill tags, starred standout achievement, salary expectation. Every region
 * is editable in place — "confirm or tweak" (slide 3). Shared by the blocking
 * confirm step (S-04) and the profile page (S-11).
 */
export default function ProfileConfirmCard({
  value,
  onChange,
}: {
  value: Profile;
  onChange: (p: Profile) => void;
}) {
  const set = <K extends keyof Profile>(key: K, v: Profile[K]) => onChange({ ...value, [key]: v });

  return (
    <article className="card pcard" aria-label="Your profile">
      <div className="pcard__head">
        <span className="eyebrow">Your profile</span>
        <div style={{ marginTop: 10 }}>
          <EditableField
            label="Role title"
            value={value.roleTitle}
            onCommit={(v) => set('roleTitle', v)}
            render={(v) => (
              <h2 className="t-h2" style={{ color: '#fff' }}>
                {v}
              </h2>
            )}
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <EditableField
            label="Experience summary"
            multiline
            value={value.summary}
            onCommit={(v) => set('summary', v)}
            render={(v) => <p style={{ color: 'var(--lilac-3)', lineHeight: 1.5 }}>{v}</p>}
          />
        </div>
      </div>

      <div className="pcard__body">
        <section className="pcard__section">
          <h3 className="t-label" style={{ fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
            Skills
          </h3>
          <SkillTagGroup skills={value.skills} onChange={(s) => set('skills', s)} />
        </section>

        <section className="pcard__section">
          <h3 className="t-label" style={{ fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
            Standout achievement
          </h3>
          <StandoutHighlight value={value.standout} onChange={(v) => set('standout', v)} />
        </section>

        <section className="pcard__section">
          <h3 className="t-label" style={{ fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
            Salary expectation
          </h3>
          <SalaryExpectationField value={value.salary} onChange={(v) => set('salary', v)} />
        </section>
      </div>
    </article>
  );
}

/* ── EditableField ─────────────────────────────────────────────── */

export function EditableField({
  label,
  value,
  onCommit,
  render,
  multiline = false,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
  render: (v: string) => ReactNode;
  multiline?: boolean;
}) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const editBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  function commit() {
    const v = text.trim();
    if (v) onCommit(v);
    else setText(value);
    setEditing(false);
    requestAnimationFrame(() => editBtn.current?.focus());
  }
  function cancel() {
    setText(value);
    setEditing(false);
    requestAnimationFrame(() => editBtn.current?.focus());
  }

  if (editing) {
    const common = {
      id,
      ref,
      className: 'input',
      value: text,
      'aria-label': label,
      onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setText(e.target.value),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') cancel();
        if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          commit();
        }
      },
    };
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        {multiline ? <textarea rows={3} {...common} /> : <input type="text" {...common} />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn" onClick={commit}>
            Done
          </button>
          <button type="button" className="btn btn--ghost" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="efield">
      <div className="efield__value">{render(value)}</div>
      <button
        ref={editBtn}
        type="button"
        className="efield__edit"
        aria-label={`Edit ${label.toLowerCase()}`}
        onClick={() => {
          setText(value);
          setEditing(true);
        }}
      >
        <Pencil size={14} /> Edit
      </button>
    </div>
  );
}

/* ── SkillTagGroup ─────────────────────────────────────────────── */

const MAX_SKILLS = 12;

export function SkillTagGroup({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');

  function add() {
    const v = text.trim();
    if (v && !skills.some((s) => s.toLowerCase() === v.toLowerCase()) && skills.length < MAX_SKILLS) {
      onChange([...skills, v]);
    }
    setText('');
    setAdding(false);
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {skills.map((s) => (
        <span key={s} className="tag">
          {s}
          {skills.length > 1 && (
            <button
              type="button"
              className="tag__x"
              aria-label={`Remove ${s}`}
              onClick={() => onChange(skills.filter((x) => x !== s))}
            >
              <Cross size={14} />
            </button>
          )}
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          className="input"
          style={{ width: 180, padding: '0.45em 0.8em' }}
          aria-label="New skill"
          placeholder="Add a skill"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={add}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
            if (e.key === 'Escape') {
              setText('');
              setAdding(false);
            }
          }}
        />
      ) : (
        skills.length < MAX_SKILLS && (
          <button type="button" className="efield__edit" onClick={() => setAdding(true)}>
            + Add skill
          </button>
        )
      )}
    </div>
  );
}

/* ── StandoutHighlight ─────────────────────────────────────────── */

export function StandoutHighlight({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="standout">
      <Star size={18} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <EditableField
          label="Standout achievement"
          multiline
          value={value}
          onCommit={onChange}
          render={(v) => <p style={{ fontWeight: 500, lineHeight: 1.5 }}>{v}</p>}
        />
      </div>
    </div>
  );
}

/* ── SalaryExpectationField ───────────────────────────────────── */

export function SalaryExpectationField({ value, onChange }: { value: Salary; onChange: (v: Salary) => void }) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [min, setMin] = useState(String(value.min));
  const [max, setMax] = useState(String(value.max));

  const lo = Number(min);
  const hi = Number(max);
  const valid = lo > 0 && hi > 0 && lo <= hi;

  if (!editing) {
    return (
      <div className="efield">
        <p className="efield__value" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy)' }}>
          {formatSalary(value)} <span className="t-fine" style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}>per year</span>
        </p>
        <button
          type="button"
          className="efield__edit"
          aria-label="Edit salary expectation"
          onClick={() => {
            setMin(String(value.min));
            setMax(String(value.max));
            setEditing(true);
          }}
        >
          <Pencil size={14} /> Edit
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="field">
          <label htmlFor={`${id}-min`}>Minimum (USD / year)</label>
          <input id={`${id}-min`} className="input" type="number" inputMode="numeric" step={5000} min={0} value={min} onChange={(e) => setMin(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor={`${id}-max`}>Maximum (USD / year)</label>
          <input id={`${id}-max`} className="input" type="number" inputMode="numeric" step={5000} min={0} value={max} onChange={(e) => setMax(e.target.value)} aria-invalid={!valid} />
        </div>
      </div>
      {!valid && <span className="field__msg field__msg--error">Minimum must be lower than maximum.</span>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className="btn"
          disabled={!valid}
          onClick={() => {
            onChange({ min: lo, max: hi });
            setEditing(false);
          }}
        >
          Done
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
