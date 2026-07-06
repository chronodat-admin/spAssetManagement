import { IAppSettings } from '../../models/IAssetApp';
import { normalizeCustomFieldType } from '../../constants/customFieldTypes';
import { DEFAULT_FORM_SETTINGS } from './defaults';
import type { FormSettings } from './types';

function deepMergeFormSettings(base: FormSettings, patch?: Partial<FormSettings>): FormSettings {
  if (!patch) {
    return base;
  }

  const entities = ['risks', 'business', 'lookups', 'projects', 'subCategories'] as const;
  const merged: FormSettings = { ...base };

  for (const entity of entities) {
    const baseEntity = base[entity];
    const patchEntity = patch[entity];
    if (!patchEntity) {
      merged[entity] = baseEntity;
      continue;
    }

    merged[entity] = {
      ...baseEntity,
      ...patchEntity,
      fields: { ...baseEntity.fields, ...patchEntity.fields },
      order: patchEntity.order || baseEntity.order,
      tabs: patchEntity.tabs || baseEntity.tabs,
      tabsByMode: patchEntity.tabsByMode || baseEntity.tabsByMode,
      customFields: patchEntity.customFields || baseEntity.customFields
    };
  }

  return merged;
}

function normalizeFormSettings(formSettings: FormSettings): FormSettings {
  const entities = ['risks', 'business', 'lookups', 'projects', 'subCategories'] as const;
  const normalized = { ...formSettings };

  for (const entity of entities) {
    const defaults = DEFAULT_FORM_SETTINGS[entity];
    const current = normalized[entity] || defaults;
    normalized[entity] = {
      ...defaults,
      ...current,
      fields: { ...defaults.fields, ...(current.fields || {}) },
      tabs: current.tabs || defaults.tabs,
      customFields: normalizeCustomFields(current.customFields || defaults.customFields)
    };
  }

  return normalized;
}

export function parseFormSettings(settings?: IAppSettings): FormSettings {
  if (!settings?.RequestFormTabs) {
    return normalizeFormSettings({ ...DEFAULT_FORM_SETTINGS });
  }

  try {
    const parsed = JSON.parse(settings.RequestFormTabs) as Partial<FormSettings> & {
      renderingMode?: string;
    };
    delete parsed.renderingMode;
    return normalizeFormSettings(deepMergeFormSettings(DEFAULT_FORM_SETTINGS, parsed));
  } catch {
    return normalizeFormSettings({ ...DEFAULT_FORM_SETTINGS });
  }
}

export function serializeFormSettings(formSettings: FormSettings): string {
  return JSON.stringify(formSettings);
}

export function parseCustomFieldExtensions(settings?: IAppSettings): FormSettings['risks']['customFields'] {
  if (!settings?.RequestNewFormFields) {
    return normalizeCustomFields(parseFormSettings(settings).risks.customFields);
  }

  try {
    const parsed = JSON.parse(settings.RequestNewFormFields) as FormSettings['risks']['customFields'];
    return normalizeCustomFields(parsed || []);
  } catch {
    return [];
  }
}

function normalizeCustomFields(
  fields: FormSettings['risks']['customFields'] | undefined
): FormSettings['risks']['customFields'] {
  if (!fields?.length) {
    return fields || [];
  }

  return fields.map((field) => ({
    ...field,
    type: normalizeCustomFieldType(field.type)
  }));
}
