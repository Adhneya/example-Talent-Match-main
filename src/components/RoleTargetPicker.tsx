'use client';

import { TARGET_ROLES } from '@/lib/fixtures/roles';

export function suggestTarget(roleTitle: string): string | null {
  const t = roleTitle.toLowerCase();
  if (t.includes('marketing')) return 'product-marketing';
  if (t.includes('product manager') || t.includes('product lead')) return 'product-manager';
  if (t.includes('design')) return 'product-designer';
  if (t.includes('engineer') || t.includes('developer')) return 'software-engineer';
  if (t.includes('analyst') || t.includes('data')) return 'data-analyst';
  return null;
}

/** Target role selection — tunes the deck (slide 3, step 3). */
export default function RoleTargetPicker({
  value,
  onChange,
  suggested,
}: {
  value: string | null;
  onChange: (id: string) => void;
  suggested?: string | null;
}) {
  return (
    <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend className="sr-only">Target role</legend>
      <div className="targets">
        {TARGET_ROLES.map((t) => {
          const checked = value === t.id;
          return (
            <label key={t.id} className="target" data-checked={checked}>
              <input
                type="radio"
                name="target-role"
                className="sr-only"
                value={t.id}
                checked={checked}
                onChange={() => onChange(t.id)}
              />
              <span>
                {t.label}
                {suggested === t.id && (
                  <span className="t-fine" style={{ display: 'block', fontWeight: 400, marginTop: 2 }}>
                    Suggested from your profile
                  </span>
                )}
              </span>
              <span className="target__radio" aria-hidden="true" />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
