import type { AssetRoleName } from '../services/RoleService';

export interface IRolePermission {
  id: number;
  title: string;
  role: AssetRoleName;
  resource: string;
  action: string;
  isAllowed: boolean;
}
