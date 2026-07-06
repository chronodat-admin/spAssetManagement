import type { FormTemplateField, TemplateValues } from './types';

export function validateTemplateFields(
  fields: FormTemplateField[],
  values: TemplateValues
): string | null {
  for (const field of fields) {
    if (!field.required) {
      continue;
    }
    const current = values[field.id];
    if (field.type === 'checkbox') {
      if (current !== true) {
        return `${field.label} is required.`;
      }
      continue;
    }
    if (field.type === 'user_lookup' || field.type === 'user_multi') {
      if (!Array.isArray(current) || current.length === 0) {
        return `${field.label} is required.`;
      }
      continue;
    }
    if (current === undefined || current === null || String(current).trim() === '') {
      return `${field.label} is required.`;
    }
  }
  return null;
}
