import type { ILookupItem } from '../models/IAsset';

export interface ILookupListFilters {
  search: string;
  businessId: string;
  categoryId: string;
  status: string;
}

export const EMPTY_LOOKUP_LIST_FILTERS: ILookupListFilters = {
  search: '',
  businessId: 'all',
  categoryId: 'all',
  status: 'all'
};

export function applyLookupListFilters(
  items: ILookupItem[],
  filters: ILookupListFilters,
  options?: {
    includeRating?: boolean;
    businessField?: boolean;
    categoryField?: boolean;
    statusField?: boolean;
    criticalityField?: boolean;
  }
): ILookupItem[] {
  const query = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    if (query) {
      const parts = [
        item.Title,
        item.Code,
        item.Rating,
        item.ProjectStatus,
        item.ProjectType,
        item.Industry,
        item.GeographicRegion,
        item.BusinessCriticality,
        item.BusinessCode,
        item.Priority
      ]
        .filter(Boolean)
        .map((value) => String(value));
      const haystack = parts.join(' ').toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (options?.businessField && filters.businessId !== 'all') {
      if (String(item.BusinessId ?? item.Business?.Id ?? '') !== filters.businessId) {
        return false;
      }
    }

    if (options?.categoryField && filters.categoryId !== 'all') {
      if (String(item.ParentCategoryId ?? item.ParentCategory?.Id ?? '') !== filters.categoryId) {
        return false;
      }
    }

    if (options?.statusField && filters.status !== 'all') {
      if ((item.ProjectStatus || '') !== filters.status) {
        return false;
      }
    }

    if (options?.criticalityField && filters.status !== 'all') {
      if ((item.BusinessCriticality || '') !== filters.status) {
        return false;
      }
    }

    return true;
  });
}

export function hasActiveLookupListFilters(
  filters: ILookupListFilters,
  options?: { businessField?: boolean; categoryField?: boolean; statusField?: boolean; criticalityField?: boolean }
): boolean {
  return (
    Boolean(filters.search.trim()) ||
    Boolean(options?.businessField && filters.businessId !== 'all') ||
    Boolean(options?.categoryField && filters.categoryId !== 'all') ||
    Boolean(options?.statusField && filters.status !== 'all') ||
    Boolean(options?.criticalityField && filters.status !== 'all')
  );
}
