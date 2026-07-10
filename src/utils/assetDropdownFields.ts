import type { CustomFieldDefinition, FormSettings } from '../lib/form-config/types';

export type AssetDropdownSource = 'field' | 'custom';

export interface IAssetDropdownFieldConfig {
  key: string;
  label: string;
  fallback: string[];
  description?: string;
  source: AssetDropdownSource;
}

/** Built-in SharePoint choice fields on asset forms that admins can manage here. */
export const BUILTIN_ASSET_DROPDOWN_FIELDS: IAssetDropdownFieldConfig[] = [
  {
    key: 'AM_DepreciationMethod',
    label: 'Depreciation method',
    fallback: ['StraightLine', 'DecliningBalance'],
    description: 'Shown on the Financial tab when creating or editing assets.',
    source: 'field'
  }
];

export function formatAssetDropdownOptionLabel(fieldKey: string, value: string): string {
  if (fieldKey === 'AM_DepreciationMethod') {
    if (value === 'DecliningBalance') return 'Declining balance';
    if (value === 'StraightLine') return 'Straight line';
  }
  return value;
}

export function listAssetDropdownFields(formSettings: FormSettings): IAssetDropdownFieldConfig[] {
  const customFields = (formSettings.risks.customFields || [])
    .filter((field): field is CustomFieldDefinition & { type: 'dropdown' } => field.type === 'dropdown')
    .map((field) => ({
      key: field.key,
      label: field.label || field.key,
      fallback: field.options || [],
      description: 'Custom dropdown field configured under Forms.',
      source: 'custom' as const
    }));

  return [...BUILTIN_ASSET_DROPDOWN_FIELDS, ...customFields];
}

export function getAssetDropdownOptions(
  formSettings: FormSettings,
  field: IAssetDropdownFieldConfig
): string[] {
  if (field.source === 'custom') {
    const custom = formSettings.risks.customFields?.find((entry) => entry.key === field.key);
    if (custom?.options && custom.options.length > 0) {
      return custom.options;
    }
    return field.fallback;
  }

  const configured = (formSettings.risks.fields as Record<string, { options?: string[] }>)[field.key];
  if (configured?.options && configured.options.length > 0) {
    return configured.options;
  }
  return field.fallback;
}

export function getAssetDropdownOptionsForField(
  formSettings: FormSettings,
  fieldKey: string,
  fallback: string[] = []
): string[] {
  const field = listAssetDropdownFields(formSettings).find((entry) => entry.key === fieldKey);
  if (!field) {
    return fallback;
  }
  return getAssetDropdownOptions(formSettings, field);
}
