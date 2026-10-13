import { notFound } from 'next/navigation';
import { FLAGS } from '@/lib/flags';

/** Phase 1 — two-sided match. Routed, but dark until the flag is on. */
export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  if (!FLAGS.matches) notFound();
  return <>{children}</>;
}
