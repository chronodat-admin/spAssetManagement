import { IAppSettings } from '../../models/IAssetApp';
import type { IWorkflowSettings } from '../../models/IWorkflowSettings';
import { cloneDefaultWorkflowSettings } from './defaults.js';
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
