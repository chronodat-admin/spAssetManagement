import { test, expect } from '@playwright/test';
import { appRoot, bootstrapApp, expectPageHeading, navigateSettingsTab, navigateSidebar } from './helpers/app';
import { createSharedPage, disposeSharedPage, type SharedPageSuite } from './helpers/sharedPage';

const SETTINGS_TABS: Array<{ label: string; heading: string; assertion: string | RegExp }> = [
  { label: 'General', heading: 'General', assertion: 'App display name' },
  { label: 'Appearance', heading: 'Appearance', assertion: /color|theme|navigation/i },
  { label: 'Dashboard', heading: 'Dashboard', assertion: 'Dashboard name' },
  { label: 'Forms', heading: 'Forms', assertion: 'AM_Assets' },
  { label: 'Form Templates', heading: 'Form Templates', assertion: /template/i },
  { label: 'Asset Status', heading: 'Asset Status', assertion: /status/i },
  { label: 'Subscription', heading: 'Subscription', assertion: /trial|subscription/i },
  { label: 'App Administrators', heading: 'App Administrators', assertion: 'App Administrators' },
  { label: 'Roles & Permissions', heading: 'Roles & Permissions', assertion: /User Roles|Role Permissions/ },
  { label: 'Language', heading: 'Language', assertion: /language/i },
  { label: 'Intune Sync', heading: 'Intune Sync', assertion: /Intune/i },
  { label: 'Bulk Import', heading: 'Bulk Import', assertion: /import/i },
  { label: 'Reminders', heading: 'Reminders', assertion: /reminder|warranty|license/i },
  { label: 'Dropdown Options', heading: 'Dropdown Options', assertion: /depreciation|dropdown/i },
  { label: 'Numbering', heading: 'Numbering', assertion: /prefix|numbering/i },
  { label: 'Tags', heading: 'Tags', assertion: 'Add Tag' },
  { label: 'Email Integration', heading: 'Email Integration', assertion: 'Email delivery mode' },
  { label: 'Notification Workflows', heading: 'Notification Workflows', assertion: /notification|asset created/i },
  { label: 'Workflow Rules', heading: 'Workflow Rules', assertion: /rule/i },
  { label: 'Email Templates', heading: 'Email Templates', assertion: /template/i },
  { label: 'Scheduled Reports', heading: 'Scheduled Reports', assertion: /report/i },
  { label: 'Audit Log', heading: 'Audit Log', assertion: /audit/i },
  { label: 'Asset Categories', heading: 'Asset Categories', assertion: /categor/i },
  { label: 'Sub-Categories', heading: 'Sub-Categories', assertion: /sub-categor/i }
];

test.describe('Settings tabs', () => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Set PLAYWRIGHT_BASE_URL to run E2E tests.');
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
      const root = appRoot(page);
      await navigateSettingsTab(page, tab.label);
      await expect(root.getByRole('heading', { name: tab.heading, level: 2 })).toBeVisible();
      await expect(root.getByText(tab.assertion)).toBeVisible();
    });
  }
});
