import { test, expect } from '@playwright/test';
import { bootstrapApp, expectPageHeading, navigateSidebar, appRoot } from './helpers/app';
import { createSharedPage, disposeSharedPage, type SharedPageSuite } from './helpers/sharedPage';

const NAV_PAGES: Array<{ label: string; heading: string | RegExp }> = [
  { label: 'Dashboard', heading: /Asset Management|Dashboard/ },
  { label: 'All Assets', heading: 'All Assets' },
  { label: 'Assigned To Me', heading: 'Assigned To Me' },
  { label: 'Available', heading: 'Available Assets' },
  { label: 'In Repair', heading: 'In Repair' },
  { label: 'Retired', heading: 'Retired Assets' },
  { label: 'Deleted Assets', heading: 'Deleted Assets' },
  { label: 'Assign Asset', heading: 'Assign Asset' },
  { label: 'Bulk Assign', heading: 'Bulk Assign' },
  { label: 'Return Asset', heading: 'Return Asset' },
  { label: 'Bulk Return', heading: 'Bulk Return' },
  { label: 'Book Asset', heading: 'Book Asset' },
  { label: 'Booking Details', heading: 'Booking Details' },
  { label: 'Request Asset', heading: 'Request Asset' },
  { label: 'My Requests', heading: 'My Requests' },
  { label: 'Manage Requests', heading: 'Manage Requests' },
  { label: 'Scan Asset', heading: 'Scan Asset' },
  { label: 'Software Licenses', heading: 'Software Licenses' },
  { label: 'Inventory', heading: 'Inventory' },
  { label: 'Maintenance', heading: 'Maintenance' },
  { label: 'Reports', heading: 'Reports' },
  { label: 'Depreciation', heading: 'Depreciation' },
  { label: 'Audit Log', heading: 'Audit Log' },
  { label: 'Categories', heading: 'Categories' },
  { label: 'Sub-Categories', heading: 'Sub-Categories' },
  { label: 'Vendors', heading: 'Vendors' },
  { label: 'Locations', heading: 'Locations' },
  { label: 'Projects', heading: 'Projects' },
  { label: 'Settings', heading: 'Settings' }
];

test.describe('Sidebar navigation', () => {
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

  for (const navPage of NAV_PAGES) {
    test(`opens ${navPage.label}`, async () => {
      const page = suite!.page;
      await navigateSidebar(page, navPage.label);
      await expectPageHeading(page, navPage.heading);
    });
  }
});

test.describe('Asset list interactions', () => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Set PLAYWRIGHT_BASE_URL to run E2E tests.');
  test.describe.configure({ mode: 'serial' });

  let suite: SharedPageSuite | undefined;

  test.beforeAll(async ({ browser }) => {
    suite = await createSharedPage(browser);
    await bootstrapApp(suite.page);
    await navigateSidebar(suite.page, 'All Assets');
    await expectPageHeading(suite.page, 'All Assets');
  });

  test.afterAll(async () => {
    await disposeSharedPage(suite);
    suite = undefined;
  });

  test('shows search and create affordances', async () => {
    const page = suite!.page;
    const root = appRoot(page);
    await expect(root.getByPlaceholder(/search/i)).toBeVisible();
    await expect(root.getByRole('button', { name: /create|new asset|add asset/i })).toBeVisible();
  });
});
