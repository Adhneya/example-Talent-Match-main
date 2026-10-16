import { Inter, Newsreader } from 'next/font/google';

/**
 * Landing-page-only typefaces (decided 2026-10-16: an exception to the
 * Cambria/Calibri mandate, which still governs the app). Both are variable, so
 * the hero heading can animate its real weight axis instead of swapping cuts.
 *
 *   Inter      — headings, wght 100–900 (the scroll-linked weight lives here)
 *   Newsreader — body and italic accents, wght 200–800, optical sizes
 *
 * Applied as CSS variables on the landing root only (see _landing/page.tsx),
 * so no other route preloads or inherits them.
 */
export const landingSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-l-sans',
});

export const landingSerif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-l-serif',
});
