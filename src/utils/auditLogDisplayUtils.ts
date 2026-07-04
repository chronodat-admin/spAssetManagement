import { computeAuditChanges } from './auditLogUtils';

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  SETTINGS_UPDATE: 'Settings updated'
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  Risks: 'Risks',
  Categories: 'Categories',
  SubCategories: 'Sub-categories',
  Business: 'Business',
  Projects: 'Projects',
  Likelihood: 'Likelihood',
  Consequences: 'Consequences',
  RiskProfile: 'Risk profiles',
  RiskResponse: 'Risk responses',
  RiskStrategy: 'Risk strategies',
  AppSettings: 'App settings',
  Administrators: 'App administrators',
  FormTemplates: 'Form templates',
  ComplianceFrameworks: 'Compliance frameworks',
  ComplianceControls: 'Compliance controls',
  ComplianceAssessments: 'Compliance assessments',
  ComplianceAssessmentItems: 'Assessment items'
};

const FIELD_LABELS: Record<string, string> = {
  AppearanceSettings: 'Appearance settings',
  WorkflowSettings: 'Workflow settings',
  ColorScheme: 'Color scheme',
  DashboardName: 'Dashboard name',
  DashboardDynamicNaming: 'Dynamic dashboard naming',
  DashboardHoverEnabled: 'Dashboard hover',
  DashboardFinExpEnabled: 'Financial exposure card',
  RiskMgmtProc: 'Procedure URL',
  Title: 'Title',
  Rating: 'Rating',
  Riskstatus: 'Status',
  RiskDescription: 'Description',
  compactMode: 'Compact mode',
  roundedCorners: 'Rounded corners',
  fontSize: 'Font size',
  enableTopNavColor: 'Custom top nav color',
  enableSidebarColor: 'Custom sidebar color'
};

export interface IAuditFieldChange {
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
}

export interface IAuditCreateValue {
  field: string;
  fieldLabel: string;
  value: string;
}

export interface IAuditDetailsPresentation {
  summary: string;
  changes: IAuditFieldChange[];
  createValues: IAuditCreateValue[];
  hasExpandableContent: boolean;
}

export function formatAuditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] || action.replace(/_/g, ' ').toLowerCase();
}

export function formatAuditEntityLabel(entity: string): string {
  return AUDIT_ENTITY_LABELS[entity] || entity.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function humanizeAuditFieldName(field: string): string {
  const leaf = field.includes('.') ? field.split('.').pop() || field : field;
  if (FIELD_LABELS[leaf]) {
    return FIELD_LABELS[leaf];
  }
  if (FIELD_LABELS[field]) {
    return FIELD_LABELS[field];
  }
  return leaf
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\bId\b/g, 'ID');
}

function truncateText(value: string, max = 160): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

function tryParseJson(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return value;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

export function stringifyAuditValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const parsed = tryParseJson(value);

  if (typeof parsed === 'boolean') {
    return parsed ? 'Yes' : 'No';
  }

  if (typeof parsed === 'number') {
    return String(parsed);
  }

  if (typeof parsed === 'string') {
    return truncateText(parsed);
  }

  if (Array.isArray(parsed)) {
    return truncateText(parsed.map((item) => stringifyAuditValue(item)).join(', '));
  }

  if (typeof parsed === 'object' && parsed !== null) {
    const record = parsed as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length === 0) {
      return '—';
    }
    if (keys.length <= 4) {
      return keys
        .map((key) => `${humanizeAuditFieldName(key)}: ${stringifyAuditValue(record[key])}`)
        .join('; ');
    }
    return truncateText(JSON.stringify(parsed, null, 2), 240);
  }

  return truncateText(String(parsed));
}

function isChangeRecord(value: unknown): value is { old: unknown; new: unknown } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return 'old' in record || 'new' in record;
}

function expandFieldChange(field: string, change: { old: unknown; new: unknown }): IAuditFieldChange[] {
  const oldParsed = tryParseJson(change.old);
  const newParsed = tryParseJson(change.new);

  const oldObj =
    typeof oldParsed === 'object' && oldParsed !== null && !Array.isArray(oldParsed)
      ? (oldParsed as Record<string, unknown>)
      : undefined;
  const newObj =
    typeof newParsed === 'object' && newParsed !== null && !Array.isArray(newParsed)
      ? (newParsed as Record<string, unknown>)
      : undefined;

  if (oldObj && newObj) {
    const nested = computeAuditChanges(oldObj, newObj);
    const nestedFields = Object.keys(nested);
    if (nestedFields.length > 0) {
      return nestedFields.map((nestedField) => {
        const nestedChange = nested[nestedField];
        return {
          field: `${field}.${nestedField}`,
          fieldLabel: `${humanizeAuditFieldName(field)} › ${humanizeAuditFieldName(nestedField)}`,
          oldValue: stringifyAuditValue(nestedChange.old),
          newValue: stringifyAuditValue(nestedChange.new)
        };
      });
    }
  }

  return [
    {
      field,
      fieldLabel: humanizeAuditFieldName(field),
      oldValue: stringifyAuditValue(change.old),
      newValue: stringifyAuditValue(change.new)
    }
  ];
}

function parseDetailsObject(parsed: Record<string, unknown>): {
  changes: IAuditFieldChange[];
  createValues: IAuditCreateValue[];
} {
  const changes: IAuditFieldChange[] = [];
  const createValues: IAuditCreateValue[] = [];

  Object.keys(parsed).forEach((field) => {
    const value = parsed[field];
    if (isChangeRecord(value)) {
      changes.push(...expandFieldChange(field, value));
      return;
    }

    createValues.push({
      field,
      fieldLabel: humanizeAuditFieldName(field),
      value: stringifyAuditValue(value)
    });
  });

  return { changes, createValues };
}

function buildSummary(
  action: string,
  entity: string,
  changes: IAuditFieldChange[],
  createValues: IAuditCreateValue[]
): string {
  const entityLabel = formatAuditEntityLabel(entity);
  const actionLabel = formatAuditActionLabel(action);

  if (changes.length > 0) {
    const fieldNames = changes.slice(0, 3).map((change) => change.fieldLabel);
    const remainder = changes.length - fieldNames.length;
    const fieldsText =
      remainder > 0 ? `${fieldNames.join(', ')} +${remainder} more` : fieldNames.join(', ');
    return `${actionLabel} · ${fieldsText}`;
  }

  if (createValues.length > 0) {
    const titleValue = createValues.find((item) => item.field === 'Title')?.value;
    if (titleValue && titleValue !== '—') {
      return `${actionLabel} ${entityLabel}: ${titleValue}`;
    }
    const preview = createValues
      .slice(0, 2)
      .map((item) => item.fieldLabel)
      .join(', ');
    return `${actionLabel} ${entityLabel}${preview ? ` (${preview})` : ''}`;
  }

  return `${actionLabel} ${entityLabel}`;
}

export function buildAuditDetailsPresentation(
  details: string | null,
  action: string,
  entity: string
): IAuditDetailsPresentation {
  if (!details?.trim()) {
    return {
      summary: `${formatAuditActionLabel(action)} ${formatAuditEntityLabel(entity)}`,
      changes: [],
      createValues: [],
      hasExpandableContent: false
    };
  }

  try {
    const parsed = JSON.parse(details) as Record<string, unknown>;
    const { changes, createValues } = parseDetailsObject(parsed);
    const summary = buildSummary(action, entity, changes, createValues);

    return {
      summary,
      changes,
      createValues,
      hasExpandableContent: changes.length > 0 || createValues.length > 1
    };
  } catch {
    return {
      summary: truncateText(details, 120),
      changes: [],
      createValues: [],
      hasExpandableContent: details.length > 120
    };
  }
}
