import { test } from '@playwright/test';
import { bootstrapApp, expectPageHeading, navigateSidebar } from './helpers/app';
import { createSharedPage, disposeSharedPage, type SharedPageSuite } from './helpers/sharedPage';

const describeE2e = process.env.PLAYWRIGHT_BASE_URL ? test.describe : test.describe.skip;

const NAV_PAGES: Array<{ label: string; heading: string | RegExp }> = [
  { label: 'Dashboard', heading: 'Dashboard' },
  { label: 'All Assets', heading: 'All Assets' },
  { label: 'Available', heading: 'Available Assets' },
  { label: 'Assign Asset', heading: 'Assign Asset' },
  { label: 'Return Asset', heading: 'Return Asset' },
  { label: 'Book Asset', heading: 'Book Asset' },
  { label: 'Booking Details', heading: 'Booking Details' },
  { label: 'Software Licenses', heading: 'Software Licenses' },
  { label: 'Inventory', heading: 'Inventory' },
  { label: 'Reports', heading: 'Reports' },
  { label: 'Depreciation', heading: 'Depreciation' },
  { label: 'Audit Log', heading: 'Audit Log' },
  { label: 'Categories', heading: 'Categories' },
  { label: 'Vendors', heading: 'Vendors' },
  { label: 'Locations', heading: 'Locations' },
  { label: 'Projects', heading: 'Projects' }
];

describeE2e('Sidebar navigation', () => {
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
