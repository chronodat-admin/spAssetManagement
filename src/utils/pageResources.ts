import type { AppPage } from '../models/IAssetApp';

/** Maps navigation pages to RolePermissions resource keys. */
export const PAGE_RESOURCE_MAP: Record<AppPage, string> = {
  dashboard: 'dashboard',
  allAssets: 'assets',
  assignedToMe: 'assets',
  available: 'assets',
  inRepair: 'assets',
  retired: 'assets',
  deletedAssets: 'assets',
  assignAsset: 'assignments',
  returnAsset: 'assignments',
  bulkAssign: 'assignments',
  bulkReturn: 'assignments',
  bookAsset: 'bookings',
  bookingDetails: 'bookings',
  software: 'software_licenses',
  inventory: 'inventory',
  maintenance: 'maintenance',
  requestAsset: 'requests',
  myRequests: 'requests',
  manageRequests: 'requests',
  scanAsset: 'scan',
  reports: 'reports',
  depreciation: 'depreciation',
  auditLog: 'audit_log',
  categories: 'lookups',
  subCategories: 'lookups',
  vendors: 'lookups',
  locations: 'lookups',
  projects: 'lookups',
  settings: 'settings'
};

export function pageRequiresPermission(page: AppPage): { resource: string; action: string } {
  if (page === 'manageRequests') {
    return { resource: 'requests', action: 'manage' };
  }
  if (page === 'requestAsset') {
    return { resource: 'requests', action: 'submit' };
  }
  if (page === 'assignAsset' || page === 'bulkAssign') {
    return { resource: 'assignments', action: 'assign' };
  }
  if (page === 'returnAsset' || page === 'bulkReturn') {
    return { resource: 'assignments', action: 'return' };
  }
  if (page === 'bookAsset') {
    return { resource: 'bookings', action: 'create' };
  }
  return { resource: PAGE_RESOURCE_MAP[page], action: 'view' };
}
