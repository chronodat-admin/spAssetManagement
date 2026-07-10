import { IAppSettings } from '../../models/IAssetApp';
import type { IWorkflowSettings, NotificationWorkflowKey } from '../../models/IWorkflowSettings';
import {
  cloneDefaultWorkflowSettings,
  DEFAULT_NOTIFICATION_WORKFLOWS
} from './defaults.js';
import {
  mergeEmailTemplatesWithRefresh,
  mergeNotificationWorkflowsWithRefresh
} from './templateRefresh.js';
import { migrateLegacyWorkflowSlugs } from './migrateLegacySlugs.js';
import { migrateLegacyNumbering } from './numberingMigration.js';

function mergeNotificationWorkflows(
  parsed?: Partial<IWorkflowSettings>['notificationWorkflows']
): IWorkflowSettings['notificationWorkflows'] {
  return mergeNotificationWorkflowsWithRefresh(parsed);
}

function mergeEmailTemplates(parsed?: IWorkflowSettings['emailTemplates']): IWorkflowSettings['emailTemplates'] {
  return mergeEmailTemplatesWithRefresh(parsed);
}

function mergeWorkflowSettings(parsed: Partial<IWorkflowSettings>): IWorkflowSettings {
  const migrated = migrateLegacyWorkflowSlugs(parsed);
  const defaults = cloneDefaultWorkflowSettings();
  return {
    customStatuses:
      migrated.customStatuses && migrated.customStatuses.length > 0
        ? migrated.customStatuses
        : defaults.customStatuses,
    customPriorities:
      migrated.customPriorities && migrated.customPriorities.length > 0
        ? migrated.customPriorities
        : defaults.customPriorities,
    numbering: migrateLegacyNumbering(migrated.numbering),
    tags: migrated.tags || [],
    notificationWorkflows: mergeNotificationWorkflows(migrated.notificationWorkflows),
    workflowRules:
      migrated.workflowRules && migrated.workflowRules.length > 0
        ? migrated.workflowRules
        : defaults.workflowRules,
    emailTemplates: mergeEmailTemplates(migrated.emailTemplates),
    scheduledReports: migrated.scheduledReports || [],
    emailDeliveryMode:
      migrated.emailDeliveryMode ??
      (migrated.graphEmailNotificationsEnabled === false
        ? 'powerAutomate'
        : defaults.emailDeliveryMode ?? 'chronodatApi'),
    graphEmailNotificationsEnabled: migrated.graphEmailNotificationsEnabled,
    notificationMailbox: migrated.notificationMailbox ?? defaults.notificationMailbox ?? ''
  };
}

export function parseWorkflowSettings(settings?: IAppSettings): IWorkflowSettings {
  if (!settings?.WorkflowSettings) {
    return cloneDefaultWorkflowSettings();
  }

  try {
    const parsed = JSON.parse(settings.WorkflowSettings) as Partial<IWorkflowSettings>;
    return mergeWorkflowSettings(parsed);
  } catch {
    return cloneDefaultWorkflowSettings();
  }
}

export function serializeWorkflowSettings(workflowSettings: IWorkflowSettings): string {
  return JSON.stringify(workflowSettings);
}

/** Sync legacy AppSettings email fields from notification workflow templates. */
export function syncLegacyEmailFieldsFromWorkflows(
  workflowSettings: IWorkflowSettings,
  current: Partial<IAppSettings> = {}
): Partial<IAppSettings> {
  const workflows = workflowSettings.notificationWorkflows || {};
  const result: Partial<IAppSettings> = { ...current };

  const apply = (
    key: keyof typeof workflows,
    note: keyof IAppSettings,
    subject: keyof IAppSettings,
    body: keyof IAppSettings
  ): void => {
    const template = workflows[key];
    if (!template) return;
    (result as Record<string, string>)[note as string] = template.enabled ? 'Yes' : 'No';
    (result as Record<string, string>)[subject as string] = template.subject;
    (result as Record<string, string>)[body as string] = template.body;
  };

  apply('open', 'OpenNote', 'OpenEmailSubject', 'OpenEmailBody');
  apply('incomplete', 'IncompleteNote', 'IncompleteEmailSubject', 'IncompleteEmailBody');
  apply('closed', 'ClosedNote', 'ClosedEmailSubject', 'ClosedEmailBody');
  apply('onHold', 'OnHoldNote', 'OnHoldEmailSubject', 'OnHoldEmailBody');
  apply('assignedTo', 'AssignedToNote', 'AssignedToEmailSubject', 'AssignedToEmailBody');

  return result;
}

export function hydrateNotificationWorkflowsFromAppSettings(
  settings?: IAppSettings,
  workflowSettings?: IWorkflowSettings
): IWorkflowSettings {
  const base = workflowSettings || parseWorkflowSettings(settings);
  const workflows = { ...(base.notificationWorkflows || DEFAULT_NOTIFICATION_WORKFLOWS) };

  if (!settings) {
    return { ...base, notificationWorkflows: workflows };
  }

  const hydrate = (
    key: NotificationWorkflowKey,
    note?: string,
    subject?: string,
    body?: string
  ): void => {
    const existing = workflows[key] || DEFAULT_NOTIFICATION_WORKFLOWS[key];
    if (!existing) return;
    workflows[key] = {
      ...existing,
      enabled: note ? note === 'Yes' : existing.enabled,
      subject: subject || existing.subject,
      body: body || existing.body,
      recipients: existing.recipients || []
    };
  };

  hydrate('open', settings.OpenNote, settings.OpenEmailSubject, settings.OpenEmailBody);
  hydrate(
    'incomplete',
    settings.IncompleteNote,
    settings.IncompleteEmailSubject,
    settings.IncompleteEmailBody
  );
  hydrate('closed', settings.ClosedNote, settings.ClosedEmailSubject, settings.ClosedEmailBody);
  hydrate('onHold', settings.OnHoldNote, settings.OnHoldEmailSubject, settings.OnHoldEmailBody);
  hydrate(
    'assignedTo',
    settings.AssignedToNote,
    settings.AssignedToEmailSubject,
    settings.AssignedToEmailBody
  );

  return { ...base, notificationWorkflows: workflows };
}
