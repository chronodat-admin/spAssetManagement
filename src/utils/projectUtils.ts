import { ILookupItem } from '../models/IAssetApp';

export function filterProjectsByBusiness(
  projects: ILookupItem[],
  businessId: string
): ILookupItem[] {
  if (!businessId) {
    return [];
  }

  return projects.filter((item) => String(item.BusinessId || '') === businessId);
}

export function isProjectValidForBusiness(
  projects: ILookupItem[],
  projectId: string,
  businessId: string
): boolean {
  if (!projectId) {
    return true;
  }
  if (!businessId) {
    return false;
  }

  return projects.some(
    (item) => String(item.Id) === projectId && String(item.BusinessId || '') === businessId
  );
}
