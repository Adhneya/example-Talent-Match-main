import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { PROFILE, liveState, seed } from './helpers';

/**
 * Automated WCAG 2.1 A/AA scan of every Phase 0 screen. Fails on serious or
 * critical violations; moderate/minor ones are attached to the report.
 */

async function scan(page: Page, ready: () => Promise<void>) {
  await ready();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  await test.info().attach('axe-violations', {
    body: JSON.stringify(
      results.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target) })),
      null,
      2,
    ),
    contentType: 'application/json',
  });
  expect(
    blocking.map((v) => `${v.impact}: ${v.id} — ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`),
  ).toEqual([]);
}

const connected = {
  draft: { resume: { name: 'resume.pdf', size: 1000 }, generated: PROFILE },
  sources: null,
  profile: null,
  targetRoleId: null,
};

test.describe('Accessibility (axe, WCAG 2.1 AA)', () => {
  test('Welcome', async ({ page }) => {
    await page.goto('/');
    await scan(page, () => expect(page.getByRole('heading', { level: 1 })).toBeVisible());
  });

  test('Connect (signed out)', async ({ page }) => {
    await page.goto('/onboarding/connect');
    await scan(page, () => expect(page.getByRole('button', { name: 'Continue with LinkedIn' })).toBeVisible());
  });

  test('Connect (signed in)', async ({ page }) => {
    await seed(page, liveState({ profile: null, targetRoleId: null, sources: null }));
    await page.goto('/onboarding/connect');
    await scan(page, () => expect(page.getByText('Signed in with LinkedIn')).toBeVisible());
  });

  test('Sign in, with an error', async ({ page }) => {
    await page.goto('/signin?error=OAuthCallbackError');
    await scan(page, () => expect(page.getByRole('alert').filter({ hasText: 'Sign-in' })).toBeVisible());
  });

  test('Confirm profile', async ({ page }) => {
    await seed(page, liveState(connected));
    await page.goto('/onboarding/build');
    await scan(page, () => expect(page.getByRole('heading', { name: 'Here’s your profile' })).toBeVisible());
  });

  test('Target', async ({ page }) => {
    await seed(page, liveState({ ...connected, profile: PROFILE }));
    await page.goto('/onboarding/target');
    await scan(page, () => expect(page.getByRole('heading', { name: 'What role are you after?' })).toBeVisible());
  });

  test('Swipe deck', async ({ page }) => {
    await seed(page, liveState());
    await page.goto('/swipe');
    await scan(page, () => expect(page.locator('[aria-roledescription="role card"]')).toBeVisible());
  });

  test('Role detail', async ({ page }) => {
    await seed(page, liveState());
    await page.goto('/swipe/r-meridian-pm');
    await scan(page, () => expect(page.getByRole('dialog')).toBeVisible());
  });

  test('Saved', async ({ page }) => {
    await seed(
      page,
      liveState({ ledger: [{ id: 's1', at: Date.now(), roleId: 'r-acme-pm', kind: 'decision', decision: 'interested' }] }),
    );
    await page.goto('/saved');
    await scan(page, () => expect(page.getByRole('heading', { name: 'Saved roles' })).toBeVisible());
  });

  test('Profile', async ({ page }) => {
    await seed(page, liveState());
    await page.goto('/profile');
    await scan(page, () => expect(page.getByRole('heading', { name: 'Your profile', level: 1 })).toBeVisible());
  });
});
