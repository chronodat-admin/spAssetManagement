/** Canonical workflow / email template slugs for asset lifecycle events. */
export const ASSET_EMAIL_TEMPLATE_SLUGS = [
  'asset_created',
  'asset_updated',
  'asset_assigned',
  'asset_in_progress',
  'asset_incomplete',
  'asset_on_hold',
  'asset_overdue',
  'asset_closed',
  'asset_comment',
  'asset_priority_changed'
] as const;

export type AssetEmailTemplateSlug = (typeof ASSET_EMAIL_TEMPLATE_SLUGS)[number];

export const ASSET_WORKFLOW_TRIGGER_EVENTS = [
  'asset_created',
  'asset_updated',
  'asset_status_changed',
  'asset_assigned',
  'asset_overdue'
] as const;

export type AssetWorkflowTriggerEvent = (typeof ASSET_WORKFLOW_TRIGGER_EVENTS)[number];

export const EMAIL_TEMPLATE_SLUG_LABELS: Record<AssetEmailTemplateSlug, string> = {
  asset_created: 'Asset created',
  asset_updated: 'Asset updated',
  asset_assigned: 'Asset assigned',
  asset_in_progress: 'Asset in progress',
  asset_incomplete: 'Asset incomplete',
  asset_on_hold: 'Asset on hold',
  asset_overdue: 'Asset overdue',
  asset_closed: 'Asset closed',
  asset_comment: 'Asset comment',
  asset_priority_changed: 'Priority changed'
};

export const WORKFLOW_TRIGGER_LABELS: Record<AssetWorkflowTriggerEvent, string> = {
  asset_created: 'Asset created',
  asset_updated: 'Asset updated',
  asset_status_changed: 'Status changed',
  asset_assigned: 'Asset assigned',
  asset_overdue: 'Asset overdue'
};

/** Legacy risk-management slugs → asset slugs (persisted settings migration). */
export const LEGACY_EMAIL_TEMPLATE_SLUG_MAP: Record<string, AssetEmailTemplateSlug> = {
  risk_created: 'asset_created',
  risk_updated: 'asset_updated',
  risk_assigned: 'asset_assigned',
  risk_in_progress: 'asset_in_progress',
  risk_incomplete: 'asset_incomplete',
  risk_on_hold: 'asset_on_hold',
  risk_overdue: 'asset_overdue',
  risk_resolved: 'asset_closed',
  risk_comment: 'asset_comment',
  risk_priority_changed: 'asset_priority_changed'
};

export const LEGACY_WORKFLOW_TRIGGER_MAP: Record<string, AssetWorkflowTriggerEvent> = {
  risk_created: 'asset_created',
  risk_updated: 'asset_updated',
  risk_status_changed: 'asset_status_changed',
  risk_assigned: 'asset_assigned',
  risk_overdue: 'asset_overdue'
};

export const LEGACY_NUMBERING_ENTITY_TYPE = 'risk' as const;
export const ASSET_NUMBERING_ENTITY_TYPE = 'asset' as const;

export const LEGACY_EMAIL_ENTITY_TYPE = 'risk' as const;
export const ASSET_EMAIL_ENTITY_TYPE = 'asset' as const;

export const LEGACY_SCHEDULED_REPORT_TYPE = 'risks' as const;
export const ASSET_SCHEDULED_REPORT_TYPE = 'assets' as const;

export function normalizeEmailTemplateSlug(slug: string): string {
  return LEGACY_EMAIL_TEMPLATE_SLUG_MAP[slug] || slug;
}

export function normalizeWorkflowTriggerEvent(trigger: string): string {
  return LEGACY_WORKFLOW_TRIGGER_MAP[trigger] || trigger;
}

export function normalizeNumberingEntityType(entityType: string): string {
  if (entityType === LEGACY_NUMBERING_ENTITY_TYPE) {
    return ASSET_NUMBERING_ENTITY_TYPE;
  }
  if (entityType === 'business') {
    return 'vendor';
  }
  return entityType;
}

export function normalizeEmailEntityType(entityType: string): string {
  return entityType === LEGACY_EMAIL_ENTITY_TYPE ? ASSET_EMAIL_ENTITY_TYPE : entityType;
}

export function normalizeScheduledReportType(reportType: string): string {
  return reportType === LEGACY_SCHEDULED_REPORT_TYPE ? ASSET_SCHEDULED_REPORT_TYPE : reportType;
}
