import { test, expect } from '@playwright/test';
import {
  appRoot,
  bootstrapApp,
  expectPageHeading,
  navigateSidebar
} from './helpers/app';
import {
  closeDetailPanel,
  confirmDialog,
  detailPanel,
  fillLabeledInput,
  selectLabeledDropdown,
  uniqueName
} from './helpers/crud';
import { defineLookupCrudSuite } from './helpers/lookupCrud';
import { createSharedPage, disposeSharedPage, type SharedPageSuite } from './helpers/sharedPage';

test.describe('Asset CRUD', () => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Set PLAYWRIGHT_BASE_URL to run E2E tests.');
  test.describe.configure({ mode: 'serial' });

  let suite: SharedPageSuite | undefined;
  let assetTitle = '';
  let updatedTitle = '';

  test.beforeAll(async ({ browser }) => {
    suite = await createSharedPage(browser);
    await bootstrapApp(suite.page);
    assetTitle = uniqueName('E2E Asset');
    updatedTitle = `${assetTitle} Updated`;
  });

  test.afterAll(async () => {
    await disposeSharedPage(suite);
    suite = undefined;
  });

  test('creates an asset', { tag: '@crud' }, async () => {
    const page = suite!.page;
    const root = appRoot(page);

    await navigateSidebar(page, 'All Assets');
    await expectPageHeading(page, 'All Assets');

    await root.getByRole('button', { name: 'Create new asset' }).click();
    const panel = detailPanel(page, 'Create new asset');
    await expect(panel).toBeVisible();

    await fillLabeledInput(panel, 'Asset Name', assetTitle);
    await selectLabeledDropdown(panel, 'Status', 'Available');
    await panel.getByRole('button', { name: 'Save asset' }).click();

    await expect(panel).toBeHidden({ timeout: 120_000 });
    await expect(root.getByRole('table', { name: 'All Assets' }).getByRole('button', { name: assetTitle })).toBeVisible({
      timeout: 60_000
    });
  });

  test('reads an asset in view mode', { tag: '@crud' }, async () => {
    const page = suite!.page;
    const root = appRoot(page);
    const table = root.getByRole('table', { name: 'All Assets' });

    await navigateSidebar(page, 'All Assets');
    await table.getByRole('button', { name: assetTitle }).click();

    const panel = detailPanel(page, /View asset/);
    await expect(panel).toBeVisible();
    await expect(panel.getByText(assetTitle)).toBeVisible();
    await closeDetailPanel(panel);
  });

  test('updates an asset', { tag: '@crud' }, async () => {
    const page = suite!.page;
    const root = appRoot(page);
    const table = root.getByRole('table', { name: 'All Assets' });

    await navigateSidebar(page, 'All Assets');
    const row = table.getByRole('row').filter({ hasText: assetTitle });
    await row.getByRole('button', { name: 'Edit' }).click();

    const panel = detailPanel(page, /Edit asset/);
    await expect(panel).toBeVisible();
    await fillLabeledInput(panel, 'Asset Name', updatedTitle);
    await panel.getByRole('button', { name: 'Save asset' }).click();

    await expect(panel).toBeHidden({ timeout: 120_000 });
    await expect(table.getByRole('button', { name: updatedTitle })).toBeVisible({ timeout: 60_000 });
    assetTitle = updatedTitle;
  });

  test('deletes an asset', { tag: '@crud' }, async () => {
    const page = suite!.page;
    const root = appRoot(page);
    const table = root.getByRole('table', { name: 'All Assets' });

    await navigateSidebar(page, 'All Assets');
    const row = table.getByRole('row').filter({ hasText: assetTitle });
    await row.getByRole('button', { name: 'Delete' }).click();

    await confirmDialog(page, 'Delete asset');
    await expect(table.getByRole('button', { name: assetTitle })).toBeHidden({ timeout: 60_000 });
  });
});

defineLookupCrudSuite({
  suiteName: 'Category lookup CRUD',
  navLabel: 'Categories',
  pageHeading: 'Categories',
  tableName: 'Categories',
  addPanelTitle: 'Add Categorie',
  viewPanelTitle: 'View Categorie',
  editPanelTitle: 'Edit Categorie',
  deleteDialogTitle: 'Delete item',
  namePrefix: 'E2E Category'
});

defineLookupCrudSuite({
  suiteName: 'Sub-Category lookup CRUD',
  navLabel: 'Sub-Categories',
  pageHeading: 'Sub-Categories',
  tableName: 'Asset sub-categories',
  addPanelTitle: 'Add sub-category',
  viewPanelTitle: 'View sub-category',
  editPanelTitle: 'Edit sub-category',
  deleteDialogTitle: 'Delete sub-category',
  namePrefix: 'E2E SubCategory',
  onCreate: async (panel) => {
    await selectLabeledDropdown(panel, 'Parent Category', 'IT Hardware');
  }
});

defineLookupCrudSuite({
  suiteName: 'Vendor lookup CRUD',
  navLabel: 'Vendors',
  pageHeading: 'Vendors',
  tableName: 'Vendors',
  addPanelTitle: 'Add Vendor',
  viewPanelTitle: 'View Vendor',
  editPanelTitle: 'Edit Vendor',
  deleteDialogTitle: 'Delete item',
  namePrefix: 'E2E Vendor'
});

defineLookupCrudSuite({
  suiteName: 'Location lookup CRUD',
  navLabel: 'Locations',
  pageHeading: 'Locations',
  tableName: 'Locations',
  addPanelTitle: 'Add Location',
  viewPanelTitle: 'View Location',
  editPanelTitle: 'Edit Location',
  deleteDialogTitle: 'Delete item',
  namePrefix: 'E2E Location'
});

defineLookupCrudSuite({
  suiteName: 'Project lookup CRUD',
  navLabel: 'Projects',
  pageHeading: 'Projects',
  tableName: 'Projects',
  addPanelTitle: 'New Project',
  viewPanelTitle: 'View Project',
  editPanelTitle: 'Edit Project',
  deleteDialogTitle: 'Delete project',
  namePrefix: 'E2E Project',
  requireMinVersion: '1.0.0.30'
});
