'use client';

import { usePathname, useRouter } from 'next/navigation';

/**
 * Header — structure converted VERBATIM from the provided HTML prototype.
 * Context-aware: the marketing nav shows on the marketing routes; inside the
 * app (profile / discover / dashboard) it collapses to the wordmark + a label
 * so the chrome matches where the user actually is.
 */
const MARKETING_ROUTES = ['/', '/how-it-works', '/for-companies', '/signin'];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isMarketing = MARKETING_ROUTES.includes(pathname);

  const links = [
    { label: 'How it works', href: '/how-it-works' },
    { label: 'For companies', href: '/for-companies' },
  ];

  return (
    <header className="hdr">
      <div className="wrap hdr__inner">
        <a
          href="/"
          className="hdr__mark serif"
          onClick={(e) => {
            e.preventDefault();
            router.push('/');
          }}
        >
          TalentMatch
        </a>
        {isMarketing ? (
          <nav className="hdr__nav">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="hdr__link"
                onClick={(e) => {
                  e.preventDefault();
                  router.push(l.href);
                }}
              >
                {l.label}
              </a>
            ))}
            <a
              href="/signin"
              className="btn btn--ghost"
              onClick={(e) => {
                e.preventDefault();
                router.push('/signin');
              }}
            >
              Sign in
            </a>
            <button className="btn" onClick={() => router.push('/')}>
              Get started
            </button>
          </nav>
        ) : (
          <nav className="hdr__nav">
            <span className="t-fine" style={{ letterSpacing: '0.04em' }}>
              {pathname.startsWith('/dashboard') ? 'Hiring' : 'Candidate'}
            </span>
          </nav>
        )}
      </div>
    </header>
  );
}
