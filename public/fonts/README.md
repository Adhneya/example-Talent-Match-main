# Brand fonts (licensed)

The design system requests the licensed brand faces first, with self-hosted
fallbacks (Inter for Neue Haas Unica, Newsreader for Reckless GISI) so the app
renders faithfully without them.

To use the real fonts, drop these `.woff2` files here:

- `NeueHaasUnica-Regular.woff2`
- `RecklessGISI-Regular.woff2`
- `RecklessGISI-Italic.woff2`

Then uncomment the `@font-face` block at the top of
`src/app/globals.css`. No other change needed — the font stacks already list
`"Neue Haas Unica"` and `"Reckless GISI"` ahead of the fallbacks.
