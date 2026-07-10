import * as React from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Option,
  Switch,
  Tab,
  TabList,
  Text,
  Textarea,
  makeStyles,
  mergeClasses,
  tokens
} from '@fluentui/react-components';
import {
  AddRegular,
  ArrowDownRegular,
  ArrowUpRegular,
  DeleteRegular,
  DismissRegular,
  EditRegular,
  EyeOffRegular,
  EyeRegular,
  ArrowResetRegular
} from '@fluentui/react-icons';
import { AppDropdown } from '../Dropdown/AppDropdown';
import {
  CUSTOM_FIELD_LOOKUP_LIST_OPTIONS,
  CUSTOM_FIELD_TYPE_OPTIONS,
  customFieldTypeUsesDateOnly,
  customFieldTypeUsesLookupList,
  customFieldTypeUsesOptions,
  getCustomFieldTypeOption,
  normalizeCustomFieldType,
  normalizeLookupListTitle,
  resolveLookupListOptionLabel
} from '../../constants/customFieldTypes';
import {
  addTab,
  generateUniqueCustomFieldKey,
  getBuiltInFieldRows,
  getEntityTabs,
  getFieldTab,
  moveFieldInTab,
  moveFieldToTab,
  moveTab,
  removeTab,
  resetEntityFieldRule,
  resetEntityToDefaults,
  supportsTabs,
  updateEntityFieldRule,
  updateEntitySettings
} from '../../lib/form-config/entityFormSettingsUtils';
import {
  CUSTOM_FIELDS_TAB_KEY,
  CUSTOM_FIELDS_TAB_LABEL,
  ensureCustomFieldsTab,
  removeFieldFromTabs
} from '../../lib/form-config/mergeCustomFields';
import type { CustomFieldDefinition, EntityFormSettings, EntityKey, FormSettings } from '../../lib/form-config/types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: 0
  },
  summaryRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS
  },
  panel: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalL,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2
  },
  panelBody: {
    padding: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalL
  },
  tableScroll: {
    overflowX: 'auto',
    width: '100%',
    WebkitOverflowScrolling: 'touch'
  },
  fieldsTable: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '860px',
    width: '100%'
  },
  fieldsRow: {
    display: 'grid',
    columnGap: tokens.spacingHorizontalS,
    alignItems: 'center',
    paddingBlock: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    width: '100%'
  },
  fieldsRowWithTabs: {
    gridTemplateColumns:
      'minmax(220px, 2.4fr) minmax(150px, 1.4fr) 72px 56px 72px 56px 72px 96px'
  },
  fieldsRowWithoutTabs: {
    gridTemplateColumns: 'minmax(220px, 2.4fr) 72px 56px 72px 56px 72px 96px'
  },
  fieldsHeaderRow: {
    backgroundColor: tokens.colorNeutralBackground2,
    position: 'sticky',
    top: 0,
    zIndex: 1
  },
  fieldsDataRow: {
    minHeight: '52px'
  },
  headerCell: {
    backgroundColor: tokens.colorNeutralBackground2,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'nowrap',
    color: tokens.colorNeutralForeground2
  },
  headerCellCenter: {
    textAlign: 'center'
  },
  fieldCell: {
    minWidth: 0,
    paddingRight: tokens.spacingHorizontalS
  },
  tabCell: {
    minWidth: 0
  },
  fieldKey: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontFamily: tokens.fontFamilyMonospace
  },
  rowHidden: {
    opacity: 0.55,
    backgroundColor: tokens.colorNeutralBackground2
  },
  rowModified: {
    backgroundColor: tokens.colorPaletteYellowBackground1
  },
  switchCell: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  actionCell: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
    width: '100%'
  },
  tabCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  tabCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS
  },
  tabFieldList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS
  },
  tabFieldRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground2
  },
  customFieldCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalM,
    display: 'grid',
    gap: tokens.spacingVerticalM
  },
  customFieldGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM
  },
  emptyHint: {
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL
  }
});

type SettingsSection = 'builtin' | 'tabs' | 'custom';

export interface IEntityFormSettingsEditorProps {
  entity: EntityKey;
  formSettings: FormSettings;
  onChange: (next: FormSettings) => void;
}

export const EntityFormSettingsEditor: React.FC<IEntityFormSettingsEditorProps> = ({
  entity,
  formSettings,
  onChange
}) => {
  const styles = useStyles();
  const entitySettings = formSettings[entity];
  const [section, setSection] = React.useState<SettingsSection>('builtin');
  const [editingLabelKey, setEditingLabelKey] = React.useState<string | null>(null);
  const [editLabelValue, setEditLabelValue] = React.useState('');
  const [editingTabKey, setEditingTabKey] = React.useState<string | null>(null);
  const [editTabLabelValue, setEditTabLabelValue] = React.useState('');
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);

  const tabs = getEntityTabs(entitySettings, entity);
  const builtInFields = getBuiltInFieldRows(entity, entitySettings);
  const customFields = entitySettings.customFields || [];
  const hiddenCount = builtInFields.filter((field) => !field.create && !field.edit && !field.view).length;
  const modifiedCount = builtInFields.filter((field) => !field.isDefault).length;
  const showTabsSection = supportsTabs(entity);

  const patchEntity = (patch: Partial<EntityFormSettings>): void => {
    onChange(updateEntitySettings(formSettings, entity, patch));
  };

  const patchField = (fieldKey: string, patch: Parameters<typeof updateEntityFieldRule>[3]): void => {
    onChange(updateEntityFieldRule(formSettings, entity, fieldKey, patch));
  };

  const hideField = (fieldKey: string): void => {
    patchField(fieldKey, { create: false, edit: false, view: false, createRequired: false, editRequired: false });
  };

  const showField = (fieldKey: string): void => {
    patchField(fieldKey, { create: true, edit: true, view: true });
  };

  const updateCustomField = (index: number, patch: Partial<CustomFieldDefinition>): void => {
    const current = customFields[index];
    const nextCustomFields = customFields.map((field, fieldIndex) =>
      fieldIndex === index ? { ...field, ...patch } : field
    );
    let nextTabs = tabs;
    if (current && patch.tab && patch.tab !== current.tab && showTabsSection) {
      nextTabs = moveFieldToTab(tabs, current.key, patch.tab);
    }
    patchEntity({ customFields: nextCustomFields, tabs: nextTabs });
  };

  const removeCustomField = (index: number): void => {
    const removed = customFields[index];
    patchEntity({
      customFields: customFields.filter((_, fieldIndex) => fieldIndex !== index),
      tabs: removed ? removeFieldFromTabs(tabs, removed.key) : tabs
    });
  };

  const addCustomField = (): void => {
    const keys = new Set(customFields.map((field) => field.key));
    const key = generateUniqueCustomFieldKey(`${entity}_cf`, keys);
    const nextTabs = showTabsSection ? ensureCustomFieldsTab(tabs) : tabs;
    const defaultTab = showTabsSection ? CUSTOM_FIELDS_TAB_KEY : tabs[0]?.key || 'general';
    patchEntity({
      tabs: showTabsSection ? moveFieldToTab(nextTabs, key, defaultTab) : nextTabs,
      customFields: [
        ...customFields,
        {
          key,
          label: 'New Field',
          type: 'text',
          tab: defaultTab,
          createRequired: false,
          editRequired: false
        }
      ]
    });
  };

  return (
    <div className={styles.root}>
      <div className={styles.summaryRow}>
        <Badge appearance="outline">{builtInFields.length} built-in fields</Badge>
        {showTabsSection ? <Badge appearance="outline">{tabs.length} tabs</Badge> : null}
        {modifiedCount > 0 ? <Badge appearance="filled" color="warning">{modifiedCount} modified</Badge> : null}
        {hiddenCount > 0 ? <Badge appearance="filled" color="danger">{hiddenCount} hidden</Badge> : null}
        {customFields.length > 0 ? (
          <Badge appearance="filled" color="brand">
            {customFields.length} custom field{customFields.length === 1 ? '' : 's'}
          </Badge>
        ) : null}
      </div>

      <TabList
        selectedValue={section}
        onTabSelect={(_, data) => setSection((data.value as SettingsSection) || 'builtin')}
      >
        <Tab value="builtin">Built-in Fields</Tab>
        {showTabsSection ? <Tab value="tabs">Tabs ({tabs.length})</Tab> : null}
        <Tab value="custom">Custom Fields ({customFields.length})</Tab>
      </TabList>

      {section === 'builtin' && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <Text weight="semibold">Built-in field configuration</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                Toggle visibility, required status, labels, and tab assignment.
              </Text>
            </div>
            <Button appearance="secondary" icon={<ArrowResetRegular />} onClick={() => setResetDialogOpen(true)}>
              Reset all
            </Button>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.tableScroll}>
              <div className={styles.fieldsTable} role="table" aria-label="Built-in form fields">
                <div
                  className={mergeClasses(
                    styles.fieldsRow,
                    showTabsSection ? styles.fieldsRowWithTabs : styles.fieldsRowWithoutTabs,
                    styles.fieldsHeaderRow
                  )}
                  role="row"
                >
                  <div className={mergeClasses(styles.headerCell, styles.fieldCell)} role="columnheader">
                    Field
                  </div>
                  {showTabsSection ? (
                    <div className={styles.headerCell} role="columnheader">
                      Tab
                    </div>
                  ) : null}
                  <div className={mergeClasses(styles.headerCell, styles.headerCellCenter)} role="columnheader">
                    Create
                  </div>
                  <div className={mergeClasses(styles.headerCell, styles.headerCellCenter)} role="columnheader">
                    Req.
                  </div>
                  <div className={mergeClasses(styles.headerCell, styles.headerCellCenter)} role="columnheader">
                    Edit
                  </div>
                  <div className={mergeClasses(styles.headerCell, styles.headerCellCenter)} role="columnheader">
                    Req.
                  </div>
                  <div className={mergeClasses(styles.headerCell, styles.headerCellCenter)} role="columnheader">
                    View
                  </div>
                  <div className={mergeClasses(styles.headerCell, styles.headerCellCenter)} role="columnheader">
                    Actions
                  </div>
                </div>
                {builtInFields.map((field) => {
                  const isHidden = !field.create && !field.edit && !field.view;
                  const currentTabKey = getFieldTab(field.key, tabs);
                  return (
                    <div
                      key={field.key}
                      className={mergeClasses(
                        styles.fieldsRow,
                        showTabsSection ? styles.fieldsRowWithTabs : styles.fieldsRowWithoutTabs,
                        styles.fieldsDataRow,
                        isHidden && styles.rowHidden,
                        !field.isDefault && !isHidden && styles.rowModified
                      )}
                      role="row"
                    >
                      <div className={styles.fieldCell} role="cell">
                        {editingLabelKey === field.key ? (
                          <Input
                            value={editLabelValue}
                            autoFocus
                            onChange={(_, data) => setEditLabelValue(data.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                if (editLabelValue.trim()) {
                                  patchField(field.key, { label: editLabelValue.trim() });
                                }
                                setEditingLabelKey(null);
                              }
                              if (event.key === 'Escape') {
                                setEditingLabelKey(null);
                              }
                            }}
                            onBlur={() => {
                              if (editLabelValue.trim()) {
                                patchField(field.key, { label: editLabelValue.trim() });
                              }
                              setEditingLabelKey(null);
                            }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
                            <Text weight="semibold">{field.label}</Text>
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<EditRegular />}
                              aria-label={`Edit label for ${field.key}`}
                              onClick={() => {
                                setEditingLabelKey(field.key);
                                setEditLabelValue(field.label);
                              }}
                            />
                            {!field.isDefault ? <Badge size="small">Modified</Badge> : null}
                          </div>
                        )}
                        <div className={styles.fieldKey}>{field.key}</div>
                      </div>
                      {showTabsSection ? (
                        <div className={styles.tabCell} role="cell">
                          <AppDropdown
                            value={tabs.find((tab) => tab.key === currentTabKey)?.label || currentTabKey}
                            selectedOptions={[currentTabKey]}
                            onOptionSelect={(_, data) => {
                              const nextTab = data.optionValue;
                              if (nextTab) {
                                patchEntity({ tabs: moveFieldToTab(tabs, field.key, nextTab) });
                              }
                            }}
                          >
                            {tabs.map((tab) => (
                              <Option key={tab.key} value={tab.key}>
                                {tab.label}
                              </Option>
                            ))}
                          </AppDropdown>
                        </div>
                      ) : null}
                      <div className={styles.switchCell} role="cell">
                        <Switch
                          checked={field.create}
                          onChange={(_, data) => patchField(field.key, { create: data.checked })}
                        />
                      </div>
                      <div className={styles.switchCell} role="cell">
                        <Switch
                          checked={field.createRequired}
                          disabled={!field.create}
                          onChange={(_, data) => patchField(field.key, { createRequired: data.checked })}
                        />
                      </div>
                      <div className={styles.switchCell} role="cell">
                        <Switch
                          checked={field.edit}
                          onChange={(_, data) => patchField(field.key, { edit: data.checked })}
                        />
                      </div>
                      <div className={styles.switchCell} role="cell">
                        <Switch
                          checked={field.editRequired}
                          disabled={!field.edit}
                          onChange={(_, data) => patchField(field.key, { editRequired: data.checked })}
                        />
                      </div>
                      <div className={styles.switchCell} role="cell">
                        <Switch
                          checked={field.view}
                          onChange={(_, data) => patchField(field.key, { view: data.checked })}
                        />
                      </div>
                      <div className={styles.actionCell} role="cell">
                        {isHidden ? (
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<EyeRegular />}
                            aria-label={`Show ${field.key}`}
                            onClick={() => showField(field.key)}
                          />
                        ) : (
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<EyeOffRegular />}
                            aria-label={`Hide ${field.key}`}
                            onClick={() => hideField(field.key)}
                          />
                        )}
                        {!field.isDefault ? (
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<ArrowResetRegular />}
                            aria-label={`Reset ${field.key}`}
                            onClick={() => onChange(resetEntityFieldRule(formSettings, entity, field.key))}
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {section === 'tabs' && showTabsSection && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <Text weight="semibold">Form tabs</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                Reorder tabs and move fields between sections.
              </Text>
            </div>
            <Button appearance="primary" icon={<AddRegular />} onClick={() => patchEntity({ tabs: addTab(tabs) })}>
              Add tab
            </Button>
          </div>
          <div className={styles.panelBody} style={{ display: 'grid', gap: tokens.spacingVerticalM }}>
            {tabs.map((tab, tabIndex) => (
              <div key={tab.key} className={styles.tabCard}>
                <div className={styles.tabCardHeader}>
                  {editingTabKey === tab.key ? (
                    <Input
                      value={editTabLabelValue}
                      autoFocus
                      onChange={(_, data) => setEditTabLabelValue(data.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          if (editTabLabelValue.trim()) {
                            patchEntity({
                              tabs: tabs.map((entry) =>
                                entry.key === tab.key ? { ...entry, label: editTabLabelValue.trim() } : entry
                              )
                            });
                          }
                          setEditingTabKey(null);
                        }
                        if (event.key === 'Escape') {
                          setEditingTabKey(null);
                        }
                      }}
                      onBlur={() => {
                        if (editTabLabelValue.trim()) {
                          patchEntity({
                            tabs: tabs.map((entry) =>
                              entry.key === tab.key ? { ...entry, label: editTabLabelValue.trim() } : entry
                            )
                          });
                        }
                        setEditingTabKey(null);
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
                      <Text weight="semibold">{tab.label}</Text>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<EditRegular />}
                        aria-label={`Edit tab label ${tab.key}`}
                        onClick={() => {
                          setEditingTabKey(tab.key);
                          setEditTabLabelValue(tab.label);
                        }}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: tokens.spacingHorizontalXXS }}>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ArrowUpRegular />}
                      disabled={tabIndex === 0}
                      aria-label="Move tab up"
                      onClick={() => patchEntity({ tabs: moveTab(tabs, tab.key, 'up') })}
                    />
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ArrowDownRegular />}
                      disabled={tabIndex === tabs.length - 1}
                      aria-label="Move tab down"
                      onClick={() => patchEntity({ tabs: moveTab(tabs, tab.key, 'down') })}
                    />
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<DeleteRegular />}
                      disabled={tabs.length <= 1}
                      aria-label="Remove tab"
                      onClick={() => patchEntity({ tabs: removeTab(tabs, tab.key) })}
                    />
                  </div>
                </div>
                <div className={styles.tabFieldList}>
                  {tab.fields.length === 0 ? (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      No fields assigned to this tab.
                    </Text>
                  ) : (
                    tab.fields.map((fieldKey, fieldIndex) => {
                      const field = builtInFields.find((entry) => entry.key === fieldKey);
                      return (
                        <div key={fieldKey} className={styles.tabFieldRow}>
                          <Text size={300}>{field?.label || fieldKey}</Text>
                          <div style={{ display: 'flex', gap: tokens.spacingHorizontalXXS }}>
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<ArrowUpRegular />}
                              disabled={fieldIndex === 0}
                              aria-label="Move field up"
                              onClick={() =>
                                patchEntity({ tabs: moveFieldInTab(tabs, tab.key, fieldKey, 'up') })
                              }
                            />
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<ArrowDownRegular />}
                              disabled={fieldIndex === tab.fields.length - 1}
                              aria-label="Move field down"
                              onClick={() =>
                                patchEntity({ tabs: moveFieldInTab(tabs, tab.key, fieldKey, 'down') })
                              }
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'custom' && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <Text weight="semibold">Custom fields</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                Add extra fields stored with each record. Saved settings apply after you save Settings.
              </Text>
            </div>
            <Button appearance="primary" icon={<AddRegular />} onClick={addCustomField}>
              Add custom field
            </Button>
          </div>
          <div className={styles.panelBody} style={{ display: 'grid', gap: tokens.spacingVerticalM }}>
            {customFields.length === 0 ? (
              <div className={styles.emptyHint}>No custom fields yet. Add one to extend this form.</div>
            ) : (
              customFields.map((field, index) => (
                <div key={field.key} className={styles.customFieldCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: tokens.spacingHorizontalM }}>
                    <Text weight="semibold">{field.label || 'Custom field'}</Text>
                    <Button
                      appearance="subtle"
                      icon={<DeleteRegular />}
                      aria-label={`Remove ${field.key}`}
                      onClick={() => removeCustomField(index)}
                    />
                  </div>
                  <div className={styles.customFieldGrid}>
                    <Field label="Label">
                      <Input
                        value={field.label}
                        onChange={(_, data) => updateCustomField(index, { label: data.value })}
                      />
                    </Field>
                    <Field label="Field key">
                      <Input value={field.key} disabled />
                    </Field>
                    <Field label="Type">
                      <AppDropdown
                        value={
                          getCustomFieldTypeOption(field.type)?.label || field.type
                        }
                        selectedOptions={[normalizeCustomFieldType(field.type)]}
                        onOptionSelect={(_, data) => {
                          const nextType = normalizeCustomFieldType(data.optionValue);
                          const patch: Partial<CustomFieldDefinition> = { type: nextType };
                          if (!customFieldTypeUsesOptions(nextType)) {
                            patch.options = undefined;
                          }
                          if (!customFieldTypeUsesLookupList(nextType)) {
                            patch.lookupListTitle = undefined;
                            patch.lookupField = undefined;
                          }
                          if (!customFieldTypeUsesDateOnly(nextType)) {
                            patch.dateOnly = undefined;
                          }
                          updateCustomField(index, patch);
                        }}
                      >
                        {CUSTOM_FIELD_TYPE_OPTIONS.map((option) => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        ))}
                      </AppDropdown>
                    </Field>
                    {showTabsSection ? (
                      <Field label="Tab">
                        <AppDropdown
                          value={
                            tabs.find((tab) => tab.key === field.tab)?.label ||
                            (field.tab === CUSTOM_FIELDS_TAB_KEY ? CUSTOM_FIELDS_TAB_LABEL : field.tab) ||
                            tabs[0]?.label
                          }
                          selectedOptions={[field.tab || tabs[0]?.key || 'general']}
                          onOptionSelect={(_, data) => {
                            if (data.optionValue) {
                              updateCustomField(index, { tab: data.optionValue });
                            }
                          }}
                        >
                          {ensureCustomFieldsTab(tabs).map((tab) => (
                            <Option key={tab.key} value={tab.key}>
                              {tab.label}
                            </Option>
                          ))}
                        </AppDropdown>
                      </Field>
                    ) : null}
                    <Field label="Placeholder">
                      <Input
                        value={field.placeholder || ''}
                        onChange={(_, data) => updateCustomField(index, { placeholder: data.value })}
                      />
                    </Field>
                  </div>
                  {customFieldTypeUsesOptions(field.type) ? (
                    <Field label="Options (one per line)">
                      <Textarea
                        resize="vertical"
                        value={(field.options || []).join('\n')}
                        onChange={(_, data) =>
                          updateCustomField(index, {
                            options: data.value
                              .split('\n')
                              .map((line) => line.trim())
                              .filter(Boolean)
                          })
                        }
                      />
                    </Field>
                  ) : null}
                  {customFieldTypeUsesLookupList(field.type) ? (
                    <Field label="Lookup list">
                      <AppDropdown
                        value={resolveLookupListOptionLabel(field.lookupListTitle)}
                        selectedOptions={[normalizeLookupListTitle(field.lookupListTitle) || '']}
                        onOptionSelect={(_, data) => {
                          if (data.optionValue) {
                            updateCustomField(index, {
                              lookupListTitle: data.optionValue,
                              lookupField: field.lookupField || 'Title'
                            });
                          }
                        }}
                      >
                        {CUSTOM_FIELD_LOOKUP_LIST_OPTIONS.map((option) => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        ))}
                      </AppDropdown>
                    </Field>
                  ) : null}
                  {customFieldTypeUsesDateOnly(field.type) ? (
                    <Field label="Date only">
                      <Switch
                        checked={field.dateOnly !== false}
                        label="Store as date without time"
                        onChange={(_, data) => updateCustomField(index, { dateOnly: data.checked })}
                      />
                    </Field>
                  ) : null}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalL }}>
                    <Switch
                      label="Required on create"
                      checked={!!field.createRequired}
                      onChange={(_, data) => updateCustomField(index, { createRequired: data.checked })}
                    />
                    <Switch
                      label="Required on edit"
                      checked={!!field.editRequired}
                      onChange={(_, data) => updateCustomField(index, { editRequired: data.checked })}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Dialog open={resetDialogOpen} onOpenChange={(_, data) => setResetDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Reset form configuration?</DialogTitle>
            <DialogContent>
              This restores built-in fields, tabs, and custom fields for this entity to the app defaults.
              Save Settings to apply the change.
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" icon={<DismissRegular />} onClick={() => setResetDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={() => {
                  onChange(resetEntityToDefaults(formSettings, entity));
                  setResetDialogOpen(false);
                }}
              >
                Reset
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export const EntityFormSettingsPage = EntityFormSettingsEditor;
