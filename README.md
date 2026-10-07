# TalentMatch

A self-contained, multi-page form frontend for **TalentMatch** — "Get hired as a PM
through real work, not résumés." Built with **Next.js (App Router) + React + TypeScript**
and styled with **Tailwind CSS**.

The project is fully isolated: it has its own `package.json`, `next.config`, `tsconfig`
and `node_modules`, and makes **no imports or asset references outside this folder**.
Fonts are self-hosted at build time via `next/font`, and the design tokens from the
OPTVSN / TalentMatch prototype are **redefined locally** in `tailwind.config.ts` and
`src/app/globals.css`.

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

```bash
npm run build && npm start   # production build
```

## The multi-page flow

State is shared across routes via a React context (`src/context/FormContext.tsx`) and
persisted to `localStorage`, so data survives navigation and page refreshes.

| # | Route       | Page                                                            |
|---|-------------|-----------------------------------------------------------------|
| 1 | `/`         | Landing / auth — role toggle (PM / hiring), email, demo start    |
| 2 | `/profile`  | Profile form — name, one-liner, pick top 3 skills (progress bar) |
| 3 | `/discover` | Swipe deck — discover companies, like/pass, Swipe / Matches nav  |

`Get Started` (valid email) or `Start Demo (No Email)` → **/profile**.
`Start Swiping` (name + ≥1 skill) → **/discover**.

## Structure

```
src/
  app/
    layout.tsx          # fonts, FormProvider, Header, Reset Demo
    globals.css         # local design tokens + component styles
    page.tsx            # 1 · landing / auth
    profile/page.tsx    # 2 · profile form
    discover/page.tsx   # 3 · swipe deck
  components/
    Header.tsx          # converted VERBATIM from the HTML prototype
    ResetDemo.tsx
    Icons.tsx
  context/FormContext.tsx
  lib/companies.ts      # sample swipe data
```

## Design notes

- **Header** is a faithful JSX conversion of the provided HTML prototype — markup,
  class names and structure unchanged.
- **Palette / type** (warm ivory `#F6F2EA`, charcoal `#1A1A1A`, dusty-blue accent
  `#3581B8`, Instrument Serif + Hanken Grotesk) are taken from the prototype and
  redefined locally. Form fields use the screenshot layouts rendered in this language.
