import { expect, type Locator, type Page } from '@playwright/test';

const DEFAULT_NAVIGATION_ARIA_LABEL = 'Asset Management navigation';

export function requireBaseUrl(): string | undefined {
  return process.env.PLAYWRIGHT_BASE_URL;
}

export function appRoot(page: Page): Locator {
  return page.locator('.asset-management-webpart-host');
}

export async function gotoApp(page: Page): Promise<void> {
  const baseURL = requireBaseUrl();
  if (!baseURL) {
    throw new Error('PLAYWRIGHT_BASE_URL is required.');
  }
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
}

export async function acceptDebugScriptsIfPrompted(page: Page): Promise<void> {
  const loadDebug = page.getByRole('button', { name: 'Load debug scripts', exact: true });
  if (await loadDebug.isVisible().catch(() => false)) {
    await loadDebug.click({ force: true });
  }
}

export async function waitForApp(page: Page): Promise<void> {
  await acceptDebugScriptsIfPrompted(page);
  await page
    .locator('#asset-mgmt-fullscreen-loader')
    .waitFor({ state: 'detached', timeout: 120_000 })
    .catch(() => undefined);
  await expect(appRoot(page)).toBeVisible({ timeout: 120_000 });
}

export async function isSetupRequired(page: Page): Promise<boolean> {
  const setupButton = page.getByRole('button', { name: 'Complete Setup' });
  return setupButton.isVisible().catch(() => false);
}

export async function bootstrapApp(page: Page): Promise<void> {
  await gotoApp(page);
  await waitForApp(page);
  if (await isSetupRequired(page)) {
    throw new Error('Complete site setup before running E2E tests.');
  }
}

export function sidebarNav(page: Page): Locator {
  return appRoot(page).getByRole('complementary', { name: DEFAULT_NAVIGATION_ARIA_LABEL });
}

export async function navigateSidebar(page: Page, label: string): Promise<void> {
  await sidebarNav(page).getByRole('button', { name: label, exact: true }).click();
}

export function settingsAside(page: Page): Locator {
  return appRoot(page).locator('aside').filter({
    has: page.getByRole('button', { name: 'Preferences', exact: true })
  });
}

export async function navigateSettingsTab(page: Page, tab: string): Promise<void> {
  await navigateSidebar(page, 'Settings');
  await expectPageHeading(page, 'Settings');
  await settingsAside(page).getByRole('button', { name: tab, exact: true }).last().click();
}

export async function dismissTrialBannerIfVisible(page: Page): Promise<void> {
  const root = appRoot(page);
  const dismiss = root.getByRole('button', { name: 'Dismiss trial notice' });
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click();
    await dismiss.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => undefined);
  }
}

export async function waitForDashboardReady(page: Page): Promise<void> {
  const root = appRoot(page);
  const content = root.locator('main').last();
  await dismissTrialBannerIfVisible(page);
  await content.getByRole('heading', { name: 'Latest Assets', level: 2 }).waitFor({ state: 'visible', timeout: 90_000 });
  await content
    .getByRole('table', { name: /Latest assets/i })
    .waitFor({ state: 'visible', timeout: 90_000 })
    .catch(() => undefined);

  await expect
    .poll(
      async () => {
        const progressbars = await content.getByRole('progressbar').count();
        const chartLoading = await content.getByText('Loading chart…').isVisible().catch(() => false);
        const skeleton = await root.locator('[class*="Skeleton"]').first().isVisible().catch(() => false);
        return progressbars === 0 && !chartLoading && !skeleton;
      },
      { timeout: 90_000, intervals: [500] }
    )
    .toBe(true);

  await page.waitForTimeout(1000);
}

export async function preparePageForScreenshot(page: Page): Promise<void> {
  const root = appRoot(page);
  await dismissTrialBannerIfVisible(page);
  await page
    .locator('#asset-mgmt-fullscreen-loader')
    .waitFor({ state: 'detached', timeout: 30_000 })
    .catch(() => undefined);
  await expect
    .poll(
      async () => {
        const progressbars = await root.getByRole('progressbar').count();
        const chartLoading = await root.getByText('Loading chart…').isVisible().catch(() => false);
        return progressbars === 0 && !chartLoading;
      },
      { timeout: 30_000, intervals: [250] }
    )
    .toBe(true);
  await page.waitForTimeout(500);
}

export async function expectPageHeading(page: Page, heading: string | RegExp): Promise<void> {
  await expect(appRoot(page).getByRole('heading', { name: heading, level: 1 })).toBeVisible({
    timeout: 60_000
  });
}
