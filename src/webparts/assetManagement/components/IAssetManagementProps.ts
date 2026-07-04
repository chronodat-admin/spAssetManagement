import { WebPartContext } from '@microsoft/sp-webpart-base';
import { DisplayMode } from '@microsoft/sp-core-library';

export interface IAssetManagementProps {
  context: WebPartContext;
  webUrl: string;
  siteTitle: string;
  displayMode: DisplayMode;
  isTeamsHost?: boolean;
  /** Base URL of the subscription API (no trailing slash). */
  subscriptionApiUrl?: string;
  /** When true, bypass subscription gating (local dev only). */
  skipSubscriptionCheck?: boolean;
}
