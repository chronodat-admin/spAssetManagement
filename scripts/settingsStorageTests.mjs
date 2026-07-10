import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  dismissFinancialExposure,
  getDashboardLabel,
  getDashboardSubtitle,
  getDashboardTitle,
  isDashboardDynamicNamingEnabled,
  isDashboardFinancialExposureEnabled,
  isDashboardHoverEnabled,
  isFinancialExposureDismissed,
  isFinancialExposureMinimized,
  setFinancialExposureMinimized
} from '../lib/utils/dashboardSettings.js';
import {
  clearPortfolioFilters,
  loadPortfolioFilters,
  savePortfolioFilters
} from '../lib/utils/appFilterStorage.js';
import {
  clearUserThemeMode,
  getSystemPrefersDark,
  isDarkThemeMode,
  loadUserThemeMode,
  resolveEffectiveThemeMode,
  saveUserThemeMode
} from '../lib/utils/themeModeStorage.js';
import {
  clearCachedSubscriptionStatus,
  readCachedSubscriptionStatus,
  SUBSCRIPTION_STATUS_FRESH_MS,
  writeCachedSubscriptionStatus
} from '../lib/utils/subscriptionStatusCache.js';
import {
  isValidHttpUrl,
  normalizeHttpUrl,
  validateOptionalHttpUrl
} from '../lib/utils/urlValidation.js';

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    }
  };
}

describe('dashboard settings and browser storage helpers', () => {
  it('builds dynamic dashboard labels and subtitles from selected filters', () => {
    const settings = { Title: 'Asset Management', DashboardName: 'Fleet Dashboard' };
    const filters = { businessId: '2', projectId: '7' };
    const businesses = [{ Id: 2, Title: 'Facilities' }];
    const projects = [{ Id: 7, Title: 'Refresh', BusinessId: 2 }];

    assert.equal(getDashboardLabel(settings), 'Fleet Dashboard');
    assert.equal(getDashboardTitle(settings, filters, businesses, projects), 'Facilities — Refresh Fleet Dashboard');
    assert.equal(getDashboardSubtitle(settings, filters, businesses, projects), 'Showing assets for Refresh in Facilities.');
    assert.equal(isDashboardDynamicNamingEnabled({ DashboardDynamicNaming: 'No' }), false);
    assert.equal(isDashboardHoverEnabled({ DashboardHoverEnabled: 'No' }), false);
    assert.equal(isDashboardFinancialExposureEnabled({ DashboardFinExpEnabled: 'Yes' }), true);
  });

  it('persists dismiss/minimize and portfolio filter state safely', () => {
    const previousSessionStorage = globalThis.sessionStorage;
    globalThis.sessionStorage = createStorage();
    try {
      assert.equal(isFinancialExposureDismissed(), false);
      dismissFinancialExposure();
      assert.equal(isFinancialExposureDismissed(), true);

      setFinancialExposureMinimized(true);
      assert.equal(isFinancialExposureMinimized(), true);
      setFinancialExposureMinimized(false);
      assert.equal(isFinancialExposureMinimized(), false);

      savePortfolioFilters('HTTPS://Tenant/Sites/Assets ', { businessId: '5', projectId: '10' });
      assert.deepEqual(loadPortfolioFilters('https://tenant/sites/assets'), { businessId: '5', projectId: '10' });
      savePortfolioFilters('https://tenant/sites/assets', { businessId: 'all', projectId: '10' });
      assert.deepEqual(loadPortfolioFilters('https://tenant/sites/assets'), { businessId: 'all', projectId: 'all' });
      clearPortfolioFilters('https://tenant/sites/assets');
      assert.deepEqual(loadPortfolioFilters('https://tenant/sites/assets'), { businessId: 'all', projectId: 'all' });
    } finally {
      globalThis.sessionStorage = previousSessionStorage;
    }
  });
});

describe('theme and subscription caches', () => {
  it('persists theme overrides and resolves effective dark mode', () => {
    const previousLocalStorage = globalThis.localStorage;
    const previousWindow = globalThis.window;
    globalThis.localStorage = createStorage();
    globalThis.window = { matchMedia: () => ({ matches: true }) };
    try {
      saveUserThemeMode('https://tenant/sites/assets', 'dark');
      assert.equal(loadUserThemeMode('HTTPS://TENANT/sites/assets'), 'dark');
      assert.equal(resolveEffectiveThemeMode('system', 'light'), 'light');
      assert.equal(isDarkThemeMode('system', true), true);
      assert.equal(isDarkThemeMode('light', true), false);
      assert.equal(getSystemPrefersDark(), true);
      clearUserThemeMode('https://tenant/sites/assets');
      assert.equal(loadUserThemeMode('https://tenant/sites/assets'), undefined);
    } finally {
      globalThis.localStorage = previousLocalStorage;
      globalThis.window = previousWindow;
    }
  });

  it('reads fresh cached subscription status and clears it by normalized key', () => {
    const previousLocalStorage = globalThis.localStorage;
    const previousNow = Date.now;
    globalThis.localStorage = createStorage();
    Date.now = () => 1_000_000;
    try {
      const status = { hasAccess: true, planName: 'Business', source: 'api' };
      writeCachedSubscriptionStatus('HTTPS://Tenant/Sites/Assets ', 'TENANT-1', 'Asset-Management', status);
      const cached = readCachedSubscriptionStatus('https://tenant/sites/assets', 'tenant-1', 'asset-management');
      assert.equal(cached?.status.hasAccess, true);
      assert.equal(cached?.fresh, true);
      assert.equal(cached?.withinGrace, true);

      Date.now = () => 1_000_000 + SUBSCRIPTION_STATUS_FRESH_MS + 1;
      assert.equal(readCachedSubscriptionStatus('https://tenant/sites/assets', 'tenant-1', 'asset-management')?.fresh, false);
      clearCachedSubscriptionStatus('https://tenant/sites/assets', 'tenant-1', 'asset-management');
      assert.equal(readCachedSubscriptionStatus('https://tenant/sites/assets', 'tenant-1', 'asset-management'), undefined);
    } finally {
      Date.now = previousNow;
      globalThis.localStorage = previousLocalStorage;
    }
  });
});

describe('urlValidation', () => {
  it('accepts only http and https URLs', () => {
    assert.equal(isValidHttpUrl('https://www.chronodat.com'), true);
    assert.equal(isValidHttpUrl('ftp://example.com'), false);
    assert.equal(normalizeHttpUrl(' https://example.com/privacy '), 'https://example.com/privacy');
    assert.equal(normalizeHttpUrl('not-a-url'), undefined);
    assert.equal(validateOptionalHttpUrl('', 'Support URL'), undefined);
    assert.equal(validateOptionalHttpUrl('mailto:support@example.com', 'Support URL'), 'Support URL must be a valid http or https URL.');
  });
});
