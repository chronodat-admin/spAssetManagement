import { SPHttpClient } from '@microsoft/sp-http';

import { ADMINISTRATORS_LIST_TITLE, ROLE_PERMISSIONS_LIST_TITLE, ROLES_LIST_TITLE, USER_ROLES_LIST_TITLE } from '../models/IListDefinitions';
import type { IRolePermission } from '../models/IRolePermission';
import { ASSET_ROLE_CHOICES, type AssetRoleChoice } from '../constants/rolePermissionsSeedData';
import type { IAppAdministrator } from '../models/IAsset';
import { SharePointRestService } from './SharePointRestService';

export type AssetRoleName = AssetRoleChoice;

/** RBAC — Admin, AssetManager, User, ReadOnly. */
export class RoleService {
  private readonly rest: SharePointRestService;

  public constructor(spHttpClient: SPHttpClient, webUrl: string) {
    this.rest = new SharePointRestService(spHttpClient, webUrl);
  }

  public async isAppAdministrator(userId: number): Promise<boolean> {
    const admins = await this.getAdministrators();
    return admins.some(
      (admin) => admin.AM_User?.Id === userId || admin.UserName1?.Id === userId
    );
  }

  public async getAdministrators(): Promise<IAppAdministrator[]> {
    try {
      return await this.rest.getAllItems<IAppAdministrator>(
        ADMINISTRATORS_LIST_TITLE,
        'Id,Title,AM_User/Id,AM_User/Title,AM_User/EMail',
        'AM_User',
        undefined,
        'Title asc'
      );
    } catch {
      return [];
    }
  }

  public async getUserRoleNames(userId: number): Promise<AssetRoleName[]> {
    try {
      const rows = await this.rest.getAllItems<{
        AM_Role?: { Title?: string };
        AM_User?: { Id?: number };
      }>(
        USER_ROLES_LIST_TITLE,
        'Id,AM_User/Id,AM_Role/Title',
        'AM_User,AM_Role',
        `AM_User/Id eq ${userId}`,
        'Id asc'
      );
      return rows
        .map((row) => row.AM_Role?.Title as AssetRoleName | undefined)
        .filter((name): name is AssetRoleName => Boolean(name));
    } catch {
      return [];
    }
  }

  public async getUserRoleAssignments(): Promise<
    Array<{
      Id: number;
      Title: string;
      AM_User?: { Id?: number; Title?: string; EMail?: string };
      AM_Role?: { Id?: number; Title?: string };
    }>
  > {
    try {
      return await this.rest.getAllItems(
        USER_ROLES_LIST_TITLE,
        'Id,Title,AM_User/Id,AM_User/Title,AM_User/EMail,AM_Role/Id,AM_Role/Title',
        'AM_User,AM_Role',
        undefined,
        'Title asc'
      );
    } catch {
      return [];
    }
  }

  public async getRoles(): Promise<Array<{ Id: number; Title: string }>> {
    try {
      return await this.rest.getAllItems(ROLES_LIST_TITLE, 'Id,Title', undefined, undefined, 'Title asc');
    } catch {
      return [];
    }
  }

  public async addUserRole(userId: number, roleId: number): Promise<number> {
    return this.rest.addListItem(USER_ROLES_LIST_TITLE, {
      Title: `Role assignment ${userId}`,
      AM_UserId: userId,
      AM_RoleId: roleId
    });
  }

  public async removeUserRole(assignmentId: number): Promise<void> {
    await this.rest.deleteItem(USER_ROLES_LIST_TITLE, assignmentId);
  }

  public async getRolePermissions(): Promise<IRolePermission[]> {
    try {
      const rows = await this.rest.getAllItems<{
        Id: number;
        Title?: string;
        Role?: string;
        Resource?: string;
        Action?: string;
        IsAllowed?: boolean;
      }>(
        ROLE_PERMISSIONS_LIST_TITLE,
        'Id,Title,Role,Resource,Action,IsAllowed',
        undefined,
        undefined,
        'Title asc'
      );
      return rows
        .filter((row) => row.Role && row.Resource && row.Action)
        .map((row) => ({
          id: row.Id,
          title: row.Title || '',
          role: row.Role as AssetRoleName,
          resource: row.Resource || '',
          action: row.Action || '',
          isAllowed: row.IsAllowed !== false
        }));
    } catch {
      return [];
    }
  }

  public async createRolePermission(input: {
    role: AssetRoleName;
    resource: string;
    action: string;
    isAllowed: boolean;
  }): Promise<number> {
    const resource = input.resource.trim();
    const action = input.action.trim();
    return this.rest.addListItem(ROLE_PERMISSIONS_LIST_TITLE, {
      Title: `${input.role}-${resource}-${action}`.toLowerCase(),
      Role: input.role,
      Resource: resource,
      Action: action,
      IsAllowed: input.isAllowed
    });
  }

  public async updateRolePermission(
    id: number,
    input: { role?: AssetRoleName; resource?: string; action?: string; isAllowed?: boolean }
  ): Promise<void> {
    const payload: Record<string, string | boolean> = {};
    if (input.role !== undefined) {
      payload.Role = input.role;
    }
    if (input.resource !== undefined) {
      payload.Resource = input.resource.trim();
    }
    if (input.action !== undefined) {
      payload.Action = input.action.trim();
    }
    if (input.isAllowed !== undefined) {
      payload.IsAllowed = input.isAllowed;
    }
    await this.rest.updateItem(ROLE_PERMISSIONS_LIST_TITLE, id, payload);
  }

  public async deleteRolePermission(id: number): Promise<void> {
    await this.rest.deleteItem(ROLE_PERMISSIONS_LIST_TITLE, id);
  }

  public static getRoleChoices(): readonly AssetRoleName[] {
    return ASSET_ROLE_CHOICES;
  }
}
