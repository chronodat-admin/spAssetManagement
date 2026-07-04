import { IAsset } from '../models/IAsset';
import type { IWorkflowSettings } from '../models/IWorkflowSettings';

export interface IAssetListFilters {
  search: string;
  status: string;
  categoryId: string;
  locationId: string;
  projectId: string;
}

export const EMPTY_ASSET_LIST_FILTERS: IAssetListFilters = {
  search: '',
  status: '',
  categoryId: 'all',
  locationId: 'all',
  projectId: 'all'
};

function statusLabel(asset: IAsset): string {
  if (!asset.AM_Status) return '';
  return typeof asset.AM_Status === 'string' ? asset.AM_Status : asset.AM_Status.Title || '';
}

export function getAssetStatusFilterOptions(
  assets: IAsset[],
  _workflowSettings?: IWorkflowSettings
): string[] {
  const fromData = assets.map((asset) => statusLabel(asset)).filter(Boolean);
  return Array.from(new Set(fromData)).sort((a, b) => a.localeCompare(b));
}

/** @deprecated Use getAssetStatusFilterOptions */
export const getRiskStatusFilterOptions = getAssetStatusFilterOptions;

export function applyAssetListFilters(assets: IAsset[], filters: IAssetListFilters): IAsset[] {
  const query = filters.search.trim().toLowerCase();

  return assets.filter((asset) => {
    if (query) {
      const haystack = [asset.AM_AssetId, asset.Title, asset.AM_SerialNumber, asset.AM_Barcode, asset.AM_Notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (filters.status && statusLabel(asset) !== filters.status) {
      return false;
    }

    if (filters.categoryId !== 'all') {
      if (String(asset.AM_Category?.Id ?? '') !== filters.categoryId) {
        return false;
      }
    }

    if (filters.locationId !== 'all') {
      if (String(asset.AM_Location?.Id ?? '') !== filters.locationId) {
        return false;
      }
    }

    if (filters.projectId !== 'all') {
      if (String(asset.AM_Project?.Id ?? '') !== filters.projectId) {
        return false;
      }
    }

    return true;
  });
}

export function hasActiveAssetListFilters(filters: IAssetListFilters): boolean {
  return (
    Boolean(filters.search.trim()) ||
    Boolean(filters.status) ||
    filters.categoryId !== 'all' ||
    filters.locationId !== 'all' ||
    filters.projectId !== 'all'
  );
}
