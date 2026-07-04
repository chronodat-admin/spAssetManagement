import type { CustomFieldDefinition } from '../lib/form-config/types';

/** SharePoint-backed custom field types available in form settings. */
export type CustomFieldType = CustomFieldDefinition['type'];

export type CustomFieldTypeOption = {
  value: CustomFieldType;
  label: string;
  sharePointType: string;
  supportsOptions?: boolean;
  supportsLookupList?: boolean;
  supportsDateOnly?: boolean;
};

export const CUSTOM_FIELD_TYPE_OPTIONS: CustomFieldTypeOption[] = [
  { value: 'text', label: 'Single line of text', sharePointType: 'Text' },
  { value: 'note', label: 'Multiple lines of text', sharePointType: 'Note' },
  {
    value: 'dropdown',
    label: 'Choice',
    sharePointType: 'Choice',
    supportsOptions: true
  },
  {
    value: 'multichoice',
    label: 'Multi-Choice',
    sharePointType: 'MultiChoice',
    supportsOptions: true
  },
  { value: 'number', label: 'Number', sharePointType: 'Number' },
  { value: 'currency', label: 'Currency', sharePointType: 'Currency' },
  { value: 'boolean', label: 'Yes / No', sharePointType: 'Boolean' },
  {
    value: 'date',
    label: 'Date and Time',
    sharePointType: 'DateTime',
    supportsDateOnly: true
  },
  {
    value: 'lookup',
    label: 'Lookup',
    sharePointType: 'Lookup',
    supportsLookupList: true
  },
  {
    value: 'lookup_multi',
    label: 'Lookup (multiple)',
    sharePointType: 'LookupMulti',
    supportsLookupList: true
  },
  { value: 'user', label: 'Person or Group', sharePointType: 'User' },
  { value: 'user_multi', label: 'Person or Group (multiple)', sharePointType: 'UserMulti' },
  { value: 'url', label: 'Hyperlink', sharePointType: 'URL' },
  { value: 'email', label: 'Email', sharePointType: 'Text' }
];

export const CUSTOM_FIELD_LOOKUP_LIST_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'Categories', label: 'Categories' },
  { value: 'SubCategories', label: 'Sub-Categories' },
  { value: 'lstBusiness', label: 'Business' },
  { value: 'Projects', label: 'Projects' },
  { value: 'RiskProfile', label: 'Risk Profile Type' },
  { value: 'RiskResponse', label: 'Risk Response' },
  { value: 'RiskStrategy', label: 'Risk Strategy' },
  { value: 'Likelihood', label: 'Likelihood' },
  { value: 'Consequence', label: 'Consequence' }
];

const CUSTOM_FIELD_TYPE_SET = new Set<string>(CUSTOM_FIELD_TYPE_OPTIONS.map((option) => option.value));

/** Normalize legacy saved values to current custom field types. */
export function normalizeCustomFieldType(type: string | undefined): CustomFieldType {
  if (!type) {
    return 'text';
  }

  if (type === 'textarea') {
    return 'note';
  }
  if (type === 'select') {
    return 'dropdown';
  }
  if (type === 'checkbox') {
    return 'boolean';
  }
  if (type === 'user_lookup') {
    return 'user';
  }

  if (CUSTOM_FIELD_TYPE_SET.has(type)) {
    return type as CustomFieldType;
  }

  return 'text';
}

export function getCustomFieldTypeOption(
  type: CustomFieldDefinition['type'] | string | undefined
): CustomFieldTypeOption | undefined {
  const normalized = normalizeCustomFieldType(type);
  return CUSTOM_FIELD_TYPE_OPTIONS.find((option) => option.value === normalized);
}

export function customFieldTypeUsesOptions(type: CustomFieldDefinition['type'] | string | undefined): boolean {
  return !!getCustomFieldTypeOption(type)?.supportsOptions;
}

export function customFieldTypeUsesLookupList(type: CustomFieldDefinition['type'] | string | undefined): boolean {
  return !!getCustomFieldTypeOption(type)?.supportsLookupList;
}

export function customFieldTypeUsesDateOnly(type: CustomFieldDefinition['type'] | string | undefined): boolean {
  return !!getCustomFieldTypeOption(type)?.supportsDateOnly;
}

export function mapCustomFieldTypeToSharePoint(type: CustomFieldDefinition['type']): string {
  return getCustomFieldTypeOption(type)?.sharePointType || 'Text';
}
