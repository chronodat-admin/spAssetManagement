import { DEFAULT_FORM_SETTINGS } from './defaults.js';
import type {
  EntityFormSettings,
  EntityKey,
  FieldRule,
  FormSettings
} from './types';

export type TabConfig = { key: string; label: string; fields: string[] };

export type BuiltInFieldRow = FieldRule & {
  key: string;
  isDefault: boolean;
  defaultLabel: string;
};

export { CUSTOM_FIELD_TYPE_OPTIONS } from '../../constants/customFieldTypes.js';

export type FormEntityOption = {
  /** Unique dropdown value (multiple lists may share the same entity settings key). */
  id: string;
  entity: EntityKey;
  label: string;
  description: string;
};

/** Lists shown under Settings → Forms → Configure forms for. */
export const FORM_ENTITY_OPTIONS: FormEntityOption[] = [
  {
    id: 'assets',
    entity: 'risks',
    label: 'AM_Assets',
    description: 'Tabs, built-in fields, and custom fields on asset create/edit forms.'
  },
  {
    id: 'categories',
    entity: 'lookups',
    label: 'AM_Categories',
    description: 'Category lookup list create/edit forms.'
  },
  {
    id: 'subCategories',
    entity: 'subCategories',
    label: 'AM_SubCategories',
    description: 'Sub-category lookup list create/edit forms.'
  },
  {
    id: 'vendors',
    entity: 'lookups',
    label: 'AM_Vendors',
    description: 'Vendor lookup list create/edit forms.'
  },
  {
    id: 'locations',
    entity: 'lookups',
    label: 'AM_Locations',
    description: 'Location lookup list create/edit forms.'
  },
  {
    id: 'projects',
    entity: 'projects',
    label: 'AM_Projects',
    description: 'Project lookup list create/edit forms.'
  }
];

export function cloneTabs(tabs: TabConfig[]): TabConfig[] {
  return tabs.map((tab) => ({ key: tab.key, label: tab.label, fields: [...tab.fields] }));
}

export function getDefaultEntitySettings(entity: EntityKey): EntityFormSettings {
  return DEFAULT_FORM_SETTINGS[entity];
}

export function getEntityTabs(entitySettings: EntityFormSettings, entity: EntityKey): TabConfig[] {
  if (entitySettings.tabs && entitySettings.tabs.length > 0) {
    return cloneTabs(entitySettings.tabs);
  }
  const defaults = getDefaultEntitySettings(entity).tabs;
  return defaults ? cloneTabs(defaults) : [{ key: 'general', label: 'General', fields: [] }];
}

export function getBuiltInFieldRows(
  entity: EntityKey,
  entitySettings: EntityFormSettings
): BuiltInFieldRow[] {
  const defaults = getDefaultEntitySettings(entity).fields;
  const order =
    entitySettings.order ||
    getDefaultEntitySettings(entity).order ||
    Object.keys({ ...defaults, ...entitySettings.fields });

  const keys = Array.from(
    new Set([...order, ...Object.keys(defaults), ...Object.keys(entitySettings.fields)])
  );

  return keys
    .map((key) => {
      const base = defaults[key];
      const current = entitySettings.fields[key];
      if (!base && !current) {
        return null;
      }
      const merged: FieldRule = {
        label: current?.label ?? base?.label ?? key,
        type: current?.type ?? base?.type,
        create: current?.create ?? base?.create ?? true,
        createRequired: current?.createRequired ?? base?.createRequired ?? false,
        edit: current?.edit ?? base?.edit ?? true,
        editRequired: current?.editRequired ?? base?.editRequired ?? false,
        view: current?.view ?? base?.view ?? true,
        options: current?.options ?? base?.options
      };
      const isDefault =
        !!base &&
        !!current &&
        merged.label === base.label &&
        merged.create === base.create &&
        merged.createRequired === base.createRequired &&
        merged.edit === base.edit &&
        merged.editRequired === base.editRequired &&
        merged.view === base.view;

      return {
        key,
        ...merged,
        isDefault: !current || (!!base && isDefault),
        defaultLabel: base?.label ?? key
      };
    })
    .filter(Boolean) as BuiltInFieldRow[];
}

export function getFieldTab(fieldKey: string, tabs: TabConfig[]): string {
  for (const tab of tabs) {
    if (tab.fields.includes(fieldKey)) {
      return tab.key;
    }
  }
  return tabs[0]?.key || 'general';
}

export function sanitizeFieldKey(raw: string, fallback: string): string {
  const key = raw.replace(/[^a-zA-Z0-9_]/g, '_');
  return key || fallback;
}

export function generateUniqueCustomFieldKey(prefix: string, existing: Set<string>): string {
  let key = '';
  do {
    const suffix = Math.random().toString(36).slice(2, 8);
    key = sanitizeFieldKey(`${prefix}_${Date.now()}_${suffix}`, `${prefix}_${suffix}`);
  } while (existing.has(key));
  return key;
}

export function updateEntitySettings(
  formSettings: FormSettings,
  entity: EntityKey,
  patch: Partial<EntityFormSettings>
): FormSettings {
  return {
    ...formSettings,
    [entity]: {
      ...formSettings[entity],
      ...patch,
      fields: patch.fields ? patch.fields : formSettings[entity].fields
    }
  };
}

export function updateEntityFieldRule(
  formSettings: FormSettings,
  entity: EntityKey,
  fieldKey: string,
  patch: Partial<FieldRule>
): FormSettings {
  const entitySettings = formSettings[entity];
  const current = entitySettings.fields[fieldKey] || getBuiltInFieldRows(entity, entitySettings).find(
    (row) => row.key === fieldKey
  );
  if (!current) {
    return formSettings;
  }

  const nextRule: FieldRule = {
    label: current.label,
    type: current.type,
    create: current.create,
    createRequired: current.createRequired,
    edit: current.edit,
    editRequired: current.editRequired,
    view: current.view,
    options: current.options,
    ...patch
  };

  if (patch.create === false) {
    nextRule.createRequired = false;
  }
  if (patch.edit === false) {
    nextRule.editRequired = false;
  }

  return updateEntitySettings(formSettings, entity, {
    fields: {
      ...entitySettings.fields,
      [fieldKey]: nextRule
    }
  });
}

export function resetEntityFieldRule(
  formSettings: FormSettings,
  entity: EntityKey,
  fieldKey: string
): FormSettings {
  const defaults = getDefaultEntitySettings(entity).fields[fieldKey];
  if (!defaults) {
    const nextFields = { ...formSettings[entity].fields };
    delete nextFields[fieldKey];
    return updateEntitySettings(formSettings, entity, { fields: nextFields });
  }

  return updateEntitySettings(formSettings, entity, {
    fields: {
      ...formSettings[entity].fields,
      [fieldKey]: { ...defaults }
    }
  });
}

export function resetEntityToDefaults(formSettings: FormSettings, entity: EntityKey): FormSettings {
  return {
    ...formSettings,
    [entity]: { ...getDefaultEntitySettings(entity), customFields: [] }
  };
}

export function moveFieldToTab(
  tabs: TabConfig[],
  fieldKey: string,
  newTabKey: string
): TabConfig[] {
  const next = cloneTabs(tabs);
  for (const tab of next) {
    tab.fields = tab.fields.filter((field) => field !== fieldKey);
  }
  const target = next.find((tab) => tab.key === newTabKey);
  if (target && !target.fields.includes(fieldKey)) {
    target.fields.push(fieldKey);
  }
  return next;
}

export function addTab(tabs: TabConfig[]): TabConfig[] {
  const keys = new Set(tabs.map((tab) => tab.key));
  let index = tabs.length + 1;
  let key = `tab_${index}`;
  while (keys.has(key)) {
    index += 1;
    key = `tab_${index}`;
  }
  return [...tabs, { key, label: `New Tab ${index}`, fields: [] }];
}

export function removeTab(tabs: TabConfig[], tabKey: string): TabConfig[] {
  if (tabs.length <= 1) {
    return tabs;
  }
  const removing = tabs.find((tab) => tab.key === tabKey);
  const remaining = tabs.filter((tab) => tab.key !== tabKey);
  if (removing && removing.fields.length > 0 && remaining[0]) {
    remaining[0] = {
      ...remaining[0],
      fields: [...remaining[0].fields, ...removing.fields]
    };
  }
  return remaining;
}

export function moveTab(tabs: TabConfig[], tabKey: string, direction: 'up' | 'down'): TabConfig[] {
  const index = tabs.findIndex((tab) => tab.key === tabKey);
  if (index < 0) {
    return tabs;
  }
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= tabs.length) {
    return tabs;
  }
  const next = [...tabs];
  const temp = next[index];
  next[index] = next[newIndex];
  next[newIndex] = temp;
  return next;
}

export function moveFieldInTab(
  tabs: TabConfig[],
  tabKey: string,
  fieldKey: string,
  direction: 'up' | 'down'
): TabConfig[] {
  const next = cloneTabs(tabs);
  const tab = next.find((entry) => entry.key === tabKey);
  if (!tab) {
    return tabs;
  }
  const fieldIndex = tab.fields.indexOf(fieldKey);
  if (fieldIndex < 0) {
    return tabs;
  }
  const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
  if (newIndex < 0 || newIndex >= tab.fields.length) {
    return tabs;
  }
  const temp = tab.fields[fieldIndex];
  tab.fields[fieldIndex] = tab.fields[newIndex];
  tab.fields[newIndex] = temp;
  return next;
}

export function supportsTabs(entity: EntityKey): boolean {
  return entity === 'risks' || entity === 'business' || entity === 'projects';
}
