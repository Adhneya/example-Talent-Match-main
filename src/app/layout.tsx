import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Devanagari, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AppStoreProvider } from '@/store/AppStore';
import ZoneGuard from '@/components/ZoneGuard';
import Notice from '@/components/Notice';
import ResetDemo from '@/components/ResetDemo';

const sans = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

const serif = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-playfair',
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
    'LinkedIn and resume in, an optimized profile out. Swipe on live roles with the pay shown up front.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#813502',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${devanagari.variable}`}>
      <body>
        <AppStoreProvider>
          <ZoneGuard>{children}</ZoneGuard>
          <Notice />
          <ResetDemo />
        </AppStoreProvider>
      </body>
    </html>
  );
}
