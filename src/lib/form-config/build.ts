import { DEFAULT_FORM_SETTINGS } from './defaults';
import { mergeCustomFieldsIntoFormConfig } from './mergeCustomFields';
import type { BuiltFieldConfig, BuiltFormConfig, EntityKey, FormMode, FormSettings } from './types';

export function buildFormConfig(
  formSettings: FormSettings,
  entity: EntityKey,
  mode: FormMode
): BuiltFormConfig {
  const entitySettings = formSettings[entity] || DEFAULT_FORM_SETTINGS[entity];
  const fields = entitySettings.fields || {};
  const map: Record<string, BuiltFieldConfig> = {};

  for (const key of Object.keys(fields)) {
    const cfg = fields[key];
    const visible = mode === 'create' ? cfg.create : mode === 'edit' ? cfg.edit : cfg.view;
    const required = mode === 'create' ? cfg.createRequired : mode === 'edit' ? cfg.editRequired : false;
    map[key] = { label: cfg.label, type: cfg.type, visible, required, options: cfg.options };
  }

  const explicitOrder = entitySettings.order || [];
  const keys = Object.keys(map);
  const orderedKeys =
    explicitOrder.length > 0
      ? [...explicitOrder.filter((k) => keys.includes(k)), ...keys.filter((k) => !explicitOrder.includes(k))]
      : keys;

  const tabsByMode = entitySettings.tabsByMode;
  let tabs = entitySettings.tabs;
  if (tabsByMode) {
    if (mode === 'create' && tabsByMode.create) {
      tabs = tabsByMode.create;
    } else if (mode === 'edit' && tabsByMode.edit) {
      tabs = tabsByMode.edit;
    }
  }

  const customFields = (entitySettings.customFields || []).map((field) => {
    const legacy = !!field.required;
    const required =
      mode === 'create'
        ? (field.createRequired ?? legacy)
        : mode === 'edit'
          ? (field.editRequired ?? legacy)
          : false;
    return { ...field, required };
  });

  const baseConfig: BuiltFormConfig = { entity, mode, fields: map, orderedKeys, tabs, customFields };
  return mergeCustomFieldsIntoFormConfig(baseConfig);
}
