import { expect, test } from '@playwright/test';
import { pdf, readState, topCard } from './helpers';

test.describe('Onboarding (S-01 → S-05)', () => {
  test('connect validates input, recovers from a parse failure, confirms, and lands in the deck', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Swipe on roles.');
    await page.getByRole('link', { name: 'Find Roles' }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/connect$/);

    const build = page.getByRole('button', { name: 'Build my profile' });
    await expect(build).toBeDisabled();

    // Slide 3: only a URL paste and a file — and both are validated.
    const url = page.getByLabel('LinkedIn profile URL');
    await url.fill('not a link');
    await url.blur();
    await expect(page.getByText('it looks like linkedin.com/in/your-name')).toBeVisible();

    const file = page.locator('input[type="file"]');
    await file.setInputFiles({ name: 'resume.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
    await expect(page.getByText('isn’t supported. Upload a PDF or DOCX file.')).toBeVisible();

    // A link pasted without https:// is accepted (regression: native URL validation blocked it).
    await url.fill('linkedin.com/in/jordan-rivera');
    await file.setInputFiles(pdf('unreadable-scan.pdf'));
    await expect(build).toBeEnabled();
    await build.click();

    // Parse failure → retry path, never a manual-entry form (slide 3 vs slide 10 tension).
    await expect(page.getByRole('heading', { name: 'We couldn’t read that resume.' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Upload a different resume' }).click();
    await expect(page).toHaveURL(/\/onboarding\/connect$/);
    await expect(url).toHaveValue('https://www.linkedin.com/in/jordan-rivera');

    await page.locator('input[type="file"]').setInputFiles(pdf('Jordan_Rivera_Resume.pdf'));
    await page.getByRole('button', { name: 'Build my profile' }).click();
    await expect(page.getByRole('heading', { name: 'Building your profile' })).toBeVisible();

    // Processing cross-fades into the blocking confirm card without a route change.
    await expect(page.getByRole('heading', { name: 'Here’s your profile' })).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/onboarding\/build$/);

    // Every region is editable in place.
    await page.getByRole('button', { name: 'Edit role title' }).click();
    await page.getByLabel('Role title').fill('Senior Product Manager, Payments');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('heading', { name: 'Senior Product Manager, Payments' })).toBeVisible();

    await page.getByRole('button', { name: 'Confirm profile' }).click();
    await expect(page).toHaveURL(/\/onboarding\/target$/);
    await expect(page.getByRole('radio', { name: /Product Manager\s*Suggested/ })).toBeChecked();

    await page.getByRole('button', { name: 'Start swiping' }).click();
    await expect(page).toHaveURL(/\/swipe$/);
    await expect(topCard(page)).toBeVisible();

    const state = await readState(page);
    expect(state.profile.roleTitle).toBe('Senior Product Manager, Payments');
    expect(state.draft.generated).toBeNull(); // draft cleared once onboarding ends

    // Target → Swipe is a replace: Back must not reopen onboarding.
    await page.goBack();
    await expect(page).toHaveURL(/\/swipe$/);
  });

  test('stays inside the two-minute budget (slide 3)', async ({ page }) => {
    const marks: Record<string, number> = {};
    const t0 = Date.now();
    const mark = (k: string) => (marks[k] = Date.now() - t0);

    await page.goto('/');
    await page.getByRole('link', { name: 'Find Roles' }).first().click();
    await page.getByLabel('LinkedIn profile URL').fill('linkedin.com/in/jordan-rivera');
    await page.locator('input[type="file"]').setInputFiles(pdf('resume.pdf'));
    await page.getByRole('button', { name: 'Build my profile' }).click();
    mark('connect');
    await expect(page.getByRole('heading', { name: 'Here’s your profile' })).toBeVisible({ timeout: 15_000 });
    mark('auto-build');
    await page.getByRole('button', { name: 'Confirm profile' }).click();
    await page.getByRole('button', { name: 'Start swiping' }).click();
    await expect(topCard(page)).toBeVisible();
    mark('first card');

    test.info().annotations.push({ type: 'timing (system only, ms)', description: JSON.stringify(marks) });
    // System time only — human reading/typing time is not simulated. Auto-build is the
    // one stage outside design control, so it gets its own ceiling (IA §7 budget: ~30s).
    expect(marks['auto-build'] - marks['connect']).toBeLessThan(30_000);
    expect(marks['first card']).toBeLessThan(120_000);
  });
});
