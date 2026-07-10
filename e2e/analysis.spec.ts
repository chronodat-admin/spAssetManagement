import { test, expect } from '@playwright/test';
import { appRoot, bootstrapApp, expectPageHeading, navigateSidebar } from './helpers/app';
import { createSharedPage, disposeSharedPage, type SharedPageSuite } from './helpers/sharedPage';

test.describe('Analysis pages', () => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Set PLAYWRIGHT_BASE_URL to run E2E tests.');
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

  test('Dashboard shows core KPI cards and chart sections', async () => {
    const page = suite!.page;
    const main = appRoot(page).locator('main').last();
    await navigateSidebar(page, 'Dashboard');
    await expectPageHeading(page, /Asset Management|Dashboard/);
    await expect(main.getByText('Total Assets', { exact: true }).first()).toBeVisible();
    await expect(main.getByText('Available', { exact: true }).first()).toBeVisible();
    await expect(main.getByText('Assigned', { exact: true }).first()).toBeVisible();
    await expect(main.getByText('Warranty (90d)', { exact: true }).first()).toBeVisible();
  });

  test('Reports exposes source selection, column picker, and generate action', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Reports');
    await expectPageHeading(page, 'Reports');
    await expect(appRoot(page).getByText('Select Columns', { exact: true })).toBeVisible();
    await expect(appRoot(page).getByRole('button', { name: 'Select All', exact: true })).toBeVisible();
    await expect(appRoot(page).getByRole('button', { name: 'Deselect All', exact: true })).toBeVisible();
    await expect(appRoot(page).getByRole('button', { name: 'Generate Report' })).toBeVisible();
  });

  test('Depreciation shows table columns or empty state', async () => {
    const page = suite!.page;
    const main = appRoot(page).locator('main').last();
    await navigateSidebar(page, 'Depreciation');
    await expectPageHeading(page, 'Depreciation');
    const assetColumn = main.getByRole('columnheader', { name: 'Asset' });
    const emptyState = main.getByText('No depreciable assets');
    await expect(assetColumn.or(emptyState)).toBeVisible();
  });

  test('Audit Log exposes audit tracking shell', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Audit Log');
    await expectPageHeading(page, 'Audit Log');
    await expect(
      appRoot(page).getByText('Track create, update, and delete operations', { exact: false })
    ).toBeVisible();
  });
});
