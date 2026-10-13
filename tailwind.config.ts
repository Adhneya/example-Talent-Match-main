import type { Config } from 'tailwindcss';

/**
 * Design tokens for TalentMatch — the single source of truth lives in
 * src/app/globals.css (:root). These map the same values onto Tailwind
 * utilities so the two never diverge.
 *
 * Palette: warm — Dominant #FB924D · Surface #FBC59D · Ink #813502
 *          · Accent #7C7C74 · Detail #C6B2A6.
 * Type:    Playfair Display (display) + Inter (UI) + Noto Sans Devanagari.
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        dominant: { DEFAULT: '#FB924D', soft: '#FCA46A' },
        surface: '#FBC59D',
        ink: '#813502',
        accent: '#7C7C74',
        detail: '#C6B2A6',
        muted: '#66665F',
        tint: '#FDE6D4',
        bg: '#FFFAF6',
        danger: '#C62828',
        success: '#1F7A4D',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
        serif: ['var(--font-playfair)', 'ui-serif', 'Georgia'],
        devanagari: ['var(--font-devanagari)', 'var(--font-inter)', 'ui-sans-serif'],
      },
      borderRadius: {
        btn: '999px',
        card: '18px',
      },
      maxWidth: {
        col: '560px',
        wrap: '1180px',
        card: '400px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(97,40,2,0.05), 0 24px 48px -28px rgba(97,40,2,0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
