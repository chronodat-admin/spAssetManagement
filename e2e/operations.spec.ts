import { test, expect } from '@playwright/test';
import { bootstrapApp, expectPageHeading, navigateSidebar, appRoot } from './helpers/app';
import { createSharedPage, disposeSharedPage, type SharedPageSuite } from './helpers/sharedPage';

const describeE2e = process.env.PLAYWRIGHT_BASE_URL ? test.describe : test.describe.skip;

describeE2e('Operations pages', () => {
  test.describe.configure({ mode: 'serial' });

  let suite: SharedPageSuite | undefined;

  test.beforeAll(async ({ browser }) => {
    suite = await createSharedPage(browser);
    await bootstrapApp(suite.page);
  });

  test.afterAll(async () => {
    await disposeSharedPage(suite);
    suite = undefined;
  });

  test('Assign Asset shows asset picker and assignee field', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Assign Asset');
    await expectPageHeading(page, 'Assign Asset');
    await expect(appRoot(page).getByText('Assign to', { exact: true })).toBeVisible();
  });

  test('Return Asset shows return form or empty state', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Return Asset');
    await expectPageHeading(page, 'Return Asset');
    const returnButton = appRoot(page).getByRole('button', { name: 'Return asset' });
    const emptyState = appRoot(page).getByText('No assigned assets are available to return.');
    await expect(returnButton.or(emptyState)).toBeVisible();
  });

  test('Book Asset shows booking fields', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Book Asset');
    await expectPageHeading(page, 'Book Asset');
    await expect(appRoot(page).getByText('Expected return date', { exact: true })).toBeVisible();
    await expect(appRoot(page).getByText('Book for', { exact: true })).toBeVisible();
  });

  test('Booking Details loads assignment table or empty state', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Booking Details');
    await expectPageHeading(page, 'Booking Details');
    const assetColumn = appRoot(page).getByRole('columnheader', { name: 'Asset' });
    const emptyState = appRoot(page).getByText('No assignment or booking records yet.');
    await expect(assetColumn.or(emptyState)).toBeVisible();
  });
});
