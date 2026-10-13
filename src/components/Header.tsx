'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FLAGS } from '@/lib/flags';
import { useStore } from '@/store/AppStore';
import { Bell, Bookmark, Cards, Heart, UserIcon } from '@/components/Icons';
import { useNotifications } from '@/hooks/useNotifications';

/** Primary navigation (Swipe · Saved · Matches · Profile). Matches is Phase 1, flagged. */
function useNavItems() {
  const { savedRoles, matches } = useStore();
  return [
    { href: '/swipe', label: 'Swipe', icon: <Cards size={20} /> },
    { href: '/saved', label: 'Saved', icon: <Bookmark size={20} />, badge: savedRoles.length },
    ...(FLAGS.matches
      ? [{ href: '/matches', label: 'Matches', icon: <Heart size={20} />, badge: matches.length }]
      : []),
    { href: '/profile', label: 'Profile', icon: <UserIcon size={20} /> },
  ];
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header({ shell = false }: { shell?: boolean }) {
  const pathname = usePathname();
  const items = useNavItems();
  const { unread } = useNotifications();

  return (
    <header className={`hdr${shell ? ' hdr--shell' : ''}`}>
      <div className="wrap hdr__inner">
        <Link href={shell ? '/swipe' : '/'} className="hdr__mark" aria-label="TalentMatch home">
          TalentMatch
          <span className="hdr__mark-dot" aria-hidden="true" />
        </Link>

        {shell && (
          <div className="hdr__end">
            <nav className="tnav" aria-label="Primary">
              {items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="tnav__item"
                  aria-current={isActive(pathname, it.href) ? 'page' : undefined}
                >
                  {it.icon}
                  {it.label}
                  {it.badge ? <span className="badge">{it.badge}</span> : null}
                </Link>
              ))}
            </nav>
            {FLAGS.notifications && (
              <Link
                href="/notifications"
                className="icon-btn"
                aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
                aria-current={isActive(pathname, '/notifications') ? 'page' : undefined}
              >
                <Bell size={20} />
                {unread ? <span className="badge">{unread}</span> : null}
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

/** Bottom navigation below 768px (IA §9). */
export function BottomNav() {
  const pathname = usePathname();
  const items = useNavItems();
  return (
    <nav className="bnav" aria-label="Primary">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="bnav__item"
          aria-current={isActive(pathname, it.href) ? 'page' : undefined}
        >
          {it.icon}
          {it.label}
          {it.badge ? <span className="badge">{it.badge}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
