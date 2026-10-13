/**
 * Release config (slide 9).
 *   Phase 0 — candidate MVP: always live.
 *   Phase 1 — two-sided match: routes exist, flagged off.
 *   Phase 2 — notifications: route exists, flagged off.
 *
 * Inlined at build time. Enable locally with e.g.
 *   NEXT_PUBLIC_FLAG_MATCHES=1 NEXT_PUBLIC_FLAG_NOTIFICATIONS=1 npm run dev
 */
export const FLAGS = {
  matches: process.env.NEXT_PUBLIC_FLAG_MATCHES === '1',
  notifications:
    process.env.NEXT_PUBLIC_FLAG_MATCHES === '1' && process.env.NEXT_PUBLIC_FLAG_NOTIFICATIONS === '1',
} as const;
