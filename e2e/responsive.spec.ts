import { expect, test, type Page } from '@playwright/test';
import { liveState, seed, topCard } from './helpers';

/**
 * The breakpoint spec (docs/BREAKPOINTS.md), executable.
 * Scale: xs 400 · sm 640 · md 768 · lg 1080 · xl 1280, plus the landing
 * nav's content breakpoint at 920. Each case sits on one side of a boundary.
 */

const at = (page: Page, width: number, height = 900) => page.setViewportSize({ width, height });

/** Reads computed layout facts via CSS-module class prefixes (`<file>_<local>__<hash>`). */
async function landingLayout(page: Page) {
  return page.evaluate(() => {
    const el = (local: string) => document.querySelector<HTMLElement>(`[class*="_${local}__"]`);
    const style = (local: string) => {
      const e = el(local);
      return e ? getComputedStyle(e) : null;
    };
    const cols = (local: string) => {
      const v = style(local)?.gridTemplateColumns;
      return v && v !== 'none' ? v.split(' ').length : 0;
    };
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      gutter: style('container')?.paddingLeft,
      nav: style('nav')?.display !== 'none',
      menuButton: style('menuBtn')?.display !== 'none',
      hero: cols('heroGrid'),
      truths: cols('truthsGrid'),
      steps: cols('steps'),
    };
  });
}

test.describe('Breakpoints — landing', () => {
  const cases: [number, Partial<Awaited<ReturnType<typeof landingLayout>>>][] = [
    [375, { gutter: '16px', menuButton: true, nav: false, hero: 1, truths: 1, steps: 1 }], // below xs
    [400, { gutter: '16px', truths: 2, steps: 1 }], // xs
    [767, { gutter: '16px', truths: 2, steps: 1 }], // just below md
    [768, { gutter: '24px', truths: 4, steps: 3, menuButton: true }], // md
    [919, { menuButton: true, nav: false }], // just below the nav content breakpoint
    [920, { menuButton: false, nav: true, hero: 1 }], // full nav fits
    [1079, { hero: 1 }], // just below lg
    [1080, { hero: 2, steps: 3 }], // lg: hero goes two-column
    [1440, { hero: 2, nav: true }],
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

  test('the background tree is brighter only while the hero is in view (lg and up)', async ({ page }) => {
    await at(page, 1280);
    await page.goto('/');
    const tree = page.locator('[class*="_bgTree__"]');
    await expect(tree).toHaveCSS('opacity', '0.55');
    await page.evaluate(() => document.getElementById('how')!.scrollIntoView({ block: 'start' }));
    await expect(tree).toHaveCSS('opacity', '0.22');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(tree).toHaveCSS('opacity', '0.55');
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
