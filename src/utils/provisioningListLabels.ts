import {
  ADMINISTRATORS_LIST_TITLE,
  ASSETS_LIST_TITLE,
  ASSET_STATUSES_LIST_TITLE,
  ASSET_TYPES_LIST_TITLE,
  ASSIGNMENTS_LIST_TITLE,
  AUDIT_LOG_LIST_TITLE,
  CATEGORIES_LIST_TITLE,
  CUSTOM_COLUMN_DEFS_LIST_TITLE,
  INVENTORY_LIST_TITLE,
  ASSET_REQUESTS_LIST_TITLE,
  LICENSES_LIST_TITLE,
  LOCATIONS_LIST_TITLE,
  MAINTENANCE_LIST_TITLE,
  MODEL_NUMBERS_LIST_TITLE,
  PROJECTS_LIST_TITLE,
  ROLE_PERMISSIONS_LIST_TITLE,
  ROLES_LIST_TITLE,
  SETTINGS_LIST_TITLE,
  SOFTWARE_LICENSES_LIST_TITLE,
  SUB_CATEGORIES_LIST_TITLE,
  USER_ROLES_LIST_TITLE,
  VENDORS_LIST_TITLE
} from '../models/IListDefinitions.js';

/** Friendly labels for provisioning UI — internal SharePoint list titles are unchanged. */
const PROVISIONING_LIST_DISPLAY_LABELS: Record<string, string> = {
  [CATEGORIES_LIST_TITLE]: 'Categories',
  [SUB_CATEGORIES_LIST_TITLE]: 'Sub-categories',
  [ASSET_TYPES_LIST_TITLE]: 'Asset types',
  [ASSET_STATUSES_LIST_TITLE]: 'Statuses',
  [VENDORS_LIST_TITLE]: 'Vendors',
  [MODEL_NUMBERS_LIST_TITLE]: 'Models',
  [LOCATIONS_LIST_TITLE]: 'Locations',
  [PROJECTS_LIST_TITLE]: 'Projects',
  [ROLES_LIST_TITLE]: 'Roles',
  [USER_ROLES_LIST_TITLE]: 'User roles',
  [ROLE_PERMISSIONS_LIST_TITLE]: 'Role Permissions',
  [AUDIT_LOG_LIST_TITLE]: 'Activity log',
  [CUSTOM_COLUMN_DEFS_LIST_TITLE]: 'Form templates',
  [SETTINGS_LIST_TITLE]: 'App settings',
  [ADMINISTRATORS_LIST_TITLE]: 'Administrators',
  [LICENSES_LIST_TITLE]: 'License records',
  [ASSETS_LIST_TITLE]: 'Assets',
  [ASSIGNMENTS_LIST_TITLE]: 'Assignments',
  [SOFTWARE_LICENSES_LIST_TITLE]: 'Software licenses',
  [MAINTENANCE_LIST_TITLE]: 'Maintenance',
  [INVENTORY_LIST_TITLE]: 'Inventory',
  [ASSET_REQUESTS_LIST_TITLE]: 'Asset requests'
};

/** Maps a SharePoint list title to a user-facing label in setup/status views. */
export function getProvisioningListDisplayLabel(listTitle: string): string {
  const trimmed = listTitle.trim();
  const incompleteMatch = /^(.*)\s+\(incomplete\)$/.exec(trimmed);
  if (incompleteMatch) {
    return `${getProvisioningListDisplayLabel(incompleteMatch[1])} (incomplete)`;
  }

  return PROVISIONING_LIST_DISPLAY_LABELS[trimmed] ?? trimmed;
}

/** User-facing label for in-progress setup detail (never exposes internal list titles). */
export function getListProgressLabel(listTitle: string): string {
  return getProvisioningListDisplayLabel(listTitle);
}
