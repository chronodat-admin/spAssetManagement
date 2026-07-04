import { IAppSettings } from '../models/IAssetApp';
import { DEFAULT_APP_TITLE, resolveAppDisplayName } from '../constants/spfxComponents';
import { IDashboardFilters } from './dashboardAnalytics';

export function isSettingEnabled(value?: string, defaultEnabled = true): boolean {
  if (!value) {
    return defaultEnabled;
  }
  return value.toLowerCase() !== 'no';
}

export function getDashboardLabel(settings?: IAppSettings): string {
  const custom = settings?.DashboardName?.trim();
  if (custom) {
    return custom;
  }
  return resolveAppDisplayName(settings?.Title, DEFAULT_APP_TITLE);
}

export function isDashboardDynamicNamingEnabled(settings?: IAppSettings): boolean {
  return isSettingEnabled(settings?.DashboardDynamicNaming, true);
}

export function isDashboardHoverEnabled(settings?: IAppSettings): boolean {
  return isSettingEnabled(settings?.DashboardHoverEnabled, true);
}

export function isDashboardFinancialExposureEnabled(settings?: IAppSettings): boolean {
  return isSettingEnabled(settings?.DashboardFinExpEnabled, true);
}

const FINANCIAL_EXPOSURE_DISMISS_KEY = 'asset-mgmt-financial-exposure-dismissed';
const FINANCIAL_EXPOSURE_MINIMIZED_KEY = 'asset-mgmt-financial-exposure-minimized';

export function isFinancialExposureDismissed(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    return sessionStorage.getItem(FINANCIAL_EXPOSURE_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissFinancialExposure(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(FINANCIAL_EXPOSURE_DISMISS_KEY, '1');
  } catch {
    // Ignore storage failures (private browsing, etc.)
  }
}

export function isFinancialExposureMinimized(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    return sessionStorage.getItem(FINANCIAL_EXPOSURE_MINIMIZED_KEY) === '1';
  } catch {
    return false;
  }
}

export function setFinancialExposureMinimized(minimized: boolean): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    if (minimized) {
      sessionStorage.setItem(FINANCIAL_EXPOSURE_MINIMIZED_KEY, '1');
    } else {
      sessionStorage.removeItem(FINANCIAL_EXPOSURE_MINIMIZED_KEY);
    }
  } catch {
    // Ignore storage failures (private browsing, etc.)
  }
}

export function getDashboardTitle(
  settings: IAppSettings | undefined,
  filters: IDashboardFilters,
  businesses: Array<{ Id: number; Title: string }>,
  projects: Array<{ Id: number; Title: string; BusinessId?: number | string }>
): string {
  const label = getDashboardLabel(settings);
  if (!isDashboardDynamicNamingEnabled(settings)) {
    return label;
  }

  const business =
    filters.businessId !== 'all'
      ? businesses.find((item) => String(item.Id) === filters.businessId)
      : undefined;
  const project =
    filters.projectId !== 'all'
      ? projects.find((item) => String(item.Id) === filters.projectId)
      : undefined;

  if (filters.businessId === 'all' && filters.projectId === 'all') {
    return label;
  }
  if (filters.businessId !== 'all' && filters.projectId === 'all') {
    return `${business?.Title || 'Business'} ${label}`;
  }
  if (filters.businessId !== 'all' && filters.projectId !== 'all') {
    return `${business?.Title || 'Business'} — ${project?.Title || 'Project'} ${label}`;
  }
  return label;
}

export function getDashboardSubtitle(
  settings: IAppSettings | undefined,
  filters: IDashboardFilters,
  businesses: Array<{ Id: number; Title: string }>,
  projects: Array<{ Id: number; Title: string; BusinessId?: number | string }>
): string {
  const defaultSubtitle = 'Overview of assets, status, and assignments across your organization.';
  if (!isDashboardDynamicNamingEnabled(settings)) {
    return defaultSubtitle;
  }

  const business =
    filters.businessId !== 'all'
      ? businesses.find((item) => String(item.Id) === filters.businessId)
      : undefined;
  const project =
    filters.projectId !== 'all'
      ? projects.find((item) => String(item.Id) === filters.projectId)
      : undefined;

  if (filters.businessId === 'all' && filters.projectId === 'all') {
    return defaultSubtitle;
  }
  if (filters.businessId !== 'all' && filters.projectId === 'all') {
    return `Showing assets for ${business?.Title || 'the selected business'}.`;
  }
  if (filters.businessId !== 'all' && filters.projectId !== 'all') {
    return `Showing assets for ${project?.Title || 'the selected project'} in ${business?.Title || 'the selected business'}.`;
  }
  return defaultSubtitle;
}

export const COLOR_SCHEME_OPTIONS = [
  'Blue',
  'Green',
  'Purple',
  'Teal',
  'Indigo',
  'Orange',
  'Rose',
  'Slate',
  'Custom'
] as const;

export type ColorSchemeOption = (typeof COLOR_SCHEME_OPTIONS)[number];
