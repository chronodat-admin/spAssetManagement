import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { appRoot, gotoApp, waitForApp } from './helpers/app';

const authFile = path.join('e2e', '.auth', 'user.json');
const authTimeout = Number(process.env.PLAYWRIGHT_AUTH_TIMEOUT_MS || 5 * 60_000);

test('authenticate against SharePoint-hosted app', async ({ page }) => {
  await gotoApp(page);

  await expect
    .poll(
      async () => {
        await waitForApp(page).catch(() => undefined);
        return await appRoot(page).isVisible().catch(() => false);
      },
      {
        timeout: authTimeout,
        message: 'Sign in to Microsoft 365 in the headed browser to create e2e/.auth/user.json.'
      }
    )
    .toBe(true);

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
