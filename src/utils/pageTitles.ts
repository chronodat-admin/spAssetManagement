import { AppPage } from '../models/IAssetApp';

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
  bookAsset: 'Reserve an asset for a future period.',
  bookingDetails: 'View and manage asset bookings.',
  software: 'Software license pool and seat assignments.',
  inventory: 'Physical inventory scan results.',
  reports: 'Preset asset and assignment reports.',
  depreciation: 'Depreciation schedules and book values.',
  auditLog: 'Append-only audit trail for all mutations.',
  categories: 'Asset categories and sub-categories.',
  vendors: 'Vendors and suppliers.',
  locations: 'Physical locations.',
  projects: 'Projects linked to assets.',
  settings: 'Configure branding, dashboard, notifications, and lookups.'
};

export function getPageSubtitle(page: AppPage, override?: string): string | undefined {
  return override || PAGE_SUBTITLES[page];
}

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
  bookAsset: 'Book Asset',
  bookingDetails: 'Booking Details',
  software: 'Software Licenses',
  inventory: 'Inventory',
  reports: 'Reports',
  depreciation: 'Depreciation',
  auditLog: 'Audit Log',
  categories: 'Categories',
  vendors: 'Vendors',
  locations: 'Locations',
  projects: 'Projects',
  settings: 'Settings'
};
