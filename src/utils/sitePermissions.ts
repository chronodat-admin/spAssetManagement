export interface ISiteOwnerAccessResult {
  isSiteOwner: boolean;
  isSiteAdmin: boolean;
  isOwnerGroupMember: boolean;
  hasFullControl: boolean;
  ownerGroupTitle?: string;
  elevatedToOwner: boolean;
  message?: string;
}

/** SharePoint Full Control — high word 432 (same as list EffectiveBasePermissions). */
export function hasFullControlPermissions(high: number, _low: number): boolean {
  return high >= 432;
}

export interface IAppAdministratorAccessResult {
  isAppAdministrator: boolean;
  message?: string;
}

export const SITE_OWNER_REQUIRED_MESSAGE =
  'Only site owners with Full Control on this site can run setup. Ask a site owner to grant you Full Control, or to complete setup for you.';

export const APP_ADMINISTRATOR_REQUIRED_MESSAGE =
  'Only app administrators can open Settings. Ask an existing app administrator to add you from Settings → App Administrators.';

/** @deprecated Use SITE_OWNER_REQUIRED_MESSAGE — setup no longer auto-adds users to Owners. */
export const SITE_OWNER_ELEVATION_FAILED_MESSAGE = SITE_OWNER_REQUIRED_MESSAGE;

export const SETUP_FULL_CONTROL_REQUIRED_MESSAGE = SITE_OWNER_REQUIRED_MESSAGE;
