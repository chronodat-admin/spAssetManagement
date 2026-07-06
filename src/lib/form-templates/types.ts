import { IPersonPickerItem } from '../../models/IPersonPickerItem';

export interface FormTemplateTab {
  id: string;
  label: string;
}

/** Maps to SharePoint column types where applicable. */
export type FormTemplateFieldType =
  | 'text'
  | 'textarea'
  | 'dropdown'
  | 'checkbox'
  | 'date'
  | 'number'
  | 'currency'
  | 'email'
  | 'url'
  | 'user_lookup'
  | 'user_multi';

export const FORM_TEMPLATE_FIELD_TYPES: ReadonlyArray<{
  value: FormTemplateFieldType;
  label: string;
  sharePointType?: string;
}> = [
  { value: 'text', label: 'Single line of text', sharePointType: 'Text' },
  { value: 'textarea', label: 'Multiple lines of text', sharePointType: 'Note' },
  { value: 'dropdown', label: 'Choice', sharePointType: 'Choice' },
  { value: 'checkbox', label: 'Yes/No', sharePointType: 'Boolean' },
  { value: 'date', label: 'Date and Time', sharePointType: 'DateTime' },
  { value: 'number', label: 'Number', sharePointType: 'Number' },
  { value: 'currency', label: 'Currency', sharePointType: 'Currency' },
  { value: 'url', label: 'Hyperlink', sharePointType: 'URL' },
  { value: 'email', label: 'Email' },
  { value: 'user_lookup', label: 'User or Group', sharePointType: 'User' },
  { value: 'user_multi', label: 'User or Group (multiple)', sharePointType: 'UserMulti' }
];

export function getFormTemplateFieldTypeLabel(type: FormTemplateFieldType): string {
  return FORM_TEMPLATE_FIELD_TYPES.find((entry) => entry.value === type)?.label || type;
}

export interface FormTemplateField {
  id: string;
  type: FormTemplateFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  /** When tabs are used, assigns this field to a tab. */
  tab_id?: string;
  /** Links a currency field to a sibling currency-code dropdown. */
  linked_field_id?: string;
}

export interface AssetFormTemplate {
  /** SharePoint list item id (undefined for unsaved drafts). */
  id?: number;
  name: string;
  categoryId: number | null;
  categoryName?: string | null;
  fields: FormTemplateField[];
  tabs?: FormTemplateTab[];
  isActive: boolean;
}

export interface AssetFormTemplateInput {
  name: string;
  categoryId: number | null;
  fields: FormTemplateField[];
  tabs?: FormTemplateTab[];
  isActive: boolean;
}

/** Stored per-risk in the Risks list `TemplateData` JSON column, keyed by field id. */
export type TemplateFieldValue = string | boolean | IPersonPickerItem[];
export type TemplateValues = Record<string, TemplateFieldValue>;

export function parseTemplateFields(raw: unknown): FormTemplateField[] {
  if (Array.isArray(raw)) {
    return raw as FormTemplateField[];
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as FormTemplateField[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function parseTemplateTabs(raw: unknown): FormTemplateTab[] | undefined {
  if (Array.isArray(raw)) {
    return raw.length > 0 ? (raw as FormTemplateTab[]) : undefined;
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? (parsed as FormTemplateTab[]) : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function parseTemplateValues(raw: unknown): TemplateValues {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as TemplateValues;
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as TemplateValues)
        : {};
    } catch {
      return {};
    }
  }
  return {};
}
