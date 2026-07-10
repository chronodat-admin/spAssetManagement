import { IAsset } from '../models/IAssetApp';

export interface AssetSelectOption {
  value: string;
  label: string;
  searchText: string;
}

export function buildAssetSelectOption(
  asset: IAsset,
  options?: { includeAssignee?: boolean; includeLocation?: boolean }
): AssetSelectOption {
  const id = asset.AM_AssetId || String(asset.Id);
  const location =
    options?.includeLocation !== false ? asset.AM_Location?.Title?.trim() || '' : '';
  const assignee =
    options?.includeAssignee && asset.AM_AssignedTo?.Title
      ? asset.AM_AssignedTo.Title.trim()
      : '';

  let label = `${id} — ${asset.Title}`;
  if (location) {
    label += ` — ${location}`;
  }
  if (assignee) {
    label += ` (${assignee})`;
  }

  const searchText = [
    id,
    asset.Title,
    location,
    assignee,
    asset.AM_SerialNumber,
    asset.AM_Barcode
  ]
    .filter(Boolean)
    .join(' ');

  return {
    value: String(asset.Id),
    label,
    searchText
  };
}

export function buildAssetCheckboxItem(
  asset: IAsset,
  options?: { includeAssignee?: boolean }
): { id: number; label: string; searchText: string } {
  const selectOption = buildAssetSelectOption(asset, {
    includeAssignee: options?.includeAssignee,
    includeLocation: true
  });
  return {
    id: asset.Id,
    label: selectOption.label,
    searchText: selectOption.searchText
  };
}
