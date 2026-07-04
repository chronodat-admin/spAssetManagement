import type { Browser, Page } from '@playwright/test';

export interface SharedPageSuite {
  page: Page;
  context: Awaited<ReturnType<Browser['newContext']>>;
}

export async function createSharedPage(browser: Browser): Promise<SharedPageSuite> {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { page, context };
}

export async function disposeSharedPage(suite: SharedPageSuite | undefined): Promise<void> {
  if (!suite) return;
  await suite.page.close();
  await suite.context.close();
}
