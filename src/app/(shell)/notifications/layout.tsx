import { notFound } from 'next/navigation';
import { FLAGS } from '@/lib/flags';

/** Phase 2 — notifications. Routed, but dark until the flag is on. */
export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  if (!FLAGS.notifications) notFound();
  return <>{children}</>;
}
