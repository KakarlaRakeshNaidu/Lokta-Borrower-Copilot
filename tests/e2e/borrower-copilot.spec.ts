import { expect, test } from '@playwright/test';

test('Priya demo shows separate safe and lender numbers plus quote warning', async ({ page }) => {
  await page.goto('/?demo=priya');
  await expect(page.getByRole('heading', { name: /lower EMI, lower amount or safer structure/i })).toBeVisible();
  await expect(page.getByText(/Likely sanction vs safe amount/i)).toBeVisible();
  await page.getByRole('button', { name: /^Card$/ }).click();
  await expect(page.getByText('Negotiation Card')).toBeVisible();
  await expect(page.getByText(/Quote comparison/i)).toBeVisible();
});

test('Ravi demo suggests secured product route', async ({ page }) => {
  await page.goto('/?demo=ravi');
  await expect(page.getByRole('main').getByText('Loan against property / secured business borrowing').first()).toBeVisible();
  await expect(page.getByText(/Secured route is worth comparing/i).first()).toBeVisible();
});

test('Anita demo reaches protective do not borrow branch', async ({ page }) => {
  await page.goto('/?demo=anita');
  await expect(page.getByLabel('Outcome cards').getByText("Don't borrow").first()).toBeVisible();
  await expect(page.getByText(/Variable income, active high-cost debt/i)).toBeVisible();
  await expect(page.getByText(/Projected income is upside only/i)).toBeVisible();
});

test('manual sparse salaried flow produces lower-confidence ranges', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Check my borrowing position/i }).click();
  await page.getByLabel(/How much do you want/i).fill('300000');
  await page.getByRole('button', { name: /Next/i }).click();
  await page.getByLabel(/First name/i).fill('Sparse');
  await page.getByLabel(/City/i).fill('Pune');
  await page.getByLabel(/Age/i).fill('31');
  await page.getByRole('button', { name: /Next/i }).click();
  await page.getByLabel(/Net monthly salary/i).fill('55000');
  await page.getByRole('button', { name: /Next/i }).click();
  await page.getByRole('button', { name: /I don't know/i }).first().click();
  await page.getByRole('button', { name: /Next/i }).click();
  await page.getByRole('button', { name: /^Unknown$/ }).click();
  await page.getByRole('button', { name: /Next|Show my borrowing position/i }).click();
  const show = page.getByRole('button', { name: /Show my borrowing position/i });
  if (await show.isVisible().catch(() => false)) await show.click();
  await expect(page.getByText(/Confidence: low/i)).toBeVisible();
  await expect(page.getByText(/Unknown score widens the band/i)).toBeVisible();
});

test('print-card entry point is available', async ({ page }) => {
  await page.goto('/?demo=priya');
  await page.getByRole('button', { name: /^Card$/ }).click();
  await expect(page.getByRole('button', { name: /Print \/ Save as PDF/i })).toBeVisible();
});