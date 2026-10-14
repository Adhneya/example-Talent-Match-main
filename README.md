# TalentMatch

Candidate-side web app for **TalentMatch**, a two-sided swipe marketplace for hiring (US-first).
Built with **Next.js (App Router) + React + TypeScript**. Every screen traces to the
developer-guidance deck through the Screen Mapping (`S-01` … `S-12`).

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Use **↻ Reset (dev)** (bottom-left, dev builds only) to start over.

## Phasing and flags

| Phase | Contents | Status |
|---|---|---|
| 0 — Candidate MVP | Welcome, 3-step onboarding, swipe deck on aggregated roles, role detail, Saved, Profile | Live |
| 1 — Two-sided match | Native roles, match celebration, `/matches`, `/matches/[matchId]` | Behind `NEXT_PUBLIC_FLAG_MATCHES=1` |
| 2 — Notifications | `/notifications` | Behind `NEXT_PUBLIC_FLAG_NOTIFICATIONS=1` (needs matches on) |

Put the flags in `.env.local` and restart `npm run dev`. With a flag off, its routes return Not Found.

## Routes

| Route | Screen | Zone |
|---|---|---|
| `/` | S-01 Welcome | A · no profile |
| `/onboarding/connect` | S-02 Connect — LinkedIn URL + resume (PDF/DOCX) | B · onboarding |
| `/onboarding/build` | S-03 Processing → S-04 blocking confirm | B |
| `/onboarding/target` | S-05 Target role (replaces into the deck) | B |
| `/swipe` | S-06 Swipe deck | C · profile live |
| `/swipe/[roleId]` | S-07 Role detail (sheet; side panel ≥1280px) | C |
| `/saved` | Saved roles — where Interested lands for aggregated roles | C |
| `/profile` | S-11 Profile view/edit + target role | C |
| `/matches`, `/matches/[matchId]` | S-09 / S-10 (Phase 1) | C |
| `/notifications` | S-12 (Phase 2) | C |

Access is decided by profile stage, not auth (the deck has no account step). That
assumption lives in one place — `src/components/ZoneGuard.tsx` — so real auth can replace it.

## Structure

```
src/
  app/                    routes (see table); (shell) is the Zone C layout
  components/
    swipe/                SwipeDeck (CardStack, UndoControl, empty state), RoleDetailSheet
    onboarding/           LinkedInUrlField, ResumeDropzone
    ProfileConfirmCard    EditableField, SkillTagGroup, StandoutHighlight, SalaryExpectationField
    RoleCard              CompanyHeader, RoleSummary, PayRangePanel, SourceBadge, ApplyOutButton
    ZoneGuard, Header (+ BottomNav), MatchCelebrationModal, EngagementStatus, Notice
  store/AppStore.tsx      state domains: draft, profile, append-only swipe ledger, matches
  lib/
    types.ts              data contracts (role source discriminator, swipe records, …)
    api.ts                mock service layer (latency, failure injection, rules-based ranking)
    flags.ts, format.ts, fixtures/roles.ts
```

## Behaviour worth knowing

- **Swipes are append-only.** Decisions advance the deck optimistically; a rejected swipe
  returns the card to the top with a non-blocking notice. Undo (last swipe only, also ⌘/Ctrl+Z)
  appends a compensating record rather than deleting.
- **Aggregated roles are one-sided apply.** Interested saves the role to `/saved`; applying
  always opens the source's own posting in a new tab.
- **Roles without a published pay band never enter the deck** (decision 4). All product
  decisions are logged in [`docs/DECISIONS.md`](docs/DECISIONS.md).
- **Responsive behaviour** follows [`docs/BREAKPOINTS.md`](docs/BREAKPOINTS.md)
  (xs 400 · sm 640 · md 768 · lg 1080 · xl 1280), enforced by `e2e/responsive.spec.ts`.

### Testing error states

In DevTools:

```js
localStorage.setItem('talentmatch.debug', 'swipe-fail')  // server rejects swipes
localStorage.setItem('talentmatch.debug', 'parse-fail')  // profile engine fails
localStorage.removeItem('talentmatch.debug')
```

A resume whose filename contains `unreadable` also fails to parse.

- **Landing page** (`src/app/_landing/`) has an interactive swipe preview and a generative
  growing-tree canvas background (native Canvas 2D; pauses in hidden tabs, still image with
  reduced motion). The employer "register interest" form stores entries in the browser only —
  wire it to a waitlist endpoint before launch.

## Analytics

- **Page views:** Vercel Web Analytics (`<Analytics />` in the root layout; cookieless). Enable
  *Analytics* for the project in the Vercel dashboard.
- **Product events:** one typed catalogue in `src/lib/analytics.ts` — landing CTAs, the onboarding
  funnel (including real time-to-complete against the 2-minute budget), card impressions, swipes
  with their method (button / gesture / keyboard / detail), undo, failures, detail opens,
  apply-outs, saves and matches. Sent as Vercel custom events (custom events need a Vercel
  Pro or Enterprise plan; on Hobby only page views are recorded).
- **Privacy:** events carry ids, enums, counts and durations only — never emails, LinkedIn URLs
  or file names. An e2e test enforces this.
- **Debugging:** build with `NEXT_PUBLIC_ANALYTICS_DEBUG=1` to log events to the console and
  collect them on `window.__TM_EVENTS__`.

## Design tokens

The deck's design language (Frontend Analysis Report §4): navy `#2F3C7E`, coral `#F96167`
(pressed `#E24A50`), ink `#1B2140`, muted `#5B6178`, neutral `#9AA0B5`/`#AAB0C6`, tint `#F2F3F9`,
border `#DDE0EC`, lilac on navy `#8891C9`/`#AEB6E4`/`#CFD6F5`, highlight `#F9E795`. Defined in
`src/app/globals.css` (`:root`) and mirrored in `tailwind.config.ts`.

Contrast rules: white on coral is 3:1, so coral carries only large bold labels (Interested) and
icons; primary buttons are navy with white text (10:1). Eyebrows on white stay navy. Form-field
borders use a derived `#858BA3` (3:1), since neutral `#9AA0B5` is too faint for a control edge.

Type: **Cambria** (display) + **Calibri** (body), requested by name first; **Caladea** and
**Carlito** — their metric-compatible open equivalents — are self-hosted via `next/font` for
devices without Office fonts. Noto Sans Devanagari covers Devanagari script.
