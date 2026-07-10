import type { AppPage } from '../models/IAssetApp';
import type { TranslateFn } from './pageLabels';
import { getLocalizedPageSubtitle, getLocalizedPageTitle } from './pageLabels';

/** @deprecated Use getLocalizedPageTitle with useTranslation instead. */
export const PAGE_SUBTITLES: Partial<Record<AppPage, string>> = {
  dashboard: 'Overview of assets, assignments, and value across your organization.',
  allAssets: 'Browse and manage every asset in the register.',
  assignedToMe: 'Assets currently assigned to you.',
  available: 'Assets ready to assign.',
  inRepair: 'Assets under maintenance or repair.',
  retired: 'Retired assets kept for historical reference.',
  deletedAssets: 'Soft-deleted assets in the recycle bin.',
  assignAsset: 'Assign an available asset to a user.',
  returnAsset: 'Return an assigned asset to available stock.',
  bulkAssign: 'Assign multiple assets to users in one operation.',
  bulkReturn: 'Return multiple assigned assets at once.',
  bookAsset: 'Reserve an asset for a future period.',
  bookingDetails: 'View and manage asset bookings.',
  software: 'Software license pool and seat assignments.',
  inventory: 'Physical inventory scan results.',
  maintenance: 'Schedule and track preventive and corrective maintenance.',
  requestAsset: 'Submit a request for hardware or equipment.',
  myRequests: 'Track the status of your asset requests.',
  manageRequests: 'Review, approve, and fulfill asset requests.',
  scanAsset: 'Scan barcodes or QR codes to find and update assets.',
  reports: 'Preset asset and assignment reports.',
  depreciation: 'Depreciation schedules and book values.',
  auditLog: 'Append-only audit trail for all mutations.',
  categories: 'Manage asset categories.',
  subCategories: 'Manage sub-categories linked to parent asset categories.',
  vendors: 'Vendors and suppliers.',
  locations: 'Physical locations.',
  projects: 'Projects linked to assets.',
  settings: 'Configure branding, dashboard, notifications, roles, and integrations.'
};

export function getPageSubtitle(
  page: AppPage,
  override?: string,
  t?: TranslateFn
): string | undefined {
  if (override) return override;
  if (t) return getLocalizedPageSubtitle(page, t, PAGE_SUBTITLES[page]);
  return PAGE_SUBTITLES[page];
}

/** @deprecated Use getLocalizedPageTitle with useTranslation instead. */
export const PAGE_TITLES: Record<AppPage, string> = {
  dashboard: 'Dashboard',
  allAssets: 'All Assets',
  assignedToMe: 'Assigned To Me',
  available: 'Available Assets',
  inRepair: 'In Repair',
  retired: 'Retired Assets',
  deletedAssets: 'Deleted Assets',
  assignAsset: 'Assign Asset',
  returnAsset: 'Return Asset',
  bulkAssign: 'Bulk Assign',
  bulkReturn: 'Bulk Return',
  bookAsset: 'Book Asset',
  bookingDetails: 'Booking Details',
  software: 'Software Licenses',
  inventory: 'Inventory',
  maintenance: 'Maintenance',
  requestAsset: 'Request Asset',
  myRequests: 'My Requests',
  manageRequests: 'Manage Requests',
  scanAsset: 'Scan Asset',
  reports: 'Reports',
  depreciation: 'Depreciation',
  auditLog: 'Audit Log',
  categories: 'Categories',
  subCategories: 'Sub-Categories',
  vendors: 'Vendors',
  locations: 'Locations',
  projects: 'Projects',
  settings: 'Settings'
};

export function getPageTitle(page: AppPage, t?: TranslateFn): string {
  if (t) return getLocalizedPageTitle(page, t, PAGE_TITLES[page]);
  return PAGE_TITLES[page];
}
