import * as React from 'react';

import { RoleService, type AssetRoleName } from '../services/RoleService';

import {

  checkAnyRolePermission,

  type IRolePermissionRow

} from '../lib/permissions/checkRolePermission';

import {

  applyPermissionRules,

  resolvePermissions,

  type IAppPermissions

} from '../utils/rbac';

import { pageRequiresPermission } from '../utils/pageResources';

import type { AppPage } from '../models/IAssetApp';



export interface IUseAppRolesResult {

  loading: boolean;

  roles: AssetRoleName[];

  isAppAdministrator: boolean;

  permissions: IAppPermissions;

  permissionRows: IRolePermissionRow[];

  can: (resource: string, action: string) => boolean;

  canViewPage: (page: AppPage) => boolean;

  refresh: () => Promise<void>;

}



export function useAppRoles(

  roleService: RoleService,

  userId: number | undefined,

  enabled = true

): IUseAppRolesResult {

  const [loading, setLoading] = React.useState(true);

  const [roles, setRoles] = React.useState<AssetRoleName[]>([]);

  const [isAppAdministrator, setIsAppAdministrator] = React.useState(false);

  const [permissionRows, setPermissionRows] = React.useState<IRolePermissionRow[]>([]);



  const refresh = React.useCallback(async (): Promise<void> => {

    if (!enabled || !userId) {

      setRoles([]);

      setIsAppAdministrator(false);

      setPermissionRows([]);

      setLoading(false);

      return;

    }

    setLoading(true);

    try {

      const [roleNames, isAdmin, rows] = await Promise.all([

        roleService.getUserRoleNames(userId),

        roleService.isAppAdministrator(userId),

        roleService.getRolePermissions()

      ]);

      setRoles(roleNames);

      setIsAppAdministrator(isAdmin);

      setPermissionRows(

        rows.map((row) => ({

          role: row.role,

          resource: row.resource,

          action: row.action,

          isAllowed: row.isAllowed

        }))

      );

    } catch {

      setRoles([]);

      setIsAppAdministrator(false);

      setPermissionRows([]);

    } finally {

      setLoading(false);

    }

  }, [enabled, roleService, userId]);



  React.useEffect(() => {

    void refresh();

  }, [refresh]);



  const can = React.useCallback(

    (resource: string, action: string): boolean => {

      if (permissionRows.length === 0) {

        return false;

      }

      const effectiveRoles = [...roles];

      if (isAppAdministrator && !effectiveRoles.includes('Admin')) {

        effectiveRoles.push('Admin');

      }

      return checkAnyRolePermission(permissionRows, effectiveRoles, resource, action);

    },

    [isAppAdministrator, permissionRows, roles]

  );



  const permissions = React.useMemo(

    () =>

      permissionRows.length > 0

        ? applyPermissionRules(roles, isAppAdministrator, can)

        : resolvePermissions(roles, isAppAdministrator),

    [can, isAppAdministrator, permissionRows.length, roles]

  );



  const canViewPage = React.useCallback(

    (page: AppPage): boolean => {

      if (permissionRows.length === 0) {

        return false;

      }

      if (page === 'settings') {

        return permissions.canAccessSettings && can('settings', 'view');

      }

      const { resource, action } = pageRequiresPermission(page);

      return can(resource, action);

    },

    [can, permissionRows.length, permissions.canAccessSettings]

  );



  return {

    loading,

    roles,

    isAppAdministrator,

    permissions,

    permissionRows,

    can,

    canViewPage,

    refresh

  };

}

