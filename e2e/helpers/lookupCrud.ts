import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  appRoot,
  bootstrapApp,
  expectPageHeading,
  navigateSidebar
} from './app';
import {
  closeDetailPanel,
  confirmDialog,
  detailPanel,
  fillLabeledInput,
  uniqueName
} from './crud';
import { createSharedPage, disposeSharedPage, type SharedPageSuite } from './sharedPage';

export interface LookupCrudConfig {
  suiteName: string;
  navLabel: string;
  pageHeading: string;
  tableName: string;
  addPanelTitle: string;
  viewPanelTitle: string;
  editPanelTitle: string;
  deleteDialogTitle: string;
  namePrefix: string;
  /** Extra panel interactions before save on create (e.g. required lookups). */
  onCreate?: (panel: Locator) => Promise<void>;
  /** Skip suite when the deployed web part is older than this version (e.g. pending app catalog upload). */
  requireMinVersion?: string;
}

function parseDeployedVersion(text: string): string | undefined {
  const match = text.match(/v(\d+\.\d+\.\d+\.\d+)/);
  return match?.[1];
}

function isVersionAtLeast(current: string, minimum: string): boolean {
  const currentParts = current.split('.').map(Number);
  const minimumParts = minimum.split('.').map(Number);
  for (let index = 0; index < 4; index += 1) {
    const left = currentParts[index] ?? 0;
    const right = minimumParts[index] ?? 0;
    if (left > right) {
      return true;
    }
    if (left < right) {
      return false;
    }
  }
  return true;
}

async function refreshLookupList(page: Page, navLabel: string, pageHeading: string): Promise<void> {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await bootstrapApp(page);
  await navigateSidebar(page, navLabel);
  await expectPageHeading(page, pageHeading);
}

export function defineLookupCrudSuite(config: LookupCrudConfig): void {
  test.describe(config.suiteName, () => {
    test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Set PLAYWRIGHT_BASE_URL to run E2E tests.');
    test.describe.configure({ mode: 'serial' });

    let suite: SharedPageSuite | undefined;
    let itemTitle = '';
    let updatedTitle = '';

    test.beforeAll(async ({ browser }) => {
      suite = await createSharedPage(browser);
      await bootstrapApp(suite.page);

      if (config.requireMinVersion) {
        const versionText =
          (await appRoot(suite.page).locator('text=/v\\d+\\.\\d+\\.\\d+\\.\\d+/').first().textContent()) || '';
        const deployedVersion = parseDeployedVersion(versionText);
        if (!deployedVersion || !isVersionAtLeast(deployedVersion, config.requireMinVersion)) {
          test.skip(
            true,
            `Requires app v${config.requireMinVersion}+ on target site (found ${deployedVersion || 'unknown'}). Upload sharepoint/solution/asset-management.sppkg to the app catalog first.`
          );
        }
      }

      itemTitle = uniqueName(config.namePrefix);
      updatedTitle = `${itemTitle} Updated`;
    });

    test.afterAll(async () => {
      await disposeSharedPage(suite);
      suite = undefined;
    });

    test(`creates ${config.suiteName.toLowerCase()}`, { tag: '@crud' }, async () => {
      const page = suite!.page;
      const root = appRoot(page);

      await navigateSidebar(page, config.navLabel);
      await expectPageHeading(page, config.pageHeading);
      await root.getByRole('button', { name: 'Add new' }).click();

      const panel = detailPanel(page, config.addPanelTitle);
      await expect(panel).toBeVisible();
      await fillLabeledInput(panel, 'Title', itemTitle);
      if (config.onCreate) {
        await config.onCreate(panel);
      }
      await panel.getByRole('button', { name: 'Save' }).click();

      await expect(panel).toBeHidden({ timeout: 120_000 });
      await refreshLookupList(page, config.navLabel, config.pageHeading);
      const refreshedRoot = appRoot(page);
      await expect(
        refreshedRoot.getByRole('table', { name: config.tableName }).getByRole('button', { name: itemTitle })
      ).toBeVisible({ timeout: 60_000 });
    });

    test(`reads ${config.suiteName.toLowerCase()} in view mode`, { tag: '@crud' }, async () => {
      const page = suite!.page;
      const root = appRoot(page);
      const table = root.getByRole('table', { name: config.tableName });

      await navigateSidebar(page, config.navLabel);
      await table.getByRole('button', { name: itemTitle }).click();

      const panel = detailPanel(page, config.viewPanelTitle);
      await expect(panel).toBeVisible();
      await expect(panel.getByText(itemTitle)).toBeVisible();
      await closeDetailPanel(panel);
    });

    test(`updates ${config.suiteName.toLowerCase()}`, { tag: '@crud' }, async () => {
      const page = suite!.page;
      const root = appRoot(page);
      const table = root.getByRole('table', { name: config.tableName });

      await navigateSidebar(page, config.navLabel);
      const row = table.getByRole('row').filter({ hasText: itemTitle });
      await row.getByRole('button', { name: 'Edit' }).click();

      const panel = detailPanel(page, config.editPanelTitle);
      await expect(panel).toBeVisible();
      await fillLabeledInput(panel, 'Title', updatedTitle);
      await panel.getByRole('button', { name: 'Save' }).click();

      await expect(panel).toBeHidden({ timeout: 120_000 });
      await refreshLookupList(page, config.navLabel, config.pageHeading);
      const refreshedRoot = appRoot(page);
      await expect(
        refreshedRoot.getByRole('table', { name: config.tableName }).getByRole('button', { name: updatedTitle })
      ).toBeVisible({ timeout: 60_000 });
      itemTitle = updatedTitle;
    });

    test(`deletes ${config.suiteName.toLowerCase()}`, { tag: '@crud' }, async () => {
      const page = suite!.page;
      const root = appRoot(page);
      const table = root.getByRole('table', { name: config.tableName });

      await navigateSidebar(page, config.navLabel);
      const row = table.getByRole('row').filter({ hasText: itemTitle });
      await row.getByRole('button', { name: 'Delete' }).click();

      await confirmDialog(page, config.deleteDialogTitle);
      await expect(table.getByRole('button', { name: itemTitle })).toBeHidden({ timeout: 60_000 });
    });
  });
}
