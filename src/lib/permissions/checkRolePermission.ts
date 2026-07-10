import type { AssetRoleName } from '../../services/RoleService';

export interface IRolePermissionRow {
  role: AssetRoleName;
  resource: string;
  action: string;
  isAllowed: boolean;
}

/** Check whether a role may perform an action on a resource. Deny wins over allow. */
export function checkRolePermission(
  permissions: IRolePermissionRow[],
  role: AssetRoleName,
  resource: string,
  action: string
): boolean {
  const normalizedResource = resource.trim().toLowerCase();
  const normalizedAction = action.trim().toLowerCase();

  const matches = permissions.filter(
    (row) =>
      row.role === role &&
      row.resource.trim().toLowerCase() === normalizedResource &&
      row.action.trim().toLowerCase() === normalizedAction
  );

  if (matches.length === 0) {
    return role === 'Admin';
  }

  if (matches.some((row) => row.isAllowed === false)) {
    return false;
  }

  return matches.some((row) => row.isAllowed === true);
}

/** Union across assigned roles — allowed if any role grants the permission. */
export function checkAnyRolePermission(
  permissions: IRolePermissionRow[],
  roles: AssetRoleName[],
  resource: string,
  action: string
): boolean {
  if (roles.length === 0) {
    return checkRolePermission(permissions, 'User', resource, action);
  }
  return roles.some((role) => checkRolePermission(permissions, role, resource, action));
}
