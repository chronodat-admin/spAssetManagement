import type { IDashboardFilters } from './dashboardAnalytics';

const STORAGE_PREFIX = 'asset-mgmt-portfolio-filters-v1';

export const DEFAULT_PORTFOLIO_FILTERS: IDashboardFilters = {
  businessId: 'all',
  projectId: 'all'
};

function storageKey(webUrl: string): string {
  return `${STORAGE_PREFIX}:${webUrl.trim().toLowerCase()}`;
}

function normalizePortfolioFilters(value: Partial<IDashboardFilters> | undefined): IDashboardFilters {
  const businessId =
    typeof value?.businessId === 'string' && value.businessId.trim()
      ? value.businessId.trim()
      : 'all';
  const projectId =
    typeof value?.projectId === 'string' && value.projectId.trim()
      ? value.projectId.trim()
      : 'all';

  return {
    businessId,
    projectId: businessId === 'all' ? 'all' : projectId
  };
}

export function loadPortfolioFilters(webUrl: string): IDashboardFilters {
  if (!webUrl || typeof sessionStorage === 'undefined') {
    return DEFAULT_PORTFOLIO_FILTERS;
  }

  try {
    const raw = sessionStorage.getItem(storageKey(webUrl));
    if (!raw) {
      return DEFAULT_PORTFOLIO_FILTERS;
    }
    return normalizePortfolioFilters(JSON.parse(raw) as Partial<IDashboardFilters>);
  } catch {
    return DEFAULT_PORTFOLIO_FILTERS;
  }
}

export function savePortfolioFilters(webUrl: string, filters: IDashboardFilters): void {
  if (!webUrl || typeof sessionStorage === 'undefined') {
    return;
  }

  try {
    sessionStorage.setItem(storageKey(webUrl), JSON.stringify(normalizePortfolioFilters(filters)));
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function clearPortfolioFilters(webUrl: string): void {
  if (!webUrl || typeof sessionStorage === 'undefined') {
    return;
  }

  try {
    sessionStorage.removeItem(storageKey(webUrl));
  } catch {
    /* ignore */
  }
}
