/** Microsoft Graph delegated permission used for workflow notification emails. */
export const GRAPH_MAIL_SEND_SCOPE = 'Mail.Send';

/** Hide Graph Mail.Send approval banners while Chronodat API is the default delivery mode. */
export const HIDDEN_MAIL_SEND_APPROVAL_UI = true;

/** Fallback when tenant-specific SharePoint admin URL cannot be derived. */
export const SHAREPOINT_ADMIN_CENTER_URL = 'https://admin.microsoft.com/sharepoint';

/** Deep link to API access (Mail.Send approval) in SharePoint Admin Center. */
export const SHAREPOINT_API_ACCESS_PATH =
  '/_layouts/15/online/AdminHome.aspx#/webApiPermissionManagement';

export function getSharePointApiAccessAdminUrl(webUrl: string): string {
  try {
    const hostname = new URL(webUrl).hostname;
    const match = hostname.match(/^([^.]+)\.sharepoint\.com$/i);
    if (match) {
      return `https://${match[1]}-admin.sharepoint.com${SHAREPOINT_API_ACCESS_PATH}`;
    }
  } catch {
    /* ignore invalid URL */
  }
  return SHAREPOINT_ADMIN_CENTER_URL;
}
