/**
 * One-off auth using the local Edge profile (existing M365 sign-in).
 * Run: PLAYWRIGHT_BASE_URL=<url> PLAYWRIGHT_USE_EDGE_PROFILE=1 npm run test:e2e:setup
 */
import { chromium, expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { appRoot, gotoApp, waitForApp } from './helpers/app';

const authFile = path.join('e2e', '.auth', 'user.json');
const authTimeout = Number(process.env.PLAYWRIGHT_AUTH_TIMEOUT_MS || 5 * 60_000);
const useEdgeProfile = process.env.PLAYWRIGHT_USE_EDGE_PROFILE === '1';

test('authenticate against SharePoint-hosted app', async ({ page }) => {
  if (useEdgeProfile) {
    console.log(
      '[auth] Using Edge profile — close all Edge windows first. Waiting for Asset Management to load...'
    );
  } else {
    console.log(
      '[auth] A browser window opened. Sign in to Microsoft 365 within the timeout to save e2e/.auth/user.json.'
    );
  }

  if (useEdgeProfile) {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const edgeUserData = path.join(localAppData, 'Microsoft', 'Edge', 'User Data');
    const context = await chromium.launchPersistentContext(edgeUserData, {
      channel: 'msedge',
      headless: false,
      args: ['--profile-directory=Default'],
      ignoreHTTPSErrors: true
    });
    const edgePage = context.pages()[0] ?? (await context.newPage());
    try {
      await gotoApp(edgePage);
      await expect
        .poll(
          async () => {
            await waitForApp(edgePage).catch(() => undefined);
            return await appRoot(edgePage).isVisible().catch(() => false);
          },
          {
            timeout: authTimeout,
            message:
              'Edge profile could not reach the app. Close Edge, sign in to M365 in Edge, then retry.'
          }
        )
        .toBe(true);

      fs.mkdirSync(path.dirname(authFile), { recursive: true });
      await context.storageState({ path: authFile });
    } finally {
      await context.close();
    }
    return;
  }

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
