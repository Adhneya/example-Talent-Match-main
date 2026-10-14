'use client';

import { ExternalLink } from '@/components/Icons';
import { formatPay, roleMeta } from '@/lib/format';
import type { Role } from '@/lib/types';

/**
 * Card regions taken directly from slide 5: navy company header, role title,
 * one-line description, tinted pay panel. Overflow goes to the detail sheet.
 */

export function CompanyHeader({ role }: { role: Role }) {
  return (
    <div className="rolecard__head">
      <div className="rolecard__company">{role.company.name}</div>
      <div className="rolecard__meta">{roleMeta(role)}</div>
    </div>
  );
}

export function RoleSummary({ role }: { role: Role }) {
  return (
    <>
      <h2 className="rolecard__title">{role.title}</h2>
      <p className="rolecard__summary">{role.summary}</p>
    </>
  );
}

/** Pay is a first-class card region, shown immediately (slide 5). */
export function PayRangePanel({ role }: { role: Role }) {
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
      <div className="pay__label">Pay range</div>
      <div className="pay__value">
        {formatPay(role.pay)} <small>per year</small>
      </div>
    </div>
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
      <CompanyHeader role={role} />
      <div className="rolecard__body">
        <RoleSummary role={role} />
      </div>
      <PayRangePanel role={role} />
    </div>
  );
}
