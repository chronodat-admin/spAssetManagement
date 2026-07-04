export interface IListPermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

/** SharePoint PermissionKind flags (low 32 bits). */
export const SP_PERMISSION = {
  ViewListItems: 1,
  AddListItems: 2,
  EditListItems: 4,
  DeleteListItems: 8,
  OpenItems: 32
} as const;

export function hasSpPermission(mask: number, flag: number): boolean {
  return (mask & flag) === flag;
}

export function permissionsFromLowMask(mask: number): IListPermissions {
  const canView =
    hasSpPermission(mask, SP_PERMISSION.ViewListItems) &&
    hasSpPermission(mask, SP_PERMISSION.OpenItems);
  const canAdd = hasSpPermission(mask, SP_PERMISSION.AddListItems);
  const canEdit = hasSpPermission(mask, SP_PERMISSION.EditListItems);
  const canDelete = hasSpPermission(mask, SP_PERMISSION.DeleteListItems);

  return { canView, canAdd, canEdit, canDelete };
}

/** Decode SharePoint EffectiveBasePermissions high/low pair without BigInt. */
export function permissionsFromEffectivePermissions(high: number, low: number): IListPermissions {
  if (high >= 432) {
    return FULL_LIST_PERMISSIONS;
  }

  return permissionsFromLowMask(low >>> 0);
}

export const NO_LIST_PERMISSIONS: IListPermissions = {
  canView: false,
  canAdd: false,
  canEdit: false,
  canDelete: false
};

export const FULL_LIST_PERMISSIONS: IListPermissions = {
  canView: true,
  canAdd: true,
  canEdit: true,
  canDelete: true
};

export type ListPanelMode = 'create' | 'edit' | 'view';

export interface IEffectivePermissions {
  high: number;
  low: number;
}
