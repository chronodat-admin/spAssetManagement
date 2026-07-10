/** SPFx component IDs — must match manifest JSON files. */
export const ASSET_MANAGEMENT_WEB_PART_ID = '4fa4ca04-c98a-4723-8671-f69956f65f26';
export const ASSET_FORM_CUSTOMIZER_ID = '013cb786-7445-49dc-aebd-9c4e8706fd98';

export const DEFAULT_APP_TITLE = 'Asset Management Hub';

/** Legal entity shown in the app shell footer. */
export const APP_COPYRIGHT_HOLDER = 'Chronodat';

/** Resolves the user-visible app name from settings or web part properties. */
export function resolveAppDisplayName(title?: string, fallback = DEFAULT_APP_TITLE): string {
  const trimmed = title?.trim();
  return trimmed || fallback;
}

/** Hosted subscription API base URL. Empty string disables subscription gate. */
export const DEFAULT_SUBSCRIPTION_API_URL = 'https://subscription.chronodat.com';

/** Product identifier for per-site licensing on the subscription API. */
export const SUBSCRIPTION_PRODUCT_SLUG = 'asset-management';

/** Heading for the one-time provisioning / setup wizard. */
export const DEFAULT_SETUP_TITLE = `${DEFAULT_APP_TITLE} Setup`;

/** Accessible name for the main app sidebar navigation region. */
export const DEFAULT_NAVIGATION_ARIA_LABEL = `${DEFAULT_APP_TITLE} navigation`;

/** User custom action name registered on the AM_Assets list (SharePoint Online). */
export const ASSET_FORM_CUSTOMIZER_ACTION_NAME = 'AssetManagement.AssetFormCustomizer';
