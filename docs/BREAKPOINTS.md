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

The landing page uses the app's own container (`.wrap` values: 1180px, 32px gutter, 16px below
`md`), buttons (`.btn`) and role card (`RoleCardFace`), so these rows and the app's agree.

| Range | Layout |
|---|---|
| **< 640** (`sm`) | Hero stacks: eyebrow, headline, copy with the two CTAs **side by side**, then the demo card, which starts inside the first viewport (≈ y 450 at 375×812). Floating demo chips hidden; tighter section spacing; feature and employer-path tiles stack. |
| **< 768** (`md`) | 16px gutter. "At a glance" strip is **2×2** at every phone width. Pinned "How it works" chapter: heading, journey stage, then only the active move (the others stay in the accessibility tree). |
| **≥ 768** | 32px gutter. Strip is **4 columns**. Pinned chapter is two columns: heading + the three moves left, journey stage right. |
| **640 – 1079** | **Two-column hero**: headline, copy and CTAs left, demo card right (stage `clamp(240px, 36vw, 330px)`), assurances underneath. |
| **< 920** (content) | Header collapses to logo · Get Started · **menu button** (disclosure panel with nav links and Log In; Escape closes and returns focus). |
| **≥ 920** | Full header: pill nav (How it Works · For Talent · For Employers) + Log In + Get Started. |
| **< 1080** (`lg`) | "For talent" and "For employers" stack to **one column**. |
| **≥ 1080** | **Three-column hero**: line one of the headline above the card, copy left, assurances right, line two below. The stage width follows the viewport *height* (`(100svh − 430px) × 0.66`, 250–360px) so line two stays above the fold on short laptops. Split sections side by side. The background tree brightens to 55% while the hero is in view; 22% elsewhere so muted text stays ≥ 4.5:1 over the trunk. |

The hero card starting inside the first viewport is asserted at 375×812, 768×1024, 1024×768 and
1440×900 (plus line two of the headline at ≥ 1080).

## Verified widths

`e2e/responsive.spec.ts` checks each side of every boundary:

- **Landing:** 375 · 400 · 639 · 640 · 767 · 768 · 919 · 920 · 1079 · 1080 · 1440 — gutter,
  header mode, hero/strip columns, and zero horizontal overflow; hero card in the first viewport
  at 375×812 · 768×1024 · 1024×768 · 1440×900.
- **App:** nav switch at 767 / 768; card aspect and max width at 360 · 768 · 1280 · 1920;
  sheet vs side panel at 1279 / 1280; onboarding column cap at 1920.
- **Background tree:** 55% in the hero at ≥ 1080, 22% once scrolled past.
