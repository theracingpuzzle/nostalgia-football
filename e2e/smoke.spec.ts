import { expect, test } from '@playwright/test';

test('club list -> team selection: pick a club, see its pitch and squad, switch formation', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Premier League 2008/09')).toBeVisible();
  await page.getByRole('button', { name: /Manchester United/ }).click();

  await expect(page.getByText('Manchester United — Team Selection')).toBeVisible();
  await expect(page.getByText('Wayne Rooney')).toBeVisible();

  await page.getByRole('button', { name: '4-3-3' }).click();
  await expect(page.getByText('Pitch (4-3-3)')).toBeVisible();

  await page.getByRole('button', { name: 'Back to Club List' }).click();
  await expect(page.getByText('Premier League 2008/09')).toBeVisible();
});
