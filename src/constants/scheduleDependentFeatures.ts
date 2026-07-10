import type { SettingsPageId } from '../components/Settings/settingsPageMeta';
import type { NotificationWorkflowKey } from '../models/IWorkflowSettings';

/** Settings tabs hidden until a scheduler/backend runner is available. */
export const HIDDEN_SCHEDULE_DEPENDENT_SETTINGS_PAGE_IDS: SettingsPageId[] = [];

/** Settings tabs hidden from the sidebar (pending UI, feature flags, or backend). */
export const HIDDEN_SETTINGS_PAGE_IDS: SettingsPageId[] = [
  ...HIDDEN_SCHEDULE_DEPENDENT_SETTINGS_PAGE_IDS,
  'compliance',
  'lookupLikelihood',
  'lookupConsequences',
  'lookupRiskProfile',
  'lookupRiskResponse',
  'lookupRiskStrategy'
];

export function isHiddenSettingsPage(pageId: SettingsPageId): boolean {
  return HIDDEN_SETTINGS_PAGE_IDS.includes(pageId);
}

/** Notification workflows that require a scheduled job (not event-driven in SPFx). */
export const HIDDEN_SCHEDULE_DEPENDENT_NOTIFICATION_KEYS: NotificationWorkflowKey[] = [];

/** Built-in email templates tied to schedule-dependent notifications. */
export const HIDDEN_SCHEDULE_DEPENDENT_EMAIL_TEMPLATE_SLUGS = [] as const;

export function isScheduleDependentSettingsPageHidden(pageId: SettingsPageId): boolean {
  return HIDDEN_SCHEDULE_DEPENDENT_SETTINGS_PAGE_IDS.includes(pageId);
}

export function isScheduleDependentNotificationKey(key: NotificationWorkflowKey): boolean {
  return HIDDEN_SCHEDULE_DEPENDENT_NOTIFICATION_KEYS.includes(key);
}

export function isScheduleDependentEmailTemplateSlug(slug: string): boolean {
  return (HIDDEN_SCHEDULE_DEPENDENT_EMAIL_TEMPLATE_SLUGS as readonly string[]).includes(slug);
}
