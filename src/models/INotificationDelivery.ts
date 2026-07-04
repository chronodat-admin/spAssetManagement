import type { AadHttpClientFactory } from '@microsoft/sp-http';
import type { EmailDeliveryMode } from './IWorkflowSettings';

export interface INotificationApiContext {
  tenantId: string;
  siteUrl?: string;
  tenantName?: string;
  productSlug?: string;
}

/** Describes a non-blocking email notification delivery failure for surfacing in the UI. */
export interface INotificationDeliveryFailure {
  mode: EmailDeliveryMode;
  message: string;
  recipientCount: number;
}

export interface INotificationDeliveryOptions {
  subscriptionApiUrl?: string;
  getNotificationContext?: () => INotificationApiContext;
  /** SharePoint page hosting the web part — used for {AssetUrl} deep links in email. */
  getAppPageUrl?: () => string;
  /** SPFx context factory — required for Microsoft Graph Mail.Send delivery. */
  aadHttpClientFactory?: AadHttpClientFactory;
  /** Invoked when email delivery fails, so the host app can notify the user. */
  onDeliveryError?: (failure: INotificationDeliveryFailure) => void;
}
