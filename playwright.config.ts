import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';

const baseURL = process.env.PLAYWRIGHT_BASE_URL;
const authFile = 'e2e/.auth/user.json';
const hasAuth = fs.existsSync(authFile);
const runSetup = !!baseURL && !hasAuth;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 360_000,
  expect: { timeout: 60_000 },
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 120_000
  },
  projects: [
    ...(runSetup
      ? [
          {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
            use: { headless: false }
          }
        ]
      : []),
    {
      name: 'chromium',
      dependencies: runSetup ? ['setup'] : [],
      testIgnore: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        ...(hasAuth || runSetup ? { storageState: authFile } : {})
      }
    }
  ]
});
