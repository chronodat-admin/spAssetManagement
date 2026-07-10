import type { AssetRoleName } from '../services/RoleService';

import type { AppPage } from '../models/IAssetApp';

import type { IRolePermissionRow } from '../lib/permissions/checkRolePermission';

import { checkAnyRolePermission } from '../lib/permissions/checkRolePermission';

import { pageRequiresPermission } from './pageResources';



export interface IAppPermissions {

  roles: AssetRoleName[];

  isAdmin: boolean;

  isAssetManager: boolean;

  isUser: boolean;

  isReadOnly: boolean;

  canAccessSettings: boolean;

  canManageAssets: boolean;

  canAssignAssets: boolean;

  canManageLookups: boolean;

  canManageRequests: boolean;

  canSubmitRequests: boolean;

  canViewAllAssets: boolean;

  canDeleteAssets: boolean;

  canRunBulkOps: boolean;

  canRunIntuneSync: boolean;

  canRunReminders: boolean;

}



export function resolvePermissions(roles: AssetRoleName[], isAppAdministrator: boolean): IAppPermissions {

  const effectiveRoles = [...roles];

  if (isAppAdministrator && !effectiveRoles.includes('Admin')) {

    effectiveRoles.push('Admin');

  }



  const isAdmin = effectiveRoles.includes('Admin');

  const isAssetManager = effectiveRoles.includes('AssetManager');

  const isReadOnly = effectiveRoles.length > 0 && effectiveRoles.every((r) => r === 'ReadOnly');

  const isUser =

    effectiveRoles.includes('User') ||

    (effectiveRoles.length === 0 && !isAdmin && !isAssetManager && !isReadOnly);



  return {

    roles: effectiveRoles,

    isAdmin,

    isAssetManager,

    isUser,

    isReadOnly,

    canAccessSettings: isAdmin || isAppAdministrator,

    canManageAssets: isAdmin || isAssetManager,

    canAssignAssets: isAdmin || isAssetManager,

    canManageLookups: isAdmin || isAssetManager,

    canManageRequests: isAdmin || isAssetManager,

    canSubmitRequests: isAdmin || isAssetManager || isUser,

    canViewAllAssets: isAdmin || isAssetManager || isUser,

    canDeleteAssets: isAdmin || isAssetManager,

    canRunBulkOps: isAdmin || isAssetManager,

    canRunIntuneSync: isAdmin || isAssetManager,

    canRunReminders: isAdmin || isAppAdministrator

  };

}



/** Map list-backed permission rules onto legacy permission flags for existing UI checks. */

export function applyPermissionRules(

  roles: AssetRoleName[],

  isAppAdministrator: boolean,

  can: (resource: string, action: string) => boolean

): IAppPermissions {

  const base = resolvePermissions(roles, isAppAdministrator);

  return {

    ...base,

    canManageAssets: can('assets', 'edit'),

    canAssignAssets: can('assignments', 'assign'),

    canManageLookups: can('lookups', 'edit'),

    canManageRequests: can('requests', 'manage'),

    canSubmitRequests: can('requests', 'submit'),

    canViewAllAssets: can('assets', 'view'),

    canDeleteAssets: can('assets', 'delete'),

    canRunBulkOps: can('assignments', 'bulk'),

    canRunIntuneSync: can('intune_sync', 'sync'),

    canRunReminders: can('reminders', 'run')

  };

}



const MANAGER_PAGES: AppPage[] = [

  'allAssets',

  'available',

  'inRepair',

  'retired',

  'deletedAssets',

  'assignAsset',

  'returnAsset',

  'bulkAssign',

  'bulkReturn',

  'bookAsset',

  'bookingDetails',

  'software',

  'inventory',

  'maintenance',

  'manageRequests',

  'scanAsset',

  'reports',

  'depreciation',

  'auditLog',

  'categories',

  'subCategories',

  'vendors',

  'locations',

  'projects',

  'settings'

];



const USER_PAGES: AppPage[] = [

  'dashboard',

  'assignedToMe',

  'requestAsset',

  'myRequests',

  'bookAsset',

  'bookingDetails',

  'scanAsset'

];



const READ_ONLY_PAGES: AppPage[] = [

  'dashboard',

  'assignedToMe',

  'allAssets',

  'available',

  'reports',

  'bookingDetails',

  'myRequests'

];



function canAccessPageLegacy(page: AppPage, permissions: IAppPermissions): boolean {

  if (page === 'settings') {

    return permissions.canAccessSettings;

  }

  if (permissions.isAdmin || permissions.isAssetManager) {

    return MANAGER_PAGES.includes(page) || page === 'dashboard' || page === 'assignedToMe';

  }

  if (permissions.isReadOnly) {

    return READ_ONLY_PAGES.includes(page);

  }

  return USER_PAGES.includes(page);

}



export function canAccessPage(

  page: AppPage,

  permissions: IAppPermissions,

  permissionRows?: IRolePermissionRow[]

): boolean {

  if (permissionRows && permissionRows.length > 0) {

    if (page === 'settings') {

      return permissions.canAccessSettings && checkAnyRolePermission(permissionRows, permissions.roles, 'settings', 'view');

    }

    const { resource, action } = pageRequiresPermission(page);

    return checkAnyRolePermission(permissionRows, permissions.roles, resource, action);

  }

  return canAccessPageLegacy(page, permissions);

}



export function getDefaultPageForPermissions(permissions: IAppPermissions): AppPage {

  if (permissions.isReadOnly || permissions.isUser) {

    return 'assignedToMe';

  }

  return 'dashboard';

}

