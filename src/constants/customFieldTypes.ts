import type { CustomFieldDefinition } from '../lib/form-config/types';
import {
  ASSET_STATUSES_LIST_TITLE,
  ASSET_TYPES_LIST_TITLE,
  CATEGORIES_LIST_TITLE,
  LOCATIONS_LIST_TITLE,
  MODEL_NUMBERS_LIST_TITLE,
  PROJECTS_LIST_TITLE,
  SUB_CATEGORIES_LIST_TITLE,
  VENDORS_LIST_TITLE
} from '../models/IListDefinitions.js';

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
  { value: CATEGORIES_LIST_TITLE, label: 'AM_Categories' },
  { value: SUB_CATEGORIES_LIST_TITLE, label: 'AM_SubCategories' },
  { value: ASSET_TYPES_LIST_TITLE, label: 'AM_AssetTypes' },
  { value: ASSET_STATUSES_LIST_TITLE, label: 'AM_AssetStatuses' },
  { value: VENDORS_LIST_TITLE, label: 'AM_Vendors' },
  { value: LOCATIONS_LIST_TITLE, label: 'AM_Locations' },
  { value: PROJECTS_LIST_TITLE, label: 'AM_Projects' },
  { value: MODEL_NUMBERS_LIST_TITLE, label: 'AM_ModelNumbers' }
];

const LEGACY_LOOKUP_LIST_ALIASES: Record<string, string> = {
  Categories: CATEGORIES_LIST_TITLE,
  SubCategories: SUB_CATEGORIES_LIST_TITLE,
  Projects: PROJECTS_LIST_TITLE,
  lstBusiness: CATEGORIES_LIST_TITLE,
  Business: CATEGORIES_LIST_TITLE,
  RiskProfile: ASSET_TYPES_LIST_TITLE,
  RiskResponse: VENDORS_LIST_TITLE,
  RiskStrategy: LOCATIONS_LIST_TITLE
};

export function normalizeLookupListTitle(title: string | undefined): string | undefined {
  if (!title) {
    return title;
  }
  return LEGACY_LOOKUP_LIST_ALIASES[title] || title;
}

export function resolveLookupListOptionLabel(title: string | undefined): string {
  const normalized = normalizeLookupListTitle(title);
  return (
    CUSTOM_FIELD_LOOKUP_LIST_OPTIONS.find((option) => option.value === normalized)?.label ||
    normalized ||
    'Select list'
  );
}

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
