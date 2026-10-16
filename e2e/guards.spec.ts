import { expect, test } from '@playwright/test';
import { liveState, seed } from './helpers';

test.describe('Route guard (session + profile stage)', () => {
  test('a signed-out visitor is sent to sign in from the app, and to Connect from later onboarding steps', async ({ page }) => {
    await page.goto('/swipe');
    await expect(page).toHaveURL(/\/signin\?callbackUrl=%2Fswipe$/);
    await page.goto('/onboarding/build');
    await expect(page).toHaveURL(/\/onboarding\/connect$/);
    await page.goto('/onboarding/target');
    await expect(page).toHaveURL(/\/onboarding\/connect$/);
  });

  test('a live profile skips Welcome and onboarding', async ({ page }) => {
    await seed(page, liveState());
    await page.goto('/');
    await expect(page).toHaveURL(/\/swipe$/);
    await page.goto('/onboarding/connect');
    await expect(page).toHaveURL(/\/swipe$/);
  });

  test('the Welcome page is server-rendered (real HTML before JavaScript runs)', async ({ request }) => {
    const html = await (await request.get('/')).text();
    const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] ?? '';
    const markup = body.replace(/<script[\s\S]*?<\/script>/g, '');
    expect(markup).toContain('Swipe on roles.');
    expect(markup).toContain('in three moves.');
  });

  test('Phase 1 and 2 routes are dark while their flags are off', async ({ request }) => {
    for (const path of ['/matches', '/notifications']) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(404);
    }
  });
});
