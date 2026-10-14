import { expect, test, type Page } from '@playwright/test';
import { liveState, pdf, seed, signIn, topCard } from './helpers';

/** Events captured by the debug sink (NEXT_PUBLIC_ANALYTICS_DEBUG=1 in e2e/serve.mjs). */
type Captured = { name: string; props: Record<string, unknown> };
const events = (page: Page) => page.evaluate(() => (window.__TM_EVENTS__ ?? []) as Captured[]);
const named = async (page: Page, name: string) => (await events(page)).filter((e) => e.name === name);

test.describe('Event layer (IA §1 Phase 2 extension point)', () => {
  test('onboarding funnel is tracked end to end, with no personal data in any event', async ({ page }) => {
    // Signed in up front: a reload after sign-in would empty the in-page event buffer.
    await signIn(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Find Roles' }).first().click();
    await page.locator('input[type="file"]').setInputFiles(pdf('Jordan_Rivera_Resume.pdf'));
    await page.getByRole('button', { name: 'Build my profile' }).click();
    await expect(page.getByRole('heading', { name: 'Here’s your profile' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Confirm profile' }).click();
    await page.getByRole('button', { name: 'Start swiping' }).click();
    await expect(topCard(page)).toBeVisible();

    const all = await events(page);
    const names = all.map((e) => e.name);
    // Funnel order (client-side navigation keeps one buffer for the whole run).
    const funnel = [
      'landing_cta_clicked',
      'onboarding_step_viewed',
      'connect_submitted',
      'profile_build_succeeded',
      'profile_confirmed',
      'target_selected',
      'onboarding_completed',
      'deck_card_shown',
    ];
    let cursor = -1;
    for (const step of funnel) {
      const at = names.indexOf(step, cursor + 1);
      expect(at, `${step} after ${funnel[funnel.indexOf(step) - 1] ?? 'start'}`).toBeGreaterThan(cursor);
      cursor = at;
    }

    expect((await named(page, 'landing_cta_clicked'))[0].props).toEqual({ cta: 'find_roles', location: 'hero' });
    expect((await named(page, 'onboarding_step_viewed')).map((e) => e.props.step)).toEqual(['connect', 'build', 'target']);
    expect((await named(page, 'profile_confirmed'))[0].props).toEqual({ edited: false });
    expect((await named(page, 'target_selected'))[0].props).toEqual({ target: 'product-manager', suggested: true });
    const [done] = await named(page, 'onboarding_completed');
    expect(typeof done.props.duration_s).toBe('number');
    expect(done.props.duration_s as number).toBeLessThan(120); // the slide 3 budget, measured for real

    // Privacy: ids, enums, counts and durations only.
    const payload = JSON.stringify(all).toLowerCase();
    for (const pii of ['linkedin.com', 'jordan', 'rivera', '.pdf', '@', 'example.test']) expect(payload).not.toContain(pii);
  });

  test('swipes record their method; undo and rejected files are tracked', async ({ page }) => {
    await seed(page, liveState());
    await page.goto('/swipe');
    await expect(topCard(page)).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect.poll(async () => (await named(page, 'swipe')).length).toBe(1);
    await page.getByRole('button', { name: 'Interested', exact: true }).click();
    await expect.poll(async () => (await named(page, 'swipe')).length).toBe(2);
    await page.getByRole('button', { name: /Undo/ }).click();

    const swipes = await named(page, 'swipe');
    expect(swipes.map((e) => [e.props.decision, e.props.method])).toEqual([
      ['pass', 'keyboard'],
      ['interested', 'button'],
    ]);
    expect(swipes[1].props.source_kind).toBe('aggregated');
    await expect.poll(async () => (await named(page, 'swipe_undone')).length).toBe(1);
    expect((await named(page, 'deck_card_shown')).length).toBeGreaterThanOrEqual(3);
  });

  test('a rejected resume file logs only its extension', async ({ page }) => {
    await signIn(page);
    await page.goto('/onboarding/connect');
    await page.locator('input[type="file"]').setInputFiles({ name: 'my-cv.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
    const [rejected] = await named(page, 'connect_file_rejected');
    expect(rejected.props).toEqual({ extension: 'txt' });
  });
});
