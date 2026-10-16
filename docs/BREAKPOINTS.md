# Breakpoint specification

The "full breakpoint specification" that Information Architecture §9 defers to a separate
deliverable. It documents what ships, and every row below is asserted by
`e2e/responsive.spec.ts` — if the CSS drifts from this document, the tests fail.

## Scale

| Token | Width | Origin | Meaning |
|---|---|---|---|
| `xs` | 400px | Content | Small phones |
| `sm` | 640px | Content | Phones |
| `md` | **768px** | IA §9 | Phone ↔ tablet: bottom nav ↔ top nav, 16px ↔ 32px gutter |
| `lg` | 1080px | Content | Landing: the headline frames the hero card; split sections side by side |
| `xl` | **1280px** | IA §9 | Role detail becomes a side panel |

Plus one **content breakpoint**: the landing header's full navigation needs ~920px.

### Conventions

- **Below a breakpoint:** `@media (max-width: <bp − 0.02>px)` — e.g. `767.98px`.
- **From a breakpoint:** `@media (min-width: <bp>px)`.
- The `.98` matters: browsers report fractional viewport widths under page zoom and
  Windows display scaling (e.g. 767.4px). With `767px` / `768px` pairs, such a viewport
  matches *neither* rule. This was a real bug, found while writing this spec.
- CSS custom properties can't be used inside media queries, so the scale is documented in
  `src/app/globals.css` (`:root`) and here; use the literal values.
- New content breakpoints are allowed only where content genuinely needs one, and must be
  added to this document and to `e2e/responsive.spec.ts`.
- **Input capability, not width, decides gesture vs button emphasis** — see below.

## Fixed rules (all widths)

| Rule | Source | Implementation |
|---|---|---|
| The role card is the fixed point: portrait **4:5**, max **400px** wide, centred, never stretched | IA §9, slide 5 | `.deck__stack { aspect-ratio: 4 / 5; max-width: var(--card-w) }` |
| Onboarding column is width-capped at **560px**; extra space is breathing room, never a second column | IA §9, slide 3 | `.col { max-width: var(--col) }` |
| No horizontal page scroll at any width, including mid-swipe | — | `overflow-x: clip` on `html, body` |
| Primary touch targets ≥ 44px (buttons, mobile nav items, menu and footer links) | WCAG 2.5.5 (AAA target, adopted) | All targets meet WCAG 2.2's 24px minimum; the wordmark link is 38px |

## App (onboarding + shell)

| Range | Layout |
|---|---|
| **< 768** (`md`) | Single column, 16px gutter. **Bottom navigation** (Swipe · Saved · Profile, + Matches when flagged); top nav hidden; page bottom padding clears the bar and the safe-area inset. Notices sit above the bar. Dev reset button hidden. |
| **≥ 768** | 32px gutter (`.wrap`). **Top navigation** in the sticky header; bottom bar hidden. |
| **< 1280** (`xl`) | Role detail rises as a **bottom sheet** (max 88vh, rounded top, grab handle) over a dimmed, blurred deck. |
| **≥ 1280** | Role detail docks as a **480px full-height side panel** on the right; the deck shifts left (`padding-right: 480px`) and stays visible and readable beside it. |

### Gesture vs buttons

IA §9 says: below 768px the swipe gesture is primary with the action bar as the equal
alternative; from 768px the action bar is primary because mouse-dragging is a poor affordance.

**Implemented by input capability instead of width.** Both are always available (slide 10
requires gesture *and* buttons), and the emphasis follows the device:

- `(hover: none) and (pointer: coarse)` — touch-first: hint reads *"Swipe right if interested,
  left to pass"*.
- Otherwise (mouse/trackpad): hint reads *"← Pass · → Interested"*, keyboard shortcuts are
  advertised, and drag still works.

Why: a 1024px touch tablet is gesture-first, and a 700px desktop window is not — width
alone gets both wrong.

## Landing page

Built with Tailwind (src/app/_landing), so it uses Tailwind's `sm`/`md`/`lg` — 640 / 768 /
**1024**. The 1024 hero split is a content breakpoint: the 60/40 deck-and-heading layout fits
from iPad landscape up. Gutter 16px → 32px from `sm` → 48px from `xl` (1280).

| Range | Layout |
|---|---|
| **< 640** (`sm`) | Stacked: heading → subtext → deck → CTA. The deck shows **one card at a time** (horizontal swipe); the fan's back cards are hidden. |
| **≥ 640** | The deck fans three cards. |
| **< 768** (`md`) | Header: logo · Get Started · **menu button** (disclosure panel with nav links and Log In; Escape closes and returns focus). |
| **≥ 768** | Full header: How it Works · For Employers · Log In · Get Started. |
| **< 1024** | Hero single column. |
| **≥ 1024** (`lg`) | **Asymmetric hero**: deck left 60%, heading + subtext + CTA right 40%. Deck width follows the viewport *height* (`(100svh − 280px) × 0.8`, 280–420px) so the whole hero fits the first screen. |
| all | "How it works" is a horizontal scroll-snap strip (card `min(80vw, 560px)`), centred first and last cards; "For employers" is centred, max 520px form. Each is at least one viewport tall. |

The hero heading never wraps (one nowrap line per box) at its widest weight (800), so the
scroll-linked weight change can't shift layout; checked at 375 and 1440.

## Verified widths

`e2e/responsive.spec.ts` checks each side of every boundary:

- **Landing:** 375 · 400 · 639 · 640 · 767 · 768 · 919 · 920 · 1023 · 1024 · 1440 — gutter,
  header mode, hero columns, deck card count and zero horizontal overflow; deck card in the
  first viewport at 375×812 · 768×1024 · 1024×768 · 1440×900 (whole heading too from 1024).
- **App:** nav switch at 767 / 768; card aspect and max width at 360 · 768 · 1280 · 1920;
  sheet vs side panel at 1279 / 1280; onboarding column cap at 1920.
- **Header:** frosted background clear over the hero, solid once scrolled (scroll-linked).
