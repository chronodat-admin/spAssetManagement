import { test, expect } from '@playwright/test';
import {
  bootstrapApp,
  expectPageHeading,
  navigateSidebar,
  sidebarNav,
  appRoot
} from './helpers/app';
import { createSharedPage, disposeSharedPage, type SharedPageSuite } from './helpers/sharedPage';

const describeE2e = process.env.PLAYWRIGHT_BASE_URL ? test.describe : test.describe.skip;

describeE2e('Smoke', () => {
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

  test('loads dashboard', { tag: '@smoke' }, async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Dashboard');
    await expectPageHeading(page, 'Dashboard');
  });

  test('opens All Assets list', { tag: '@smoke' }, async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'All Assets');
    await expectPageHeading(page, 'All Assets');
  });

  test('opens Assign Asset', { tag: '@smoke' }, async () => {
    const page = suite!.page;
    await navigateSidebar(page, 'Assign Asset');
    await expectPageHeading(page, 'Assign Asset');
  });

  test('sidebar navigation is present', { tag: '@smoke' }, async () => {
    const page = suite!.page;
    await expect(sidebarNav(page)).toBeVisible();
    await expect(appRoot(page).getByRole('button', { name: 'Dashboard', exact: true })).toBeVisible();
  });
});
