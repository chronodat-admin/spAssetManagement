import type { BuiltFormConfig } from '../lib/form-config/types';
import type { IAssetVersionChange } from '../models/IAssetVersionHistory';

export const ASSET_VERSION_TRACKED_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'Title', label: 'Title' },
  { key: 'AM_Status', label: 'Status' },
  { key: 'AM_Notes', label: 'Description' },
  { key: 'Likelihood', label: 'Likelihood' },
  { key: 'Consequence', label: 'Consequence' },
  { key: 'PotentialLikelihood', label: 'Potential Likelihood' },
  { key: 'PotentialConsequence', label: 'Potential Consequence' },
  { key: 'MitigationPlan', label: 'Mitigation Plan' },
  { key: 'RiskResponse', label: 'Risk Response' },
  { key: 'RiskCategory', label: 'Risk Category' },
  { key: 'RiskSubCategory', label: 'Risk Sub-Category' },
  { key: 'riskBusiness', label: 'Business' },
  { key: 'RiskProject', label: 'Project' },
  { key: 'RiskProfileType', label: 'Risk Profile Type' },
  { key: 'RiskStrategy', label: 'Risk Strategy' },
  { key: 'AssignedTo', label: 'Risk Owner(s)' },
  { key: 'DateRiskIdentified', label: 'Date Risk Identified' },
  { key: 'RiskDueDate', label: 'Action Due Date' },
  { key: 'Implementationreviewdate', label: 'Implementation Review Date' },
  { key: 'Causes', label: 'Causes' },
  { key: 'RiskConsequences', label: 'Consequences' },
  { key: 'ExistingControls', label: 'Existing Controls' },
  { key: 'potentialcost', label: 'Potential Cost' },
  { key: 'Assesstheeffectivenessofcontrols', label: 'Effectiveness of Controls' }
];

export const ASSET_VERSION_TRACKED_FIELD_KEYS = ASSET_VERSION_TRACKED_FIELDS.map((field) => field.key);

const MAX_VALUE_LENGTH = 120;

/** Normalize a SharePoint version column value into display text. */
export function normalizeVersionFieldValue(value: unknown): string {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    const lookupMatch = value.match(/^(?:\d+;#)+(.+)$/);
    if (lookupMatch) {
      return lookupMatch[1].replace(/;#\d+;#/g, ', ').trim();
    }
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeVersionFieldValue(entry))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'object') {
    const record = value as { Title?: string; Label?: string; LookupValue?: string };
    if (record.Title) {
      return record.Title;
    }
    if (record.Label) {
      return record.Label;
    }
    if (record.LookupValue) {
      return record.LookupValue;
    }
  }

  return String(value);
}

function normalizeValue(value: string | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function formatDisplayValue(value: string): string {
  const text = normalizeValue(value);
  if (!text) {
    return '(empty)';
  }
  if (text.length <= MAX_VALUE_LENGTH) {
    return text;
  }
  return `${text.slice(0, MAX_VALUE_LENGTH)}…`;
}

/** Decode SharePoint-encoded internal field names (e.g. `Potential_x0020_Cost`) for display. */
function prettifyFieldKey(key: string): string {
  const decoded = key.replace(/_x([0-9a-fA-F]{4})_/g, (_match, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  return decoded.replace(/\s+/g, ' ').trim() || key;
}

function resolveFieldLabel(
  key: string,
  formConfig?: BuiltFormConfig,
  labelMap?: Record<string, string>
): string {
  return (
    formConfig?.fields[key]?.label ||
    labelMap?.[key] ||
    ASSET_VERSION_TRACKED_FIELDS.find((f) => f.key === key)?.label ||
    prettifyFieldKey(key)
  );
}

/**
 * Build the ordered set of fields to diff for version history. Curated tracked
 * fields come first (preserving their order/labels), followed by any other custom
 * list fields discovered at runtime, sorted alphabetically by label.
 */
export function buildRiskVersionFieldOrder(
  labelMap: Record<string, string> = {},
  formConfig?: BuiltFormConfig
): Array<{ key: string; label: string }> {
  const order: Array<{ key: string; label: string }> = [];
  const seen = new Set<string>();

  const pushKey = (key: string): void => {
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    order.push({ key, label: resolveFieldLabel(key, formConfig, labelMap) });
  };

  for (const field of ASSET_VERSION_TRACKED_FIELDS) {
    pushKey(field.key);
  }

  Object.keys(labelMap)
    .filter((key) => !seen.has(key))
    .sort((a, b) => (labelMap[a] || a).localeCompare(labelMap[b] || b))
    .forEach(pushKey);

  return order;
}

export function diffRiskVersionFieldValues(
  newer: Record<string, string>,
  older: Record<string, string>,
  formConfig?: BuiltFormConfig
): IAssetVersionChange[] {
  const changes: IAssetVersionChange[] = [];

  for (const field of ASSET_VERSION_TRACKED_FIELDS) {
    const previous = normalizeValue(older[field.key]);
    const next = normalizeValue(newer[field.key]);
    if (previous === next) {
      continue;
    }

    changes.push({
      fieldLabel: resolveFieldLabel(field.key, formConfig),
      previousValue: previous ? formatDisplayValue(previous) : undefined,
      newValue: next ? formatDisplayValue(next) : undefined
    });
  }

  return changes;
}

/**
 * Diff two versions across an explicit, ordered set of fields. Unlike
 * {@link diffRiskVersionFieldValues}, the field universe is supplied by the caller
 * (typically every custom field on the list) so any changed column is surfaced.
 */
export function diffRiskVersionAllFields(
  newer: Record<string, string>,
  older: Record<string, string>,
  fieldOrder: Array<{ key: string; label: string }>
): IAssetVersionChange[] {
  const changes: IAssetVersionChange[] = [];

  for (const field of fieldOrder) {
    const previous = normalizeValue(older[field.key]);
    const next = normalizeValue(newer[field.key]);
    if (previous === next) {
      continue;
    }

    changes.push({
      fieldLabel: field.label,
      previousValue: previous ? formatDisplayValue(previous) : undefined,
      newValue: next ? formatDisplayValue(next) : undefined
    });
  }

  return changes;
}

export function formatVersionTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
