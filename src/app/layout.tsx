import type { Metadata, Viewport } from 'next';
import { Inter, Newsreader } from 'next/font/google';
import './globals.css';
import { FormProvider } from '@/context/FormContext';
import Header from '@/components/Header';
import ResetDemo from '@/components/ResetDemo';

/**
 * Fonts.
 * The brand faces are "Neue Haas Unica" (sans) and "Reckless GISI" (serif),
 * both licensed and not on Google Fonts. We request them FIRST in the stack
 * (see globals.css) and self-host close fallbacks here so the app renders
 * faithfully today and upgrades automatically once the real .woff2 files are
 * dropped into /public/fonts (uncomment the @font-face block in globals.css):
 *   • Inter      → stand-in for Neue Haas Unica (the same face OPTVSN ships)
 *   • Newsreader → stand-in for Reckless GISI
 */
const sans = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

const serif = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '700'], // 700 = real bold serif for the hero accent
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-newsreader',
});

export const metadata: Metadata = {
  title: 'TalentMatch — Get hired through real work',
  description:
    'Swipe on companies. Match. Do a paid trial. Get the job — no résumés.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <FormProvider>
          <Header />
          <ResetDemo />
          {children}
        </FormProvider>
      </body>
    </html>
  );
}
