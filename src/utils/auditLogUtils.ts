import {
  BUSINESS_LIST_TITLE,
  COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE,
  COMPLIANCE_ASSESSMENTS_LIST_TITLE,
  COMPLIANCE_CONTROLS_LIST_TITLE,
  COMPLIANCE_FRAMEWORKS_LIST_TITLE,
  FORM_TEMPLATES_LIST_TITLE,
  PROJECTS_LIST_TITLE,
  SUB_CATEGORIES_LIST_TITLE,
  ADMINISTRATORS_LIST_TITLE
} from '../models/IListDefinitions';

const LIST_ENTITY_MAP: Record<string, string> = {
  Risks: 'AM_Assets',
  Categories: 'Categories',
  [SUB_CATEGORIES_LIST_TITLE]: 'SubCategories',
  [BUSINESS_LIST_TITLE]: 'Business',
  Business: 'Business',
  [PROJECTS_LIST_TITLE]: 'Projects',
  Likelihood: 'Likelihood',
  Consequences: 'Consequences',
  RiskProfile: 'RiskProfile',
  RiskResponse: 'RiskResponse',
  RiskStrategy: 'RiskStrategy',
  AppSettings: 'AppSettings',
  [ADMINISTRATORS_LIST_TITLE]: 'Administrators',
  [FORM_TEMPLATES_LIST_TITLE]: 'FormTemplates',
  [COMPLIANCE_FRAMEWORKS_LIST_TITLE]: 'ComplianceFrameworks',
  [COMPLIANCE_CONTROLS_LIST_TITLE]: 'ComplianceControls',
  [COMPLIANCE_ASSESSMENTS_LIST_TITLE]: 'ComplianceAssessments',
  [COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE]: 'ComplianceAssessmentItems',
  AuditLog: 'AuditLog'
};

const MAX_DETAILS_LENGTH = 60000;

export function resolveAuditEntity(listTitle: string): string {
  return LIST_ENTITY_MAP[listTitle] || listTitle;
}

export function serializeAuditDetails(details?: string | Record<string, unknown> | null): string | undefined {
  if (details === undefined || details === null) {
    return undefined;
  }

  const text = typeof details === 'string' ? details : JSON.stringify(sanitizeAuditDetails(details));
  if (text.length <= MAX_DETAILS_LENGTH) {
    return text;
  }
  return `${text.slice(0, MAX_DETAILS_LENGTH - 20)}...[truncated]`;
}

function sanitizeAuditDetails(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return '[nested]';
  }

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value.length > 2000 ? `${value.slice(0, 2000)}...[truncated]` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeAuditDetails(item, depth + 1));
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    Object.keys(record)
      .slice(0, 40)
      .forEach((key) => {
        next[key] = sanitizeAuditDetails(record[key], depth + 1);
      });
    return next;
  }

  return String(value);
}

export function buildAuditTitle(entity: string, action: string, entityId?: string | number | null): string {
  const idSuffix = entityId !== undefined && entityId !== null && entityId !== '' ? ` #${entityId}` : '';
  return `${action} - ${entity}${idSuffix}`;
}

export function computeAuditChanges(
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  keys.forEach((key) => {
    const oldVal = before?.[key];
    const newVal = after?.[key];
    if (normalizeAuditValue(oldVal) !== normalizeAuditValue(newVal)) {
      changes[key] = { old: oldVal ?? null, new: newVal ?? null };
    }
  });

  return changes;
}

function normalizeAuditValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value).trim();
}
