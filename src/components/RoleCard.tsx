import type { ReactNode } from 'react';
import { ExternalLink, MapPin } from '@/components/Icons';
import { formatPay, postedLabel } from '@/lib/format';
import type { Role } from '@/lib/types';

/**
 * The role card — one face shared by the deck, the detail sheet, match detail
 * and the landing-page demo, so what the homepage promises is what the app
 * shows. Pay leads (decision 4: pay is the hook), directly under the company
 * header; the rest of the card is title, one line, and scannable signals.
 * Overflow goes to the detail sheet.
 */

/** Per-company monogram tone — palette colours only (on the navy header), stable per name. */
const TONES = ['highlight', 'lilac', 'lilac-pale', 'white'] as const;
export function companyTone(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

export function companyInitials(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

export function CompanyMark({ name, size = 'md' }: { name: string; size?: 'md' | 'sm' }) {
  return (
    <span className={`cmark cmark--${size}`} data-tone={companyTone(name)} aria-hidden="true">
      {companyInitials(name)}
    </span>
  );
}

type CardRole = Pick<Role, 'company' | 'title' | 'summary' | 'pay' | 'postedDaysAgo'>;

export function CompanyHeader({ role }: { role: CardRole }) {
  return (
    <div className="rolecard__head">
      <CompanyMark name={role.company.name} />
      <div style={{ minWidth: 0 }}>
        <div className="rolecard__company">{role.company.name}</div>
        <div className="rolecard__meta">{role.company.sector}</div>
      </div>
    </div>
  );
}

/** Pay is the first thing read after the company — a large numeral, not a footnote (slide 5). */
export function PayRangePanel({ role }: { role: CardRole }) {
  if (!role.pay) {
    // Decision 4: roles without pay are filtered out of the deck, so this only shows
    // for a direct link to such a role. Defensive fallback, not a designed state.
    return (
      <div className="pay pay--missing">
        <div className="pay__label">Pay range</div>
        <div className="pay__value">Not published by the employer</div>
      </div>
    );
  }
  return (
    <div className="pay">
      <div className="pay__label">Pay range · per year</div>
      <div className="pay__value">{formatPay(role.pay)}</div>
    </div>
  );
}

/** Three scannable signals that used to be one cramped meta line. */
export function RoleSignals({ role }: { role: CardRole }) {
  const remote = /remote/i.test(role.company.location);
  return (
    <ul className="signals" aria-label="At a glance">
      <li className={`signal${remote ? ' signal--accent' : ''}`}>
        <MapPin size={14} />
        {role.company.location}
      </li>
      <li className="signal">{role.company.stage}</li>
      <li className="signal">{postedLabel(role.postedDaysAgo)}</li>
    </ul>
  );
}

/**
 * The card's content regions. `footer` is the deck's source + More details row;
 * the static and demo cards leave it out.
 */
export function RoleCardFace({ role, footer, as: Title = 'h2' }: { role: CardRole; footer?: ReactNode; as?: 'h2' | 'h3' | 'div' }) {
  return (
    <>
      <CompanyHeader role={role} />
      <PayRangePanel role={role} />
      <div className="rolecard__body">
        <Title className="rolecard__title">{role.title}</Title>
        <p className="rolecard__summary">{role.summary}</p>
        <RoleSignals role={role} />
        {footer && <div className="rolecard__foot">{footer}</div>}
      </div>
    </>
  );
}

/** Visible source attribution on aggregated roles (slide 8 compliance). */
export function SourceBadge({ role }: { role: Role }) {
  if (role.source.kind !== 'aggregated') return null;
  return (
    <span className="source-badge">
      <span className="source-badge__dot" aria-hidden="true" />
      via {role.source.name}
    </span>
  );
}

/** Aggregated roles only: apply goes to the source rather than pretending to host it (slide 8). */
export function ApplyOutButton({
  role,
  onApply,
  className = 'btn btn--primary btn--lg btn--block',
}: {
  role: Role;
  onApply?: () => void;
  className?: string;
}) {
  if (role.source.kind !== 'aggregated') return null;
  return (
    <a className={className} href={role.source.applyUrl} target="_blank" rel="noopener noreferrer" onClick={onApply}>
      Apply on {role.source.name} <ExternalLink size={16} />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** Non-interactive card used inside the detail sheet and match detail. */
export function RoleCardStatic({ role }: { role: Role }) {
  return (
    <div className="rolecard rolecard--static">
      <RoleCardFace role={role} />
    </div>
  );
}
