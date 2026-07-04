import { SPHttpClient } from '@microsoft/sp-http';

import { ADMINISTRATORS_LIST_TITLE, USER_ROLES_LIST_TITLE } from '../models/IListDefinitions';
import type { IAppAdministrator } from '../models/IAsset';
import { SharePointRestService } from './SharePointRestService';

export type AssetRoleName = 'Admin' | 'AssetManager' | 'User' | 'ReadOnly';

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
        'Id,Title,AM_User/Id,AM_User/Title,AM_User/Email',
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
}
