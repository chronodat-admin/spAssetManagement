import type { Browser, Page } from '@playwright/test';
import fs from 'fs';

const authFile = 'e2e/.auth/user.json';

export const GUIDE_CAPTURE_VIEWPORT = { width: 1920, height: 1080 };

export interface SharedPageSuite {
  page: Page;
  context: Awaited<ReturnType<Browser['newContext']>>;
}

export async function createSharedPage(
  browser: Browser,
  viewport = GUIDE_CAPTURE_VIEWPORT
): Promise<SharedPageSuite> {
  const context = await browser.newContext({
    storageState: fs.existsSync(authFile) ? authFile : undefined,
    viewport
  });
  const page = await context.newPage();
  return { page, context };
}

export async function disposeSharedPage(suite: SharedPageSuite | undefined): Promise<void> {
  if (!suite) return;
  await suite.page.close();
  await suite.context.close();
}
