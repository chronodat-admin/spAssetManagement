import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  appRoot,
  bootstrapApp,
  expectPageHeading,
  navigateSidebar
} from '../helpers/app';

const outDir = path.join('docs', 'user-guide', 'images');

async function capture(pageName: string, page: Parameters<typeof appRoot>[0]): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });
  await appRoot(page).screenshot({
    path: path.join(outDir, pageName),
    animations: 'disabled'
  });
}

const describeScreenshots = process.env.PLAYWRIGHT_BASE_URL ? test.describe : test.describe.skip;

describeScreenshots('User guide screenshots', () => {
  test('captures primary app pages', async ({ page }) => {
    await bootstrapApp(page);

    await navigateSidebar(page, 'Dashboard');
    await expectPageHeading(page, 'Dashboard');
    await capture('01-dashboard.png', page);

    await navigateSidebar(page, 'All Assets');
    await expectPageHeading(page, 'All Assets');
    await capture('02-all-assets.png', page);

    await navigateSidebar(page, 'Reports');
    await expectPageHeading(page, 'Reports');
    await capture('08-report-builder.png', page);

    await navigateSidebar(page, 'Settings');
    await expectPageHeading(page, 'Settings');
    await capture('09-settings-general.png', page);
  });
});
