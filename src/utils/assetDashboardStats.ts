import type { IAsset } from '../models/IAsset';

export interface IAssetDashboardStats {
  total: number;
  available: number;
  assigned: number;
  inRepair: number;
  warrantyExpiring: number;
  totalValue: number;
}

export function resolveAssetStatusTitle(asset: IAsset): string {
  if (asset.Riskstatus) {
    return asset.Riskstatus;
  }
  if (typeof asset.AM_Status === 'string') {
    return asset.AM_Status;
  }
  return asset.AM_Status?.Title || 'Open';
}

export function getTotalAssetValue(assets: IAsset[]): number {
  return assets.reduce((sum, asset) => sum + (asset.AM_Cost || 0), 0);
}

function isWarrantyExpiringSoon(asset: IAsset, withinDays = 90): boolean {
  if (!asset.AM_WarrantyExpiry) return false;
  const expiry = new Date(asset.AM_WarrantyExpiry);
  if (Number.isNaN(expiry.getTime())) return false;
  const now = new Date();
  const limit = new Date(now);
  limit.setDate(limit.getDate() + withinDays);
  return expiry >= now && expiry <= limit;
}

export function getAssetDashboardStats(assets: IAsset[]): IAssetDashboardStats {
  const active = assets.filter((asset) => !asset.AM_IsDeleted);
  let available = 0;
  let assigned = 0;
  let inRepair = 0;
  let warrantyExpiring = 0;

  active.forEach((asset) => {
    const status = resolveAssetStatusTitle(asset);
    if (status === 'Available') available += 1;
    if (status === 'Assigned' || asset.AM_AssignedTo) assigned += 1;
    if (status === 'In Repair') inRepair += 1;
    if (isWarrantyExpiringSoon(asset)) warrantyExpiring += 1;
  });

  return {
    total: active.length,
    available,
    assigned,
    inRepair,
    warrantyExpiring,
    totalValue: getTotalAssetValue(active)
  };
}

export function countByStatus(assets: IAsset[], statusName: string): number {
  return assets.filter((asset) => resolveAssetStatusTitle(asset) === statusName).length;
}
