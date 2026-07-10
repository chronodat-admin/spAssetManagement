import type { IAsset } from '../models/IAsset';

export interface IDepreciationRow {
  asset: IAsset;
  bookValue: number;
  monthsElapsed: number;
}

export interface IDepreciationFilters {
  search: string;
  method: string;
  status: string;
}

export const EMPTY_DEPRECIATION_FILTERS: IDepreciationFilters = {
  search: '',
  method: 'all',
  status: 'all'
};

export function formatDepreciationMethod(method?: string): string {
  switch (method || 'StraightLine') {
    case 'DecliningBalance':
      return 'Declining balance';
    case 'StraightLine':
    default:
      return 'Straight line';
  }
}

export function isFullyDepreciated(row: IDepreciationRow): boolean {
  const salvage = row.asset.AM_SalvageValue || 0;
  const life = row.asset.AM_UsefulLifeMonths || 60;
  return row.bookValue <= salvage + 0.01 || row.monthsElapsed >= life;
}

export function getDepreciationMethodOptions(rows: IDepreciationRow[]): string[] {
  const methods = rows.map((row) => row.asset.AM_DepreciationMethod || 'StraightLine');
  return Array.from(new Set(methods)).sort((a, b) => a.localeCompare(b));
}

export function applyDepreciationFilters(
  rows: IDepreciationRow[],
  filters: IDepreciationFilters
): IDepreciationRow[] {
  const query = filters.search.trim().toLowerCase();

  return rows.filter((row) => {
    if (query) {
      const haystack = [row.asset.Title, row.asset.AM_AssetId, String(row.asset.Id)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (filters.method !== 'all') {
      const method = row.asset.AM_DepreciationMethod || 'StraightLine';
      if (method !== filters.method) {
        return false;
      }
    }

    if (filters.status === 'fullyDepreciated' && !isFullyDepreciated(row)) {
      return false;
    }

    if (filters.status === 'depreciating' && isFullyDepreciated(row)) {
      return false;
    }

    return true;
  });
}

export function hasActiveDepreciationFilters(filters: IDepreciationFilters): boolean {
  return (
    Boolean(filters.search.trim()) || filters.method !== 'all' || filters.status !== 'all'
  );
}
