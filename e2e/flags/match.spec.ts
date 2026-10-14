import { expect, test } from '@playwright/test';
import { STORAGE_KEY, liveState, seed } from '../helpers';

/** Runs against the server with NEXT_PUBLIC_FLAG_MATCHES / _NOTIFICATIONS on. */
test.describe('Phase 1 — two-sided match (flagged)', () => {
  test('mutual right-swipe → celebration → match detail → employer offers trial → accept', async ({ page }) => {
    await seed(page, liveState());
    // Fieldnote is a native role whose demo employer has already swiped right.
    await page.goto('/swipe/n-fieldnote-pm');
    const sheet = page.getByRole('dialog', { name: /Fieldnote/ });
    await expect(sheet).toBeVisible();
    // Native roles are two-sided: no source attribution, no apply-out (slide 8).
    await expect(sheet.getByText(/^via /)).toHaveCount(0);
    await expect(sheet.getByRole('link', { name: /^Apply on/ })).toHaveCount(0);
    await sheet.getByRole('button', { name: 'Interested', exact: true }).click();

    const modal = page.getByRole('dialog', { name: 'IT’S A MATCH' });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Keep swiping' })).toBeFocused();
    await expect(page.getByRole('button', { name: /Undo/ })).toHaveCount(0); // a match can't be undone
    await modal.getByRole('button', { name: 'View match' }).click();

    await expect(page).toHaveURL(/\/matches\/[\w-]+$/);
    await expect(page.getByRole('heading', { name: 'Waiting on Fieldnote' })).toBeVisible();

    // Fast-forward the mock employer: back-date the match past its decision delay.
    await page.evaluate((key) => {
      const s = JSON.parse(localStorage.getItem(key)!);
      s.matches[0].createdAt = Date.now() - 20_000;
      localStorage.setItem(key, JSON.stringify(s));
    }, STORAGE_KEY);
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Paid trial offered' })).toBeVisible();
    await page.getByRole('button', { name: 'Accept trial' }).click();
    await expect(page.getByText('You accepted.')).toBeVisible();

    // Phase 2: the employer action shows up as a notification.
    await page.getByRole('link', { name: /^Notifications/ }).click();
    await expect(page.getByRole('link', { name: /Fieldnote offered a paid trial/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /It’s a match with Fieldnote/ })).toBeVisible();
  });
});
