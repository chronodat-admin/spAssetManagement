import { expect, test, type Locator, type Page } from '@playwright/test';
import { DEFAULT_NAVIGATION_ARIA_LABEL } from '../../src/constants/spfxComponents';

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

export async function skipIfSetupRequired(page: Page): Promise<void> {
  const setupButton = page.getByRole('button', { name: 'Complete Setup' });
  if (await setupButton.isVisible().catch(() => false)) {
    test.skip(true, 'Complete site setup before running E2E tests.');
  }
}

export async function bootstrapApp(page: Page): Promise<void> {
  await gotoApp(page);
  await waitForApp(page);
  await skipIfSetupRequired(page);
}

export function sidebarNav(page: Page): Locator {
  return appRoot(page).getByRole('complementary', { name: DEFAULT_NAVIGATION_ARIA_LABEL });
}

export async function navigateSidebar(page: Page, label: string): Promise<void> {
  await sidebarNav(page).getByRole('button', { name: label, exact: true }).click();
}

export async function expectPageHeading(page: Page, heading: string | RegExp): Promise<void> {
  await expect(appRoot(page).getByRole('heading', { name: heading })).toBeVisible({
    timeout: 60_000
  });
}
