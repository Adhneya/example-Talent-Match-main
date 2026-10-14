import { expect, test } from '@playwright/test';
import { AGGREGATED_ROLES } from '../src/lib/fixtures/roles';
import { liveState, readState, seed, topCard } from './helpers';

test.describe('Swipe deck (S-06, S-07) and Saved', () => {
  test('Interested saves the role and Undo appends a compensating record', async ({ page }) => {
    await seed(page, liveState());
    await page.goto('/swipe');
    const first = await topCard(page).getAttribute('aria-label');

    await page.getByRole('button', { name: 'Interested', exact: true }).click();
    await expect(topCard(page)).not.toHaveAttribute('aria-label', first!);
    const company = first!.split(':')[0];
    await expect(page.getByRole('button', { name: new RegExp(`Saved ${company}.*Undo`) })).toBeVisible();
    await expect(page.getByRole('link', { name: /Saved\s*1/ }).first()).toBeVisible();

    await page.getByRole('button', { name: /Undo/ }).click();
    await expect(topCard(page)).toHaveAttribute('aria-label', first!);

    // Append-only: the decision stays in the ledger, followed by its reversal.
    await expect.poll(async () => (await readState(page)).ledger.length).toBe(2);
    const { ledger } = await readState(page);
    expect(ledger[0]).toMatchObject({ kind: 'decision', decision: 'interested' });
    expect(ledger[1]).toMatchObject({ kind: 'undo', reverses: ledger[0].id });
  });

  test('arrow keys decide; a rejected swipe returns the card with a notice', async ({ page }) => {
    await seed(page, liveState(), 'swipe-fail');
    await page.goto('/swipe');
    const first = await topCard(page).getAttribute('aria-label');

    await page.keyboard.press('ArrowLeft');
    // Optimistic advance, then rollback when the server rejects it.
    // (The role="status" live region itself is zero-size; assert on the visible message inside it.)
    await expect(page.getByText(/^Couldn’t save your choice on .+\. It’s back on top of the deck\.$/)).toBeVisible();
    await expect(topCard(page)).toHaveAttribute('aria-label', first!);
    expect((await readState(page)).ledger).toHaveLength(0);
  });

  test('drag gesture commits a swipe', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await seed(page, liveState());
    await page.goto('/swipe');
    const card = topCard(page);
    const first = await card.getAttribute('aria-label');
    const box = (await card.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.4);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(box.x + box.width / 2 + i * 25, box.y + box.height * 0.4);
    await page.mouse.up();

    await expect(card).not.toHaveAttribute('aria-label', first!);
    await expect(page.getByRole('button', { name: /^Saved .*Undo/ })).toBeVisible();
  });

  test('role detail opens one tap deeper and also resolves from a direct URL', async ({ page }) => {
    await seed(page, liveState());
    await page.goto('/swipe');
    await page.getByRole('button', { name: 'More details' }).click();
    await expect(page).toHaveURL(/\/swipe\/[\w-]+$/);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close role detail' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/swipe$/);

    // A shared link still resolves, even to a role without pay (kept out of the deck by decision 4).
    await page.goto('/swipe/r-meridian-pm');
    await expect(page.getByRole('dialog')).toContainText('Not published by the employer');
    await expect(page.getByRole('dialog').getByRole('link', { name: /Apply on Greenhouse/ })).toBeVisible();
  });

  test('Saved lists interested roles; apply opens the source and marks Applied', async ({ page, context }) => {
    await context.route('https://example.com/**', (r) => r.fulfill({ status: 200, body: 'source posting' }));
    await seed(page, liveState());
    await page.goto('/swipe');
    const company = (await topCard(page).getAttribute('aria-label'))!.split(':')[0];
    await page.getByRole('button', { name: 'Interested', exact: true }).click();
    await expect.poll(async () => (await readState(page)).ledger.length).toBe(1);

    await page.getByRole('link', { name: /^Saved/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Saved roles' })).toBeVisible();
    const item = page.getByRole('listitem').filter({ hasText: company });
    const apply = item.getByRole('link', { name: /^Apply on/ });
    await expect(apply).toHaveAttribute('target', '_blank');
    await expect(apply).toHaveAttribute('rel', /noopener/);

    const [popup] = await Promise.all([context.waitForEvent('page'), apply.click()]);
    await expect(popup).toHaveURL(/example\.com/);
    await expect(item.getByText('Applied')).toBeVisible();

    await item.getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByRole('heading', { name: 'Nothing saved yet' })).toBeVisible();
  });

  test('roles without a published pay band never appear in the deck (decision 4)', async ({ page }) => {
    await seed(page, liveState());
    await page.goto('/swipe');
    const withPay = AGGREGATED_ROLES.filter((r) => r.pay);
    const seen: string[] = [];
    for (let i = 0; i < withPay.length; i++) {
      const label = (await topCard(page).getAttribute('aria-label'))!;
      seen.push(label.split(':')[0]);
      await expect(topCard(page).getByText('Not published by the employer')).toHaveCount(0);
      await page.keyboard.press('ArrowLeft');
      if (i < withPay.length - 1) await expect(topCard(page)).not.toHaveAttribute('aria-label', label);
    }
    await expect(page.getByRole('heading', { name: 'You’re all caught up' })).toBeVisible();
    expect(seen.sort()).toEqual(withPay.map((r) => r.company.name).sort());
  });

  test('an exhausted deck shows the empty state', async ({ page }) => {
    const ledger = AGGREGATED_ROLES.map((r, i) => ({
      id: `seed-${i}`,
      at: Date.now() - 10_000 + i,
      roleId: r.id,
      kind: 'decision',
      decision: 'pass',
    }));
    await seed(page, liveState({ ledger }));
    await page.goto('/swipe');
    await expect(page.getByRole('heading', { name: 'You’re all caught up' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check for new roles' })).toBeVisible();
  });
});
