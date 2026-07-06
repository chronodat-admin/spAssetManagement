import type { BuiltFieldConfig, BuiltFormConfig } from './types';

export const CUSTOM_FIELDS_TAB_KEY = 'custom';
export const CUSTOM_FIELDS_TAB_LABEL = 'Custom Fields';

function cloneTabs(tabs: Array<{ key: string; label: string; fields: string[] }>) {
  return tabs.map((tab) => ({ key: tab.key, label: tab.label, fields: [...tab.fields] }));
}

/** Places custom fields on their assigned form tab instead of repeating on every tab. */
export function mergeCustomFieldsIntoFormConfig(config: BuiltFormConfig): BuiltFormConfig {
  const customFields = config.customFields || [];
  if (customFields.length === 0) {
    return config;
  }

  const fields: Record<string, BuiltFieldConfig> = { ...config.fields };
  for (const customField of customFields) {
    fields[customField.key] = {
      label: customField.label,
      type: customField.type,
      visible: config.mode === 'view' ? true : true,
      required: customField.required,
      options: customField.options
    };
  }

  const customKeys = new Set(customFields.map((field) => field.key));
  const orderedKeys = [
    ...config.orderedKeys,
    ...customFields.map((field) => field.key).filter((key) => !config.orderedKeys.includes(key))
  ];

  if (!config.tabs?.length) {
    return { ...config, fields, orderedKeys };
  }

  const tabs = cloneTabs(config.tabs);
  for (const tab of tabs) {
    tab.fields = tab.fields.filter((fieldKey) => !customKeys.has(fieldKey));
  }

  for (const customField of customFields) {
    const targetTabKey = customField.tab || CUSTOM_FIELDS_TAB_KEY;
    let tab = tabs.find((entry) => entry.key === targetTabKey);
    if (!tab && targetTabKey === CUSTOM_FIELDS_TAB_KEY) {
      tab = {
        key: CUSTOM_FIELDS_TAB_KEY,
        label: CUSTOM_FIELDS_TAB_LABEL,
        fields: []
      };
      tabs.push(tab);
    }
    if (tab && !tab.fields.includes(customField.key)) {
      tab.fields.push(customField.key);
    }
  }

  return { ...config, fields, orderedKeys, tabs };
}

export function ensureCustomFieldsTab(
  tabs: Array<{ key: string; label: string; fields: string[] }>
): Array<{ key: string; label: string; fields: string[] }> {
  if (tabs.some((tab) => tab.key === CUSTOM_FIELDS_TAB_KEY)) {
    return tabs;
  }
  return [...tabs, { key: CUSTOM_FIELDS_TAB_KEY, label: CUSTOM_FIELDS_TAB_LABEL, fields: [] }];
}

export function removeFieldFromTabs(
  tabs: Array<{ key: string; label: string; fields: string[] }>,
  fieldKey: string
): Array<{ key: string; label: string; fields: string[] }> {
  return tabs.map((tab) => ({
    ...tab,
    fields: tab.fields.filter((key) => key !== fieldKey)
  }));
}
