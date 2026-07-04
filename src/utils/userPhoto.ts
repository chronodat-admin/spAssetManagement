export type UserPhotoSize = 'S' | 'M' | 'L';

/**
 * Origin used to build absolute user-photo URLs. Falls back to a root-relative
 * path when unset. Set once at web part bootstrap from the SharePoint web
 * absolute URL so photos resolve correctly even when the app is hosted in an
 * embedded context (e.g. a Teams tab) where the page origin may differ.
 */
let photoBaseOrigin: string | undefined;

/** Records the SharePoint web absolute URL so photo URLs can be made absolute. */
export function setUserPhotoBaseUrl(webAbsoluteUrl?: string): void {
  if (!webAbsoluteUrl) {
    photoBaseOrigin = undefined;
    return;
  }
  try {
    photoBaseOrigin = new URL(webAbsoluteUrl).origin;
  } catch {
    photoBaseOrigin = undefined;
  }
}

/**
 * Extracts a usable account name (email/UPN) from a SharePoint claims login
 * name such as `i:0#.f|membership|user@contoso.com`. Returns the input as-is
 * when it already looks like an email/UPN.
 */
export function accountNameFromLoginName(loginName?: string): string | undefined {
  if (!loginName) {
    return undefined;
  }
  const trimmed = loginName.trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.indexOf('|') >= 0) {
    const parts = trimmed.split('|');
    const last = parts[parts.length - 1].trim();
    return last || undefined;
  }
  return trimmed;
}

/**
 * Builds the SharePoint user photo URL for the given account name (email/UPN).
 * The endpoint is served from `_layouts` on every web, so a root-relative URL
 * resolves correctly on SharePoint Online. Returns undefined when no account
 * name is available so callers can fall back to initials.
 */
export function getUserPhotoUrl(
  accountName?: string,
  size: UserPhotoSize = 'S'
): string | undefined {
  if (!accountName) {
    return undefined;
  }
  const trimmed = accountName.trim();
  if (!trimmed || trimmed.indexOf('@') < 0) {
    return undefined;
  }
  const base = photoBaseOrigin || '';
  return `${base}/_layouts/15/userphoto.aspx?size=${size}&accountname=${encodeURIComponent(trimmed)}`;
}
