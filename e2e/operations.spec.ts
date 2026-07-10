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
    await expect(appRoot(page).getByLabel('Assign to')).toBeVisible();
  });

  test('Bulk Assign shows multi-select workflow', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Bulk Assign');
    await expectPageHeading(page, 'Bulk Assign');
    await expect(appRoot(page).getByText(/assignee|assign to/i)).toBeVisible();
  });

  test('Return Asset shows return form or empty state', async () => {
    const page = suite!.page;
    const main = appRoot(page).locator('main').last();
    await navigateSidebar(page, 'Return Asset');
    await expectPageHeading(page, 'Return Asset');
    const returnButton = main.getByRole('button', { name: 'Return asset' });
    const emptyState = main.getByText('No assigned assets are available to return.');
    await expect(returnButton.or(emptyState)).toBeVisible();
  });

  test('Bulk Return shows bulk workflow or empty state', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Bulk Return');
    await expectPageHeading(page, 'Bulk Return');
    await expect(appRoot(page).getByText('Return multiple assigned assets at once.')).toBeVisible();
    await expect(appRoot(page).getByRole('button', { name: /Return selected/i })).toBeVisible();
  });

  test('Book Asset shows booking fields', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Book Asset');
    await expectPageHeading(page, 'Book Asset');
    await expect(appRoot(page).getByLabel('Expected return date')).toBeVisible();
    await expect(appRoot(page).getByLabel('Book for')).toBeVisible();
  });

  test('Booking Details loads assignment table or empty state', async () => {
    const page = suite!.page;
    const main = appRoot(page).locator('main').last();
    await navigateSidebar(page, 'Booking Details');
    await expectPageHeading(page, 'Booking Details');
    const assetColumn = main.getByRole('columnheader', { name: 'Asset' });
    const emptyState = main.getByText('No bookings yet');
    await expect(assetColumn.or(emptyState)).toBeVisible();
  });

  test('Request Asset shows request form', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Request Asset');
    await expectPageHeading(page, 'Request Asset');
    await expect(appRoot(page).getByLabel('Justification')).toBeVisible();
  });

  test('My Requests shows request history or empty state', async () => {
    const page = suite!.page;
    const main = appRoot(page).locator('main').last();
    await navigateSidebar(page, 'My Requests');
    await expectPageHeading(page, 'My Requests');
    await expect(main.getByText(/request|pending|no requests/i).first()).toBeVisible();
  });

  test('Manage Requests shows reviewer workflow or empty state', async () => {
    const page = suite!.page;
    const main = appRoot(page).locator('main').last();
    await navigateSidebar(page, 'Manage Requests');
    await expectPageHeading(page, 'Manage Requests');
    await expect(main.getByText(/request|pending|approve/i).first()).toBeVisible();
  });

  test('Scan Asset shows scanner shell', async () => {
    const page = suite!.page;
    const main = appRoot(page).locator('main').last();
    await navigateSidebar(page, 'Scan Asset');
    await expectPageHeading(page, 'Scan Asset');
    await expect(main.getByText(/scan|barcode|qr/i).first()).toBeVisible();
  });

  test('Software Licenses shows add controls and table columns', async () => {
    const page = suite!.page;
    const main = appRoot(page).locator('main').last();
    await navigateSidebar(page, 'Software Licenses');
    await expectPageHeading(page, 'Software Licenses');
    await expect(main.getByLabel('Product name')).toBeVisible();
    await expect(main.getByLabel('Total seats')).toBeVisible();
    await expect(main.getByRole('columnheader', { name: 'Product' })).toBeVisible();
    await expect(main.getByRole('columnheader', { name: 'Seats' })).toBeVisible();
  });

  test('Inventory shows scan controls and table columns', async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Inventory');
    await expectPageHeading(page, 'Inventory');
    await expect(appRoot(page).getByLabel('Scan label')).toBeVisible();
    await expect(appRoot(page).getByRole('checkbox', { name: 'Asset found' })).toBeVisible();
    await expect(appRoot(page).getByRole('button', { name: 'Record scan' })).toBeDisabled();
  });

  test('Maintenance shows maintenance records or empty state', async () => {
    const page = suite!.page;
    const main = appRoot(page).locator('main').last();
    await navigateSidebar(page, 'Maintenance');
    await expectPageHeading(page, 'Maintenance');
    await expect(main.getByText(/maintenance|scheduled|technician/i).first()).toBeVisible();
  });
});
