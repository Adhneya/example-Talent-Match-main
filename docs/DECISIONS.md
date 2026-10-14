# Product decisions

Resolves the open items from the developer-guidance deck (slide 11 blockers 1–5) and the
gaps found in the Frontend Analysis Report (§7). Decided 2026-10-13.

| # | Question | Decision | Why | Status |
|---|---|---|---|---|
| Auth | How do returning candidates get back in? | **Sign in with LinkedIn** | Replaces pasting the LinkedIn URL at Connect, so identity costs no extra field and onboarding stays 3 steps (slide 3). | ✅ Built (Auth.js, `src/auth.ts`) — live once the LinkedIn app credentials are set |
| Auth-2 | LinkedIn sign-in returns identity only (name, email, photo) — not the profile URL or work history. Where does the profile come from? | **LinkedIn for identity, resume for the profile.** No URL field. | Full profile data needs LinkedIn partner access (slow, not guaranteed); an optional URL field would add an input (slide 3). Decided 2026-10-14. | ✅ Built |
| 1 | Which job sources first (US)? | **Public ATS job-board APIs** — Greenhouse, Lever, Ashby | Official per-company APIs with apply links; meets slide 8's "prefer official APIs, respect terms". | Needs backend (ingestion) — step 4 |
| 2 | Aggregated roles: in-app apply or redirect? | **Redirect to the source** | Slide 8: send apply to the source rather than pretending to host it. | ✅ Built |
| 3 | Match algorithm v1? | **Rules-based; score not shown on the card** | Keyword + role-family + pay weighting (slide 10's v1). No reserved card slot needed. | ✅ Built (mock ranker in `src/lib/api.ts`) |
| 4 | Listing without a pay band? | **Only show roles with published pay** | Pay is the hook (slide 5); US pay-transparency laws mean most listings carry a band. | ✅ Built — filtered out of the deck |
| 5 | Minimum employer setup for match + paid trial? | **Lean self-serve**: company name, one role with a pay band, a hiring contact; trial terms agreed per match | Lowest friction to reach two-sided matching (slide 8 step 3). | Phase 1 — step 5 |
| Pass | What does a candidate see when an employer passes? | **Polite closed status** with a link back to swiping | Honest and final; matches slide 6's "no further contact". | ✅ Built (behind Phase 1 flag) |

## Consequences for the frontend

- The deck never shows a role without pay. `PayRangePanel` keeps a defensive fallback for
  direct links to such a role, but it is not a designed state any more.
- `Role.fitScore` stays internal to ranking.
- Connect is **Continue with LinkedIn**, then the resume upload (locked until signed in).
  Returning candidates use **Log In** → `/signin`. The profile engine reads the resume only.
- Sessions are an encrypted cookie (no database). Candidate data is still kept in the
  browser, now **per LinkedIn account**, so people sharing a browser never see each other's
  data. It doesn't follow them to another device until there is a database.
- Source names on aggregated cards are limited to Greenhouse, Lever and Ashby.
