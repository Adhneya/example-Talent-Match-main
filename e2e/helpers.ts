import type { Page } from '@playwright/test';

/**
 * The test-only sign-in (provider "test" in src/auth.ts, enabled by
 * AUTH_TEST_SIGNIN=1 in e2e/serve.mjs). LinkedIn itself can't be driven in tests.
 */
export const TEST_USER = { id: 'jordan', name: 'Jordan Rivera' };

/** Mirrors src/store/AppStore.tsx: state is stored per signed-in user (`test:<id>` for test users). */
export const storageKey = (id = TEST_USER.id) => `talentmatch.v1:test:${id}`;
export const STORAGE_KEY = storageKey();

/** Signs the page's browser context in as a test user (sets the session cookie). */
export async function signIn(page: Page, user = TEST_USER) {
  const request = page.context().request;
  const { csrfToken } = await (await request.get('/api/auth/csrf')).json();
  const res = await request.post('/api/auth/callback/test', { form: { csrfToken, ...user } });
  if (!res.ok()) throw new Error(`test sign-in failed: ${res.status()}`);
}

export const PROFILE = {
  roleTitle: 'Senior Product Manager',
  summary: '7 years in B2B SaaS product, most recently leading payments at a Series C fintech.',
  skills: ['Roadmapping', 'User Research', 'SQL', 'A/B Testing', 'Stakeholder Management', 'Payments'],
  standout: 'Launched usage-based billing that lifted net revenue retention from 104% to 118%.',
  salary: { min: 160000, max: 185000 },
};

type Seed = Record<string, unknown>;

export function liveState(overrides: Seed = {}): Seed {
  return {
    draft: { resume: null, generated: null },
    sources: { resumeName: 'resume.pdf' },
    profile: PROFILE,
    targetRoleId: 'product-manager',
    ledger: [],
    unsaved: [],
    applied: [],
    matches: [],
    notificationsSeenAt: 0,
    ...overrides,
  };
}

/**
 * Sign in as the test user and seed their state before the first page script
 * runs. Only writes when storage is empty, so reloads and in-test navigations
 * keep whatever the app saved.
 */
export async function seed(page: Page, state: Seed, debug?: string) {
  await signIn(page);
  await page.addInitScript(
    ([key, value, dbg]) => {
      if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, value);
      if (dbg) window.localStorage.setItem('talentmatch.debug', dbg);
    },
    [STORAGE_KEY, JSON.stringify(state), debug ?? ''] as const,
  );
}

export async function readState(page: Page) {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || '{}'), STORAGE_KEY);
}

export const topCard = (page: Page) => page.locator('[aria-roledescription="role card"]');

export function pdf(name: string) {
  return { name, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test resume') };
}
