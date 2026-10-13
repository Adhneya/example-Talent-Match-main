import type { PayRange, Salary } from './types';

// Locale is a parameter rather than a constant so UK (Phase 2) is a config change.
export const LOCALE = 'en-US';

function compact(n: number, currency = 'USD', locale = LOCALE) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPay(pay: PayRange, locale = LOCALE) {
  return `${compact(pay.min, pay.currency, locale)} – ${compact(pay.max, pay.currency, locale)}`;
}

export function formatSalary(s: Salary, locale = LOCALE) {
  return `${compact(s.min, 'USD', locale)} – ${compact(s.max, 'USD', locale)}`;
}

export function postedLabel(days: number) {
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  return `Posted ${days} days ago`;
}

export function roleMeta(r: { company: { stage: string; sector: string; location: string } }) {
  return [r.company.stage, r.company.sector, r.company.location].join(' · ');
}
