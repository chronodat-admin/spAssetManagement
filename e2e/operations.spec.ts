import { test, expect } from '@playwright/test';
import { bootstrapApp, expectPageHeading, navigateSidebar, appRoot } from './helpers/app';
import { createSharedPage, disposeSharedPage, type SharedPageSuite } from './helpers/sharedPage';

test.describe('Operations pages', () => {
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

  test('Assign Asset shows asset picker and assignee field', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Assign Asset');
    await expectPageHeading(page, 'Assign Asset');
    await expect(appRoot(page).getByText('Assign to', { exact: true })).toBeVisible();
  });

  test('Bulk Assign shows multi-select workflow', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Bulk Assign');
    await expectPageHeading(page, 'Bulk Assign');
    await expect(appRoot(page).getByText(/assignee|assign to/i)).toBeVisible();
  });

  test('Return Asset shows return form or empty state', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Return Asset');
    await expectPageHeading(page, 'Return Asset');
    const returnButton = appRoot(page).getByRole('button', { name: 'Return asset' });
    const emptyState = appRoot(page).getByText('No assigned assets are available to return.');
    await expect(returnButton.or(emptyState)).toBeVisible();
  });

  test('Bulk Return shows bulk workflow or empty state', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Bulk Return');
    await expectPageHeading(page, 'Bulk Return');
    await expect(appRoot(page).getByText(/return|assigned/i)).toBeVisible();
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

  test('Request Asset shows request form', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Request Asset');
    await expectPageHeading(page, 'Request Asset');
    await expect(appRoot(page).getByText(/justification|category|request/i)).toBeVisible();
  });

  test('My Requests shows request history or empty state', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'My Requests');
    await expectPageHeading(page, 'My Requests');
    await expect(appRoot(page).getByText(/request|pending|no requests/i)).toBeVisible();
  });

  test('Manage Requests shows reviewer workflow or empty state', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Manage Requests');
    await expectPageHeading(page, 'Manage Requests');
    await expect(appRoot(page).getByText(/request|pending|approve/i)).toBeVisible();
  });

  test('Scan Asset shows scanner shell', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Scan Asset');
    await expectPageHeading(page, 'Scan Asset');
    await expect(appRoot(page).getByText(/scan|barcode|qr/i)).toBeVisible();
  });

  test('Software Licenses shows add controls and table columns', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Software Licenses');
    await expectPageHeading(page, 'Software Licenses');
    await expect(appRoot(page).getByText('Product name', { exact: true })).toBeVisible();
    await expect(appRoot(page).getByText('Total seats', { exact: true })).toBeVisible();
    await expect(appRoot(page).getByRole('button', { name: 'Add license' })).toBeDisabled();
  });

  test('Inventory shows scan controls and table columns', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Inventory');
    await expectPageHeading(page, 'Inventory');
    await expect(appRoot(page).getByText('Scan label', { exact: true })).toBeVisible();
    await expect(appRoot(page).getByText('Asset found', { exact: true })).toBeVisible();
    await expect(appRoot(page).getByRole('button', { name: 'Record scan' })).toBeDisabled();
  });

  test('Maintenance shows maintenance records or empty state', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Maintenance');
    await expectPageHeading(page, 'Maintenance');
    await expect(appRoot(page).getByText(/maintenance|scheduled|technician/i)).toBeVisible();
  });
});
