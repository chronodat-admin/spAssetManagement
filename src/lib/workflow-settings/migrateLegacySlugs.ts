import type { IEmailTemplate, IWorkflowRule, IWorkflowSettings } from '../../models/IWorkflowSettings';
import {
  LEGACY_EMAIL_ENTITY_TYPE,
  LEGACY_SCHEDULED_REPORT_TYPE,
  normalizeEmailEntityType,
  normalizeEmailTemplateSlug,
  normalizeScheduledReportType,
  normalizeWorkflowTriggerEvent
} from './slugs.js';
import {
  migrateLegacyNumbering,
  usesLegacyNumbering
} from './numberingMigration.js';

function migrateEmailTemplates(templates: IEmailTemplate[] | undefined): IEmailTemplate[] | undefined {
  if (!templates) {
    return templates;
  }

  return templates.map((template) => ({
    ...template,
    slug: normalizeEmailTemplateSlug(template.slug),
    entityType: normalizeEmailEntityType(template.entityType) as IEmailTemplate['entityType']
  }));
}

function migrateWorkflowRules(rules: IWorkflowRule[] | undefined): IWorkflowRule[] | undefined {
  if (!rules) {
    return rules;
  }

  return rules.map((rule) => ({
    ...rule,
    triggerEvent: normalizeWorkflowTriggerEvent(rule.triggerEvent)
  }));
}

/** Normalize legacy risk-* slugs in persisted workflow settings. */
export function migrateLegacyWorkflowSlugs(
  settings: Partial<IWorkflowSettings>
): Partial<IWorkflowSettings> {
  const numbering = settings.numbering ? migrateLegacyNumbering(settings.numbering) : settings.numbering;

  const scheduledReports = settings.scheduledReports?.map((report) => ({
    ...report,
    reportType: normalizeScheduledReportType(report.reportType) as typeof report.reportType
  }));

  return {
    ...settings,
    numbering,
    emailTemplates: migrateEmailTemplates(settings.emailTemplates),
    workflowRules: migrateWorkflowRules(settings.workflowRules),
    scheduledReports
  };
}

export function usesLegacyWorkflowSlugs(settings: Partial<IWorkflowSettings>): boolean {
  const hasLegacyEmailSlug = (settings.emailTemplates || []).some(
    (item) => normalizeEmailTemplateSlug(item.slug) !== item.slug
  );
  const hasLegacyEntity = (settings.emailTemplates || []).some(
    (item) => (item.entityType as string) === LEGACY_EMAIL_ENTITY_TYPE
  );
  const hasLegacyNumbering = usesLegacyNumbering(settings.numbering);
  const hasLegacyTrigger = (settings.workflowRules || []).some(
    (rule) => normalizeWorkflowTriggerEvent(rule.triggerEvent) !== rule.triggerEvent
  );
  const hasLegacyReport = (settings.scheduledReports || []).some(
    (report) => (report.reportType as string) === LEGACY_SCHEDULED_REPORT_TYPE
  );

  return (
    hasLegacyEmailSlug ||
    hasLegacyEntity ||
    hasLegacyNumbering ||
    hasLegacyTrigger ||
    hasLegacyReport
  );
}
