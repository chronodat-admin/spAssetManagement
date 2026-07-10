import { test, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  appRoot,
  bootstrapApp,
  expectPageHeading,
  navigateSettingsTab,
  navigateSidebar,
  preparePageForScreenshot,
  waitForDashboardReady
} from '../helpers/app';
import {
  createSharedPage,
  disposeSharedPage,
  GUIDE_CAPTURE_VIEWPORT,
  type SharedPageSuite
} from '../helpers/sharedPage';

const outDir = path.join('docs', 'user-guide', 'images');

type CaptureStep = {
  file: string;
  nav: string;
  heading: string | RegExp;
  caption: string;
};

const CAPTURES: CaptureStep[] = [
  { file: '01-dashboard.png', nav: 'Dashboard', heading: /Asset Management|Dashboard/, caption: 'Dashboard — asset KPIs and charts' },
  { file: '02-all-assets.png', nav: 'All Assets', heading: 'All Assets', caption: 'All Assets register with search and filters' },
  { file: '03-assigned-to-me.png', nav: 'Assigned To Me', heading: 'Assigned To Me', caption: 'Assets assigned to the signed-in user' },
  { file: '04-available-assets.png', nav: 'Available', heading: 'Available Assets', caption: 'Assets available for assignment' },
  { file: '05-assign-asset.png', nav: 'Assign Asset', heading: 'Assign Asset', caption: 'Assign an asset to a person' },
  { file: '06-return-asset.png', nav: 'Return Asset', heading: 'Return Asset', caption: 'Return an assigned asset' },
  { file: '07-book-asset.png', nav: 'Book Asset', heading: 'Book Asset', caption: 'Book an asset for temporary use' },
  { file: '08-request-asset.png', nav: 'Request Asset', heading: 'Request Asset', caption: 'Submit a new asset request' },
  { file: '09-scan-asset.png', nav: 'Scan Asset', heading: 'Scan Asset', caption: 'Scan a barcode or QR label' },
  { file: '10-inventory.png', nav: 'Inventory', heading: 'Inventory', caption: 'Record physical inventory scans' },
  { file: '11-software-licenses.png', nav: 'Software Licenses', heading: 'Software Licenses', caption: 'Track software license seats' },
  { file: '12-maintenance.png', nav: 'Maintenance', heading: 'Maintenance', caption: 'Maintenance records and schedules' },
  { file: '13-reports.png', nav: 'Reports', heading: 'Reports', caption: 'Report Builder — select columns and export' },
  { file: '14-depreciation.png', nav: 'Depreciation', heading: 'Depreciation', caption: 'Depreciation schedules for assets' },
  { file: '15-audit-log.png', nav: 'Audit Log', heading: 'Audit Log', caption: 'Audit trail of create, update, and delete actions' },
  { file: '16-categories.png', nav: 'Categories', heading: 'Categories', caption: 'Asset category lookup list' },
  { file: '17-vendors.png', nav: 'Vendors', heading: 'Vendors', caption: 'Vendor lookup list' },
  { file: '18-locations.png', nav: 'Locations', heading: 'Locations', caption: 'Location lookup list' }
];

const SETTINGS_CAPTURES: Array<{ file: string; tab: string; heading: string; caption: string }> = [
  { file: '19-settings-general.png', tab: 'General', heading: 'General', caption: 'Settings → General — app display name' },
  { file: '20-settings-appearance.png', tab: 'Appearance', heading: 'Appearance', caption: 'Settings → Appearance — theme and colors' },
  { file: '21-settings-forms.png', tab: 'Forms', heading: 'Forms', caption: 'Settings → Forms — configure asset forms' },
  { file: '22-settings-tags.png', tab: 'Tags', heading: 'Tags', caption: 'Settings → Tags — colored asset tags' },
  { file: '23-settings-subscription.png', tab: 'Subscription', heading: 'Subscription', caption: 'Settings → Subscription — trial and licensing' },
  { file: '24-settings-roles.png', tab: 'Roles & Permissions', heading: 'Roles & Permissions', caption: 'Settings → Roles & Permissions' }
];

async function prepareTightCaptureLayout(page: Page): Promise<{ clipHeight: number; hostWidth: number }> {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const host = document.querySelector('.asset-management-webpart-host') as HTMLElement | null;
    host?.scrollIntoView({ block: 'start', inline: 'nearest' });
  });

  return page.evaluate(() => {
    const host = document.querySelector('.asset-management-webpart-host') as HTMLElement | null;
    if (!host) {
      return { clipHeight: 1080, hostWidth: 1920 };
    }

    const resetInlineStyles = (el: HTMLElement | null | undefined) => {
      el?.removeAttribute('style');
    };

    resetInlineStyles(host);
    const outer = host.firstElementChild as HTMLElement | null;
    resetInlineStyles(outer);

    const scrollRoot = host.querySelector('[data-asset-mgmt-scroll-root]') as HTMLElement | null;
    const mainCol = scrollRoot?.parentElement as HTMLElement | null;
    const shellRow = mainCol?.parentElement as HTMLElement | null;
    const sidebarWrap = shellRow?.firstElementChild as HTMLElement | null;
    const pageBody = scrollRoot?.firstElementChild as HTMLElement | null;

    resetInlineStyles(shellRow);
    resetInlineStyles(sidebarWrap);
    resetInlineStyles(mainCol);
    resetInlineStyles(scrollRoot);
    resetInlineStyles(pageBody);

    const collapse = (el: HTMLElement | null | undefined) => {
      if (!el) {
        return;
      }
      el.style.minHeight = '0';
      el.style.height = 'auto';
      el.style.maxHeight = 'none';
      el.style.flex = '0 0 auto';
      el.style.overflow = 'visible';
    };

    collapse(host);
    if (outer) {
      collapse(outer);
      outer.style.setProperty('--asset-mgmt-available-height', 'auto');
    }
    if (shellRow) {
      shellRow.style.alignItems = 'flex-start';
      collapse(shellRow);
    }
    collapse(sidebarWrap);
    collapse(mainCol);
    collapse(scrollRoot);
    collapse(pageBody);

    void host.offsetHeight;
    const hostTop = host.getBoundingClientRect().top;
    let deepest = 0;

    const accentBar = outer?.firstElementChild as HTMLElement | null;
    if (accentBar) {
      deepest = Math.max(deepest, accentBar.getBoundingClientRect().bottom - hostTop);
    }

    const footer = scrollRoot?.querySelector('footer') as HTMLElement | null;
    if (pageBody) {
      const isDashboard = Boolean(
        pageBody.querySelector('table[aria-label="Latest assets"]') ||
          pageBody.textContent?.includes('Total Assets')
      );

      if (isDashboard) {
        Array.from(pageBody.children).forEach((child) => {
          const rect = (child as HTMLElement).getBoundingClientRect();
          if (rect.height > 2) {
            deepest = Math.max(deepest, rect.bottom - hostTop);
          }
        });
      } else {
        const card = pageBody.firstElementChild as HTMLElement | null;
        if (card) {
          card.style.height = 'auto';
          card.style.minHeight = '0';
          card.style.flex = '0 0 auto';
        }

        const contentTargets = [
          pageBody.querySelector('table'),
          pageBody.querySelector('form'),
          pageBody.querySelector('[role="table"]'),
          card
        ].filter(Boolean) as HTMLElement[];

        for (const target of contentTargets) {
          const rect = target.getBoundingClientRect();
          if (rect.height > 2) {
            deepest = Math.max(deepest, rect.bottom - hostTop);
          }
        }
      }

      if (footer) {
        deepest += footer.offsetHeight + 12;
      }
    } else if (footer) {
      deepest = Math.max(deepest, footer.getBoundingClientRect().bottom - hostTop);
    }

    const tightHeight = Math.max(Math.ceil(deepest + 8), 320);
    host.style.height = `${tightHeight}px`;
    host.style.overflow = 'hidden';

    return {
      clipHeight: tightHeight,
      hostWidth: Math.max(host.getBoundingClientRect().width, 1280)
    };
  });
}

async function capture(pageName: string, page: Page): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });
  const root = appRoot(page);

  await page.setViewportSize({
    width: GUIDE_CAPTURE_VIEWPORT.width,
    height: GUIDE_CAPTURE_VIEWPORT.height
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await root.scrollIntoViewIfNeeded();

  const bounds = await prepareTightCaptureLayout(page);
  const maxViewportHeight = 8000;
  await page.setViewportSize({
    width: GUIDE_CAPTURE_VIEWPORT.width,
    height: Math.min(maxViewportHeight, bounds.clipHeight + 48)
  });
  await page.evaluate((height) => {
    window.scrollTo(0, 0);
    const host = document.querySelector('.asset-management-webpart-host') as HTMLElement | null;
    if (host) {
      host.style.height = `${height}px`;
      host.style.overflow = 'hidden';
      host.scrollIntoView({ block: 'start', inline: 'nearest' });
    }
  }, bounds.clipHeight);
  await page.waitForTimeout(300);

  const hostBox = await root.boundingBox();
  if (!hostBox) {
    throw new Error('Could not measure app root for screenshot.');
  }

  await page.screenshot({
    path: path.join(outDir, pageName),
    animations: 'disabled',
    clip: {
      x: hostBox.x,
      y: hostBox.y,
      width: hostBox.width,
      height: bounds.clipHeight
    }
  });
}

test.describe('User guide screenshots', () => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Set PLAYWRIGHT_BASE_URL to run E2E tests.');
  test.describe.configure({ mode: 'serial' });

  let suite: SharedPageSuite | undefined;

  test.beforeAll(async ({ browser }) => {
    suite = await createSharedPage(browser);
    await bootstrapApp(suite.page);
    await navigateSidebar(suite.page, 'Dashboard');
    await expectPageHeading(suite.page, /Asset Management|Dashboard/);
    await waitForDashboardReady(suite.page);
  });

  test.afterAll(async () => {
    await disposeSharedPage(suite);
    suite = undefined;
  });

  for (const step of CAPTURES) {
    test(`capture ${step.file}`, async () => {
      const page = suite!.page;
      await navigateSidebar(page, step.nav);
      await expectPageHeading(page, step.heading);
      if (step.nav === 'Dashboard') {
        await waitForDashboardReady(page);
      } else {
        await preparePageForScreenshot(page);
      }
      await capture(step.file, page);
    });
  }

  for (const step of SETTINGS_CAPTURES) {
    test(`capture ${step.file}`, async () => {
      const page = suite!.page;
      const root = appRoot(page);
      await navigateSettingsTab(page, step.tab);
      await root.getByRole('heading', { name: step.heading, level: 2 }).waitFor({ state: 'visible', timeout: 60_000 });
      await preparePageForScreenshot(page);
      await capture(step.file, page);
    });
  }
});
