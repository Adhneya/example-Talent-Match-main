import type { Config } from 'tailwindcss';

/**
 * Design tokens for TalentMatch — the single source of truth lives in
 * src/app/globals.css (:root). These map the same values onto Tailwind
 * utilities so the two never diverge.
 *
 * Design language: the developer-guidance deck (Frontend Analysis Report §4).
 * Type: Cambria (display) + Calibri (body), with Caladea / Carlito as their
 * metric-compatible open fallbacks, plus Noto Sans Devanagari.
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#2F3C7E', deep: '#252F66' },
        coral: { DEFAULT: '#F96167', pressed: '#E24A50' },
        ink: '#1B2140',
        muted: '#5B6178',
        neutral: { DEFAULT: '#9AA0B5', 2: '#AAB0C6' },
        control: '#858BA3',
        tint: '#F2F3F9',
        border: '#DDE0EC',
        lilac: { DEFAULT: '#8891C9', 2: '#AEB6E4', 3: '#CFD6F5' },
        highlight: '#F9E795',
        danger: '#C62828',
        success: '#1F7A4D',
      },
      fontFamily: {
        serif: ['Cambria', 'var(--font-caladea)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Calibri', 'var(--font-carlito)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        devanagari: ['var(--font-devanagari)', 'Calibri', 'var(--font-carlito)', 'sans-serif'],
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
        card: '0 1px 2px rgba(27,33,64,0.05), 0 18px 40px -26px rgba(27,33,64,0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
