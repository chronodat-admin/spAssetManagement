import type { IEmailTemplate, NotificationWorkflowKey } from '../../models/IWorkflowSettings';

/** Maps notification workflow keys to reusable email template slugs. */
export const WORKFLOW_TO_TEMPLATE_SLUG: Partial<Record<NotificationWorkflowKey, string>> = {
  open: 'risk_created',
  assignedTo: 'risk_assigned',
  inProgress: 'risk_in_progress',
  closed: 'risk_resolved',
  incomplete: 'risk_incomplete',
  onHold: 'risk_on_hold',
  riskUpdated: 'risk_updated',
  riskCommentAdded: 'risk_comment',
  riskOverdue: 'risk_overdue',
  riskPriorityChanged: 'risk_priority_changed'
};

export interface INotificationPlaceholderValues {
  AM_AssetId?: string;
  Title?: string;
  Status?: string;
  Priority?: string;
  Category?: string;
  AssignedTo?: string;
  AssetUrl?: string;
  CreatedByName?: string;
  ModifiedByName?: string;
  DueDate?: string;
  OrgName?: string;
  Dates?: string;
  AM_Notes?: string;
  /** Display text for the risk link (defaults to Title). Use with {AssetUrl} in HTML templates. */
  LinkTitle?: string;
}

export const NOTIFICATION_PLACEHOLDER_ALIASES: Record<string, keyof INotificationPlaceholderValues> = {
  CreatedBy: 'CreatedByName',
  AM_Status: 'Status',
  RiskCategory: 'Category'
};

export const ASSET_EMAIL_ITEM_ID_PARAM = 'riskItemId';
export const ASSET_EMAIL_SOURCE_PARAM = 'riskSource';
export const ASSET_EMAIL_SOURCE_VALUE = 'email';

export function substituteNotificationPlaceholders(
  template: string,
  values: INotificationPlaceholderValues
): string {
  if (!template) {
    return '';
  }

  const map: Record<string, string | undefined> = {
    AM_AssetId: values.AM_AssetId,
    Title: values.Title,
    Status: values.Status,
    Priority: values.Priority,
    Category: values.Category,
    AssignedTo: values.AssignedTo,
    AssetUrl: values.AssetUrl,
    CreatedByName: values.CreatedByName,
    ModifiedByName: values.ModifiedByName,
    DueDate: values.DueDate,
    OrgName: values.OrgName,
    Dates: values.Dates,
    AM_Notes: values.AM_Notes,
    LinkTitle: values.LinkTitle,
    CreatedBy: values.CreatedByName,
    AM_Status: values.Status,
    RiskCategory: values.Category
  };

  return template.replace(/\{(\w+)\}/g, (_, key: string) => map[key] ?? `{${key}}`);
}

export function resolveEmailTemplateContent(
  workflowKey: NotificationWorkflowKey,
  workflowSubject: string,
  workflowBody: string,
  emailTemplates: IEmailTemplate[] | undefined
): { subject: string; body: string; isHtml: boolean } {
  const slug = WORKFLOW_TO_TEMPLATE_SLUG[workflowKey];
  const template = slug
    ? (emailTemplates || []).find((item) => item.slug === slug && item.isActive)
    : undefined;

  if (template) {
    return {
      subject: template.subject || workflowSubject,
      body: template.bodyHtml || workflowBody,
      isHtml: Boolean(template.bodyHtml && template.bodyHtml.includes('<'))
    };
  }

  return {
    subject: workflowSubject,
    body: workflowBody,
    isHtml: false
  };
}

export function formatRiskDueDate(value?: string): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

/**
 * Pages that cannot be used as the base for an email deep link:
 * - Native Risks list forms (DispForm/EditForm/NewForm) — transient, per-item pages.
 * - The Teams host wrapper (_layouts/15/teamshostedapp.aspx) — it bootstraps inside the
 *   Teams client and does not render the app reliably when opened from an email in a browser.
 * In these cases we fall back to the native DispForm link, which opens in any browser.
 */
export function isEmailDeepLinkableAppPage(pageUrl: string): boolean {
  if (!pageUrl) {
    return false;
  }
  let path: string;
  try {
    path = new URL(pageUrl).pathname;
  } catch {
    return false;
  }
  if (/\/Lists\/Risks\/(?:DispForm|EditForm|NewForm)\.aspx$/i.test(path)) {
    return false;
  }
  if (/\/_layouts\/15\/teamshostedapp\.aspx$/i.test(path)) {
    return false;
  }
  return true;
}

export function resolveNotificationAppPageUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  if (!isEmailDeepLinkableAppPage(window.location.href)) {
    return '';
  }

  const url = new URL(window.location.href);
  url.searchParams.delete(ASSET_EMAIL_ITEM_ID_PARAM);
  url.searchParams.delete(ASSET_EMAIL_SOURCE_PARAM);
  url.hash = '';
  return `${url.origin}${url.pathname}${url.search}`;
}

function getCurrentAppPageUrl(): string {
  return resolveNotificationAppPageUrl();
}

export function buildRiskItemUrl(webUrl: string, itemId: number, appPageUrl?: string): string {
  const candidate = appPageUrl?.trim() || getCurrentAppPageUrl();
  if (candidate && isEmailDeepLinkableAppPage(candidate)) {
    const url = new URL(candidate);
    url.searchParams.set(ASSET_EMAIL_ITEM_ID_PARAM, String(itemId));
    url.searchParams.set(ASSET_EMAIL_SOURCE_PARAM, ASSET_EMAIL_SOURCE_VALUE);
    return url.toString();
  }

  const base = webUrl.replace(/\/$/, '');
  return `${base}/Lists/Risks/DispForm.aspx?ID=${itemId}`;
}

export function normalizeAssigneeIds(ids?: number[]): string {
  return [...(ids || [])].sort((a, b) => a - b).join(',');
}

export function arraysEqual(left: number[] | undefined, right: number[] | undefined): boolean {
  return normalizeAssigneeIds(left) === normalizeAssigneeIds(right);
}
