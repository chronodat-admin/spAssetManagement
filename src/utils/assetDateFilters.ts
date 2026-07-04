import { IAsset } from '../models/IAsset';

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function isWarrantyExpiringSoon(asset: IAsset, withinDays = 90, today = new Date()): boolean {
  const expiry = parseDate(asset.AM_WarrantyExpiry);
  if (!expiry) return false;
  const limit = new Date(today);
  limit.setDate(limit.getDate() + withinDays);
  return expiry >= today && expiry <= limit;
}

/** @deprecated Use isWarrantyExpiringSoon */
export const isOverdueRisk = isWarrantyExpiringSoon;
export const isDueTodayRisk = isWarrantyExpiringSoon;
export const isDueThisWeekRisk = isWarrantyExpiringSoon;
