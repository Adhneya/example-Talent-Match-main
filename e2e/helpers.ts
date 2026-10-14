import type { Page } from '@playwright/test';

/** Mirrors the shape persisted by src/store/AppStore.tsx under STORAGE_KEY. */
export const STORAGE_KEY = 'talentmatch.v1';

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
    draft: { linkedinUrl: '', resume: null, generated: null },
    sources: { linkedinUrl: 'https://www.linkedin.com/in/jordan-rivera', resumeName: 'resume.pdf' },
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
 * Seed app state before the first page script runs. Only writes when storage
 * is empty, so reloads and in-test navigations keep whatever the app saved.
 */
export async function seed(page: Page, state: Seed, debug?: string) {
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
