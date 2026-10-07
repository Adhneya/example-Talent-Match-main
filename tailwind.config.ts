import type { Config } from 'tailwindcss';

/**
 * Design tokens defined LOCALLY for TalentMatch — the single source of
 * truth lives in src/app/globals.css (:root). These map the same values
 * onto Tailwind utilities so the two never diverge.
 *
 * Palette: OPTVSN (deep blue on white).
 * Type:    Reckless GISI (display) + Neue Haas Unica (UI), with
 *          self-hosted fallbacks (Newsreader / Inter).
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FFFFFF',
        surface: '#FAFAFA',
        ink: '#070B16',
        muted: '#64748B',
        faint: '#94A3B8',
        accent: { DEFAULT: '#217DAB', ink: '#002E47' },
        amber: { ink: '#854D0E' },
        danger: '#DC2626',
      },
      fontFamily: {
        serif: ['"Reckless GISI"', 'var(--font-newsreader)', 'Georgia', 'serif'],
        sans: ['"Neue Haas Unica"', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(3rem, 8vw, 5.75rem)', { lineHeight: '1', letterSpacing: '-0.003em' }],
        h1: ['clamp(2.5rem, 6vw, 4rem)', { lineHeight: '1.08', letterSpacing: '-0.002em' }],
        h2: ['clamp(2rem, 4.5vw, 3rem)', { lineHeight: '1.08', letterSpacing: '-0.01em' }],
        h3: ['clamp(1.5rem, 3vw, 2rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        h4: ['1.5rem', { lineHeight: '1.12' }],
        lead: ['1.3125rem', { lineHeight: '1.22', letterSpacing: '0.25px' }],
        fine: ['0.875rem', { lineHeight: '1.4' }],
      },
      borderColor: {
        hairline: '#E2E8F0',
      },
      borderRadius: {
        btn: '8px',
        card: '14px',
      },
      maxWidth: {
        col: '560px',
        wrap: '1180px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 12px 28px -22px rgba(16,24,40,0.26)',
      },
    },
  },
  plugins: [],
};

export default config;
