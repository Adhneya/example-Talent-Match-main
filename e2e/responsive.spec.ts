import { expect, test, type Page } from '@playwright/test';
import { liveState, seed, topCard } from './helpers';

/**
 * The breakpoint spec (docs/BREAKPOINTS.md), executable.
 * Scale: xs 400 · sm 640 · md 768 · lg 1080 · xl 1280; the landing page uses
 * Tailwind's sm/md/lg (640/768/1024). Each case sits on one side of a boundary.
 */

const at = (page: Page, width: number, height = 900) => page.setViewportSize({ width, height });

/** Reads computed layout facts from the landing's data-* hooks (src/app/_landing). */
async function landingLayout(page: Page) {
  return page.evaluate(() => {
    const el = (attr: string) => document.querySelector<HTMLElement>(`[${attr}]`);
    const shown = (attr: string) => {
      const e = el(attr);
      return !!e && getComputedStyle(e).display !== 'none';
    };
    const grid = el('data-hero-grid');
    const cols = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0;
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      gutter: grid ? getComputedStyle(grid).paddingLeft : undefined,
      nav: shown('data-landing-nav'),
      menuButton: shown('data-landing-menu-button'),
      hero: cols,
      // Phones show one deck card at a time; the three-card fan appears from sm.
      deckCards: Array.from(document.querySelectorAll('[data-deck] > [data-depth]')).filter(
        (d) => getComputedStyle(d).display !== 'none',
      ).length,
    };
  });
}

test.describe('Breakpoints — landing', () => {
  const cases: [number, Partial<Awaited<ReturnType<typeof landingLayout>>>][] = [
    [375, { gutter: '16px', menuButton: true, nav: false, hero: 1, deckCards: 1 }], // below xs: one card at a time
    [400, { gutter: '16px', deckCards: 1 }], // xs
    [639, { hero: 1, deckCards: 1 }], // just below sm
    [640, { hero: 1, deckCards: 3, gutter: '32px' }], // sm: the fan appears
    [767, { menuButton: true, nav: false }], // just below md
    [768, { menuButton: false, nav: true, hero: 1 }], // md: two nav links fit, no menu needed
    [919, { nav: true }],
    [920, { nav: true, hero: 1 }],
    [1023, { hero: 1 }], // just below the hero split
    [1024, { hero: 2, deckCards: 3 }], // lg (Tailwind): deck left 60%, heading right 40%
    [1440, { hero: 2, nav: true, gutter: '48px' }],
  ];

  for (const [width, expected] of cases) {
    test(`${width}px`, async ({ page }) => {
      await at(page, width);
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const layout = await landingLayout(page);
      expect(layout.overflow, 'no horizontal scroll').toBeLessThanOrEqual(0);
      expect(layout).toMatchObject(expected);
    });
  }

  // The swipe deck — the product demo — starts inside the first viewport at every common size.
  for (const [width, height] of [
    [375, 812],
    [768, 1024],
    [1024, 768],
    [1440, 900],
  ]) {
    test(`the hero card starts inside the first viewport (${width}×${height})`, async ({ page }) => {
      await at(page, width, height);
      await page.goto('/');
      const card = (await page.locator('#hero [data-deck] article').boundingBox())!;
      expect(card.y).toBeLessThan(height - 200);
      if (width >= 1024) {
        // Side by side: the whole heading is on screen next to the deck.
        const h1 = (await page.getByRole('heading', { level: 1 }).boundingBox())!;
        expect(h1.y + h1.height).toBeLessThanOrEqual(height);
      }
    });
  }

  // Replaces the background-tree check (GrowthTree was removed): the header's
  // frosted background is scroll-linked — clear over the hero, solid once scrolled.
  test('the header background is clear over the hero and fades in once scrolled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); // reduced motion keeps it solid throughout
    await at(page, 1280);
    await page.goto('/');
    const bg = page.locator('[data-landing-header] > div').first();
    await expect(bg).toHaveCSS('opacity', '0');
    await page.evaluate(() => document.getElementById('how')!.scrollIntoView({ block: 'start' }));
    await expect(bg).toHaveCSS('opacity', '1');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(bg).toHaveCSS('opacity', '0');
  });
});

test.describe('Breakpoints — app shell', () => {
  test.beforeEach(async ({ page }) => seed(page, liveState()));

  test('below md: bottom navigation; from md: top navigation', async ({ page }) => {
    await at(page, 767);
    await page.goto('/swipe');
    await expect(page.locator('.bnav')).toBeVisible();
    await expect(page.locator('.tnav')).toBeHidden();

    await at(page, 768);
    await expect(page.locator('.tnav')).toBeVisible();
    await expect(page.locator('.bnav')).toBeHidden();
  });

  for (const width of [360, 768, 1280, 1920]) {
    test(`the card keeps a portrait 4:5 aspect and never stretches (${width}px)`, async ({ page }) => {
      await at(page, width);
      await page.goto('/swipe');
      const box = (await topCard(page).boundingBox())!;
      expect(box.width).toBeLessThanOrEqual(400);
      expect(box.width / box.height).toBeCloseTo(0.8, 1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('role detail: a sheet below xl, a side panel beside the deck from xl', async ({ page }) => {
    await at(page, 1279);
    await page.goto('/swipe/r-acme-pm');
    const sheet = page.locator('.sheet');
    await expect(sheet).toBeVisible();
    let box = (await sheet.boundingBox())!;
    expect(box.height).toBeLessThan(900); // rises from the bottom, not full height

    await at(page, 1280);
    await expect.poll(async () => (await sheet.boundingBox())!.height).toBe(900); // full-height side panel
    box = (await sheet.boundingBox())!;
    expect(box.x + box.width).toBe(1280); // docked right
    expect(box.width).toBeLessThanOrEqual(480);
    // The deck stays visible beside it.
    const card = (await topCard(page).boundingBox())!;
    expect(card.x + card.width).toBeLessThanOrEqual(box.x);
  });

  test('onboarding column stays width-capped on wide screens', async ({ page }) => {
    // Runs after the beforeEach seed: back to a brand-new visitor.
    await page.addInitScript(() => window.localStorage.clear());
    await at(page, 1920);
    await page.goto('/onboarding/connect');
    const col = (await page.locator('section.col').boundingBox())!;
    expect(col.width).toBeLessThanOrEqual(560);
  });
});
