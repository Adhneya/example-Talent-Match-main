import type { Metadata, Viewport } from 'next';
import { Caladea, Carlito, Noto_Sans_Devanagari } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SessionProvider } from 'next-auth/react';
import './globals.css';
import { AppStoreProvider } from '@/store/AppStore';
import ZoneGuard from '@/components/ZoneGuard';
import Notice from '@/components/Notice';
import ResetDemo from '@/components/ResetDemo';

/**
 * Deck type system: Cambria (display) + Calibri (body). Those are Microsoft
 * fonts, requested by name first in globals.css; Caladea and Carlito are their
 * metric-compatible open equivalents, self-hosted here for everyone else.
 */
const serif = Caladea({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-caladea',
});

const sans = Carlito({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-carlito',
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-devanagari',
});

export const metadata: Metadata = {
  title: 'TalentMatch — Swipe on roles. Match when it’s mutual.',
  description:
    'Sign in with LinkedIn, add your resume, get an optimized profile. Swipe on live roles with the pay shown up front.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2F3C7E',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${devanagari.variable}`}>
      <body>
        {/* Session is fetched client-side, so pages stay static and Welcome stays server-rendered. */}
        <SessionProvider>
          <AppStoreProvider>
            <ZoneGuard>{children}</ZoneGuard>
            <Notice />
            <ResetDemo />
          </AppStoreProvider>
        </SessionProvider>
        {/* Page views (cookieless). Custom product events go through src/lib/analytics.ts. */}
        <Analytics />
      </body>
    </html>
  );
}
