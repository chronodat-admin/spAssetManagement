import { test, expect } from '@playwright/test';
import { appRoot, bootstrapApp, expectPageHeading, navigateSidebar } from './helpers/app';
import { createSharedPage, disposeSharedPage, type SharedPageSuite } from './helpers/sharedPage';

const describeE2e = process.env.PLAYWRIGHT_BASE_URL ? test.describe : test.describe.skip;

const SETTINGS_TABS = [
  { label: 'General', assertion: 'App display name' },
  { label: 'Dashboard', assertion: 'Dashboard name' },
  { label: 'Numbering', assertion: 'Asset ID prefix' },
  { label: 'Email Integration', assertion: 'Email delivery mode' },
  { label: 'Notification Workflows', assertion: 'Asset lifecycle notifications' },
  { label: 'Asset Categories', assertion: 'Asset Categories' },
  { label: 'App Administrators', assertion: 'App Administrators' }
];

describeE2e('Settings tabs', () => {
  test.describe.configure({ mode: 'serial' });

  let suite: SharedPageSuite | undefined;

  test.beforeAll(async ({ browser }) => {
    suite = await createSharedPage(browser);
    await bootstrapApp(suite.page);
    await navigateSidebar(suite.page, 'Settings');
    await expectPageHeading(suite.page, 'Settings');
  });

  test.afterAll(async () => {
    await disposeSharedPage(suite);
    suite = undefined;
  });

  for (const tab of SETTINGS_TABS) {
    test(`opens ${tab.label}`, async () => {
      const page = suite!.page;
      await appRoot(page).getByRole('button', { name: tab.label, exact: true }).click();
      await expect(appRoot(page).getByRole('heading', { name: tab.label })).toBeVisible();
      await expect(appRoot(page).getByText(tab.assertion, { exact: false })).toBeVisible();
    });
  }
});
