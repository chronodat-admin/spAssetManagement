import type { IAsset } from '../models/IAsset';

export interface ICurrentUserRef {
  id?: number;
  email?: string;
  displayName?: string;
}

/** True when the asset is assigned to the given user (by id, email, or display name). */
export function isAssignedToUser(asset: IAsset, user: ICurrentUserRef): boolean {
  const assignee = asset.AM_AssignedTo;
  if (assignee) {
    if (user.id && assignee.Id === user.id) {
      return true;
    }
    if (
      user.email &&
      assignee.Email &&
      assignee.Email.toLowerCase() === user.email.toLowerCase()
    ) {
      return true;
    }
    if (user.displayName && assignee.Title === user.displayName) {
      return true;
    }
  }

  if (user.id && asset.AssignedTo?.some((owner) => owner.Id === user.id)) {
    return true;
  }

  return false;
}

export function validateAssignInput(assetId: number, assigneeUserId: number): string | undefined {
  if (!assetId || assetId <= 0) {
    return 'Select an asset.';
  }
  if (!assigneeUserId || assigneeUserId <= 0) {
    return 'Select an assignee.';
  }
  return undefined;
}

export function validateReturnInput(assetId: number): string | undefined {
  if (!assetId || assetId <= 0) {
    return 'Select an asset to return.';
  }
  return undefined;
}

export function isReturnableAsset(asset: IAsset): boolean {
  if (asset.AM_IsDeleted) {
    return false;
  }
  const status = typeof asset.AM_Status === 'string' ? asset.AM_Status : asset.AM_Status?.Title;
  return status === 'Assigned' || Boolean(asset.AM_AssignedTo);
}

export function resolveStatusAfterReturn(): string {
  return 'Available';
}

export function validateBookInput(assetId: number, assigneeUserId: number): string | undefined {
  if (!assetId || assetId <= 0) {
    return 'Select an asset.';
  }
  if (!assigneeUserId || assigneeUserId <= 0) {
    return 'Select a requester.';
  }
  return undefined;
}

export function isBookableAsset(asset: IAsset): boolean {
  return !asset.AM_IsDeleted;
}
