import { expect, test, type Page } from '@playwright/test';
import { STORAGE_KEY, liveState, seed, signIn, storageKey, topCard } from './helpers';

/**
 * Sign in with LinkedIn (decision "Auth"). The real LinkedIn round trip can't
 * run in tests, so sessions come from the test-only provider (AUTH_TEST_SIGNIN
 * in e2e/serve.mjs); the LinkedIn leg is checked up to the redirect.
 */

type Captured = { name: string; props: Record<string, unknown> };
const events = (page: Page) => page.evaluate(() => (window.__TM_EVENTS__ ?? []) as Captured[]);

/** Stubs LinkedIn and records where the browser was sent. Returns a getter for that URL. */
async function stubLinkedIn(page: Page) {
  let url: URL | null = null;
  await page.route(/linkedin\.com/, (route) => {
    url = new URL(route.request().url());
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>LinkedIn (stub)</title>' });
  });
  return () => url;
}

/** The debug sink also logs to the console, which survives full-page navigations. */
function consoleEvents(page: Page) {
  const seen: string[] = [];
  page.on('console', (m) => {
    if (m.text().startsWith('[analytics]')) seen.push(m.text());
  });
  return seen;
}

test.describe('Sign in with LinkedIn', () => {
  test('Continue with LinkedIn hands off to LinkedIn’s OpenID Connect sign-in', async ({ page }) => {
    // Needs the network: the server reads LinkedIn's public OIDC discovery document.
    const logged = consoleEvents(page);
    const authorizeUrl = await stubLinkedIn(page);

    await page.goto('/onboarding/connect');
    await page.getByRole('button', { name: 'Continue with LinkedIn' }).click();
    await expect.poll(() => authorizeUrl()?.pathname).toBe('/oauth/v2/authorization');

    const params = authorizeUrl()!.searchParams;
    expect(params.get('client_id')).toBe('e2e-linkedin-client-id');
    expect(params.get('response_type')).toBe('code');
    expect(params.get('redirect_uri')).toBe('http://localhost:3100/api/auth/callback/linkedin');
    expect(params.get('scope')?.split(' ').sort()).toEqual(['email', 'openid', 'profile']);
    expect(params.get('state')).toBeTruthy(); // CSRF protection for the round trip
    expect(logged.some((t) => t.includes('sign_in_started'))).toBe(true);
  });

  test('a completed sign-in is tracked and resumes onboarding', async ({ page }) => {
    await page.goto('/signin');
    await page.evaluate(() => sessionStorage.setItem('talentmatch.signInPending', 'test'));
    await signIn(page);
    await page.reload();

    // Signed in and brand new: /signin hands over to Connect.
    await expect(page).toHaveURL(/\/onboarding\/connect$/);
    await expect(page.getByText('Signed in with LinkedIn')).toBeVisible();
    const succeeded = (await events(page)).filter((e) => e.name === 'sign_in_succeeded');
    expect(succeeded.map((e) => e.props)).toEqual([{ provider: 'test' }]);
  });

  test('a cancelled or failed sign-in explains itself and offers a retry', async ({ page }) => {
    await page.goto('/signin?error=OAuthCallbackError');
    await expect(page.getByRole('alert').filter({ hasText: 'Sign-in was cancelled' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with LinkedIn' })).toBeEnabled();
    const failed = (await events(page)).filter((e) => e.name === 'sign_in_failed');
    expect(failed.map((e) => e.props)).toEqual([{ reason: 'access_denied' }]);
  });

  test('a deep link survives sign-in', async ({ page }) => {
    const authorizeUrl = await stubLinkedIn(page);
    await page.goto('/swipe/r-meridian-pm');
    await expect(page).toHaveURL(/\/signin\?callbackUrl=%2Fswipe%2Fr-meridian-pm$/);
    await page.getByRole('button', { name: 'Continue with LinkedIn' }).click();
    await expect.poll(() => authorizeUrl()?.pathname).toBe('/oauth/v2/authorization');

    // Auth.js keeps the destination for LinkedIn's return leg…
    const cookies = await page.context().cookies();
    const callback = cookies.find((c) => c.name.endsWith('authjs.callback-url'));
    expect(decodeURIComponent(callback?.value ?? '')).toMatch(/^(http:\/\/localhost:3100)?\/swipe\/r-meridian-pm$/);

    // …and once signed in, that deep link opens directly.
    await seed(page, liveState());
    await page.goto('/swipe/r-meridian-pm');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('sign out ends the session; signing back in restores the candidate’s data', async ({ page }) => {
    const logged = consoleEvents(page);
    await seed(page, liveState({ ledger: [{ id: 's1', at: 1, roleId: 'r-acme-pm', kind: 'decision', decision: 'interested' }] }));
    await page.goto('/profile');
    await expect(page.getByText('Signed in with LinkedIn')).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => logged.some((t) => t.includes('sign_out'))).toBe(true);
    await page.goto('/saved');
    await expect(page).toHaveURL(/\/signin/);
    // Data stays on the device, keyed to the account…
    expect((await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)) ?? '').toContain('r-acme-pm');

    // …so signing back in picks up exactly where they left off.
    await signIn(page);
    await page.goto('/saved');
    await expect(page.getByRole('heading', { name: 'Saved roles' })).toBeVisible();
    await expect(page.getByText('Acme Freight').first()).toBeVisible();
  });

  test('two people on one browser never see each other’s data', async ({ page }) => {
    await seed(page, liveState());
    await page.goto('/swipe');
    await expect(topCard(page)).toBeVisible();

    await signIn(page, { id: 'sam', name: 'Sam Lee' });
    await page.goto('/swipe');
    await expect(page).toHaveURL(/\/onboarding\/connect$/); // a brand-new candidate
    await expect(page.getByText('Sam Lee')).toBeVisible();
    const stored = (id: string) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), storageKey(id));
    expect((await stored('sam')).profile).toBeNull(); // Sam starts empty…
    expect((await stored('jordan')).profile.roleTitle).toBe('Senior Product Manager'); // …Jordan's data is untouched
  });
});
