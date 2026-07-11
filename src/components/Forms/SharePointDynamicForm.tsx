import * as React from 'react';
import {
  Field,
  Input,
  Option,
  Spinner,
  Switch,
  Text,
  Textarea,
  makeStyles,
  mergeClasses,
  tokens
} from '@fluentui/react-components';
import { AppMessageBar } from '../Layout/AppMessageBar';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { DEFAULT_FORM_SETTINGS } from '../../lib/form-config/defaults';
import { BuiltFormConfig, FormMode } from '../../lib/form-config/types';
import {
  isTemplateTabKey,
  resolveFormTemplateForCategory,
  templateTabKey
} from '../../lib/form-templates/resolve';
import { parseTemplateValues, TemplateValues } from '../../lib/form-templates/types';
import { validateTemplateFields } from '../../lib/form-templates/validate';
import { ISharePointFormField, SharePointFormFieldValue, SharePointFormValues } from '../../models/ISharePointFormField';
import { ASSETS_LIST_TITLE } from '../../models/IListDefinitions';
import { IPersonPickerItem } from '../../models/IPersonPickerItem';
import { AssetService } from '../../services/AssetService';
import { AssetAttachmentsSection, IAssetAttachmentDraft } from './AssetAttachmentsSection';
import { AssetImageSection, IAssetImageDraft } from './AssetImageSection';
import { FormTemplateFields } from './FormTemplateFields';
import { PeoplePickerField } from '../PeoplePicker/PeoplePickerField';
import { UserCell } from '../PeoplePicker/UserAvatar';
import { AssetActivityTab } from '../Assets/AssetActivityTab';

const ASSET_ACTIVITY_TAB_KEY = 'activity';

/**
 * The tab a freshly opened form should land on: the first real content tab,
 * skipping the appended Activity tab and category template tab. Falls back to the
 * first tab (or 'general') so early renders — before the column schema has loaded
 * and only the Activity tab exists — don't strand the user on Activity.
 */
function preferredDefaultTabKey(
  tabs: ReadonlyArray<{ key: string }>
): string {
  const contentTab = tabs.find(
    (tab) => tab.key !== ASSET_ACTIVITY_TAB_KEY && !isTemplateTabKey(tab.key)
  );
  return contentTab?.key || tabs[0]?.key || 'general';
}

export interface ISharePointDynamicFormProps {
  listTitle: string;
  itemId?: number;
  mode: FormMode;
  riskService: AssetService;
  formConfig?: BuiltFormConfig;
  includeFields?: string[];
  excludeFields?: string[];
  lookupOptions?: Record<string, Array<{ id: number; title: string }>>;
  disabledFields?: string[];
  onSaved: (itemId?: number) => void;
  onCancel: () => void;
  onSubmittingChange?: (saving: boolean) => void;
  formId?: string;
  hideActions?: boolean;
  contentOnly?: boolean;
  valuesOverride?: SharePointFormValues;
  onValuesOverrideChange?: (values: SharePointFormValues) => void;
}

const useStyles = makeStyles({
  tabBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalXXS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium
  },
  tabButton: {
    border: 'none',
    background: 'transparent',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightRegular,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300
  },
  tabButtonActive: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    boxShadow: tokens.shadow2
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: tokens.spacingHorizontalM,
    alignItems: 'start',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  },
  fullWidthField: {
    gridColumn: '1 / -1'
  },
  templatePanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%'
  }
});

function toDateInput(value?: string): string {
  if (!value) {
    return '';
  }
  return value.split('T')[0];
}

function formatDisplayValue(
  field: ISharePointFormField,
  current: SharePointFormFieldValue | undefined,
  lookupOptions?: Record<string, Array<{ id: number; title: string }>>
): string {
  if (current === undefined || current === null || current === '') {
    return '—';
  }

  if (field.TypeAsString === 'Boolean') {
    return current ? 'Yes' : 'No';
  }

  if (field.TypeAsString === 'Lookup') {
    const selectedId = String(current);
    const options =
      lookupOptions?.[field.InternalName] || lookupOptions?.[`${field.InternalName}Id`] || [];
    return options.find((option) => String(option.id) === selectedId)?.title || selectedId;
  }

  if (field.TypeAsString === 'User' || field.TypeAsString === 'UserMulti') {
    const users = Array.isArray(current) ? current : [];
    return users.length > 0
      ? users.map((user) => ('title' in user ? user.title : String(user))).join(', ')
      : '—';
  }

  if (field.TypeAsString === 'DateTime') {
    const raw = String(current);
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? raw : date.toLocaleDateString();
  }

  return String(current);
}

function isNoteField(field: ISharePointFormField): boolean {
  return field.TypeAsString === 'Note';
}

function isFieldVisible(
  field: ISharePointFormField,
  formConfig: BuiltFormConfig | undefined,
  includeFields?: string[],
  excludeFields?: string[]
): boolean {
  if (excludeFields?.includes(field.InternalName)) {
    return false;
  }

  if (includeFields && includeFields.length > 0) {
    return includeFields.includes(field.InternalName);
  }

  const config = formConfig?.fields[field.InternalName];
  if (config) {
    return config.visible;
  }

  return true;
}

export const SharePointDynamicForm: React.FC<ISharePointDynamicFormProps> = ({
  listTitle,
  itemId,
  mode,
  riskService,
  formConfig,
  includeFields,
  excludeFields,
  lookupOptions,
  disabledFields,
  onSaved,
  onCancel,
  onSubmittingChange,
  formId = 'sharepoint-dynamic-form',
  hideActions,
  contentOnly,
  valuesOverride,
  onValuesOverrideChange
}) => {
  const styles = useStyles();
  const [fields, setFields] = React.useState<ISharePointFormField[]>([]);
  const [internalValues, setInternalValues] = React.useState<SharePointFormValues>({});
  const values = valuesOverride ?? internalValues;
  const valuesRef = React.useRef(values);
  valuesRef.current = values;
  const [formTemplates, setFormTemplates] = React.useState<
    import('../../lib/form-templates/types').AssetFormTemplate[]
  >([]);
  const [templateValues, setTemplateValues] = React.useState<TemplateValues>({});
  const templateValuesRef = React.useRef(templateValues);
  templateValuesRef.current = templateValues;
  const [attachmentDraft, setAttachmentDraft] = React.useState<IAssetAttachmentDraft>({
    uploads: [],
    deletes: []
  });
  const attachmentDraftRef = React.useRef(attachmentDraft);
  attachmentDraftRef.current = attachmentDraft;
  const [assetImageUrl, setAssetImageUrl] = React.useState<string | undefined>();
  const [imageDraft, setImageDraft] = React.useState<IAssetImageDraft>({});
  const imageDraftRef = React.useRef(imageDraft);
  imageDraftRef.current = imageDraft;
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [historyRefreshKey, setHistoryRefreshKey] = React.useState(0);
  const onValuesOverrideChangeRef = React.useRef(onValuesOverrideChange);
  const useControlledValues = valuesOverride !== undefined;
  const readOnly = mode === 'view';

  onValuesOverrideChangeRef.current = onValuesOverrideChange;

  const includeFieldsKey = includeFields?.join('|') ?? '';
  const excludeFieldsKey = excludeFields?.join('|') ?? '';

  React.useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      setLoading(true);
      setError('');
      try {
        const schema = await riskService.getListFormFields(listTitle);
        if (cancelled) {
          return;
        }

        const candidateFields = schema.filter((field) => {
          if (excludeFields?.includes(field.InternalName)) {
            return false;
          }
          if (includeFields && includeFields.length > 0) {
            return includeFields.includes(field.InternalName);
          }
          return true;
        });
        setFields(candidateFields);

        if (itemId) {
          const itemValues = await riskService.getListItemFormValues(listTitle, itemId, candidateFields);
          if (!cancelled) {
            if (useControlledValues) {
              onValuesOverrideChangeRef.current?.(itemValues);
            } else {
              setInternalValues(itemValues);
            }
          }
        } else if (!cancelled) {
          const initial: SharePointFormValues = {};
          candidateFields.forEach((field) => {
            if (field.TypeAsString === 'Boolean') {
              initial[field.InternalName] = false;
            }
          });
          if (useControlledValues) {
            onValuesOverrideChangeRef.current?.(initial);
          } else {
            setInternalValues(initial);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load form fields.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
    // Mode/formConfig visibility is applied at render time — reloading on view→edit
    // caused a full spinner flash and made forms feel like they were reopening.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- includeFieldsKey/excludeFieldsKey are stable serializations for includeFields/excludeFields.
  }, [listTitle, itemId, riskService, includeFieldsKey, excludeFieldsKey, useControlledValues]);

  React.useEffect(() => {
    if (listTitle !== ASSETS_LIST_TITLE) {
      setFormTemplates([]);
      return;
    }
    let cancelled = false;
    void riskService
      .getFormTemplates()
      .then((templates) => {
        if (!cancelled) {
          setFormTemplates(templates);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFormTemplates([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [listTitle, riskService]);

  React.useEffect(() => {
    setAttachmentDraft({ uploads: [], deletes: [] });
    setImageDraft({});
    if (!itemId) {
      setAssetImageUrl(undefined);
    }
  }, [itemId, mode]);

  React.useEffect(() => {
    if (listTitle !== ASSETS_LIST_TITLE || !itemId) {
      if (!itemId) {
        setTemplateValues({});
        setAssetImageUrl(undefined);
      }
      return;
    }
    let cancelled = false;
    void riskService
      .getRiskById(itemId)
      .then((asset) => {
        if (!cancelled && asset) {
          setTemplateValues(parseTemplateValues(asset.AM_CustomJson || asset.TemplateData));
          setAssetImageUrl(asset.AM_ImageUrl);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [listTitle, itemId, riskService]);

  const selectedCategoryId = React.useMemo((): number | null => {
    const raw = values.AM_Category;
    if (raw === undefined || raw === null || raw === '') {
      return null;
    }
    const parsed = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [values.AM_Category]);

  const activeTemplate = React.useMemo(
    () => resolveFormTemplateForCategory(formTemplates, selectedCategoryId),
    [formTemplates, selectedCategoryId]
  );

  React.useEffect(() => {
    if (!activeTemplate) {
      return;
    }
    setTemplateValues((prev) => {
      const allowed = new Set(activeTemplate.fields.map((field) => field.id));
      const next: TemplateValues = {};
      Object.keys(prev).forEach((key) => {
        if (allowed.has(key)) {
          next[key] = prev[key];
        }
      });
      return next;
    });
  }, [activeTemplate]);

  const fieldsByKey = React.useMemo(
    () => new Map(fields.map((field) => [field.InternalName, field])),
    [fields]
  );

  const configuredTabs = React.useMemo(() => {
    if (includeFields && includeFields.length > 0) {
      return [];
    }
    // Prefer the configured tabs, but fall back to the entity defaults when the
    // configured tabs don't match any real column (e.g. stale settings persisted
    // before this list's schema existed). This keeps tabs visible instead of
    // silently collapsing the form into a flat field list.
    const defaultTabs = formConfig?.entity
      ? DEFAULT_FORM_SETTINGS[formConfig.entity]?.tabs
      : undefined;
    for (const tabs of [formConfig?.tabs, defaultTabs]) {
      if (!tabs?.length) {
        continue;
      }
      const matched = tabs.filter((tab) =>
        tab.fields.some((fieldKey) => fieldsByKey.has(fieldKey))
      );
      if (matched.length > 0) {
        return matched;
      }
    }
    return [];
  }, [formConfig?.tabs, formConfig?.entity, fieldsByKey, includeFields]);

  const displayTabs = React.useMemo(() => {
    const tabs = (() => {
      if (!activeTemplate) {
        return configuredTabs;
      }
      return [
        ...configuredTabs,
        {
          key: templateTabKey(activeTemplate),
          label: activeTemplate.name,
          fields: [] as string[]
        }
      ];
    })();

    if (listTitle === ASSETS_LIST_TITLE && itemId) {
      return [
        ...tabs,
        {
          key: ASSET_ACTIVITY_TAB_KEY,
          label: 'Activity',
          fields: [] as string[]
        }
      ];
    }

    return tabs;
  }, [configuredTabs, activeTemplate, listTitle, itemId]);

  const [activeTab, setActiveTab] = React.useState(() => preferredDefaultTabKey(displayTabs));
  // Tracks whether the user manually picked a tab, so schema-driven tab updates
  // don't yank them off their selection.
  const userPickedTabRef = React.useRef(false);

  const desiredDefaultTab = React.useMemo(
    () => preferredDefaultTabKey(displayTabs),
    [displayTabs]
  );

  React.useEffect(() => {
    if (userPickedTabRef.current) {
      // Only intervene if the user's chosen tab no longer exists.
      if (!displayTabs.some((tab) => tab.key === activeTab)) {
        userPickedTabRef.current = false;
        setActiveTab(desiredDefaultTab);
      }
      return;
    }
    // Keep an un-touched form on the preferred default tab as tabs resolve
    // (columns load asynchronously, so the first render often only has Activity).
    if (activeTab !== desiredDefaultTab) {
      setActiveTab(desiredDefaultTab);
    }
  }, [displayTabs, desiredDefaultTab, activeTab]);

  const showingTemplateTab = isTemplateTabKey(activeTab) && Boolean(activeTemplate);
  const showingActivityTab =
    activeTab === ASSET_ACTIVITY_TAB_KEY && listTitle === ASSETS_LIST_TITLE && Boolean(itemId);

  const orderedFields = React.useMemo(() => {
    if (showingTemplateTab || showingActivityTab) {
      return [];
    }
    if (displayTabs.length > 0) {
      const active = displayTabs.find((tab) => tab.key === activeTab) || displayTabs[0];
      return active.fields
        .map((fieldKey) => fieldsByKey.get(fieldKey))
        .filter((field): field is ISharePointFormField => Boolean(field));
    }

    const order = formConfig?.orderedKeys || [];
    if (order.length > 0) {
      const ordered = order
        .map((fieldKey) => fieldsByKey.get(fieldKey))
        .filter((field): field is ISharePointFormField => Boolean(field));
      const remaining = fields.filter(
        (field) => !order.includes(field.InternalName)
      );
      return [...ordered, ...remaining];
    }

    return fields;
  }, [showingTemplateTab, showingActivityTab, displayTabs, activeTab, fieldsByKey, formConfig?.orderedKeys, fields]);

  const visibleOrderedFields = React.useMemo(
    () =>
      orderedFields.filter((field) =>
        isFieldVisible(field, formConfig, includeFields, excludeFields)
      ),
    [orderedFields, formConfig, includeFields, excludeFields]
  );

  const handleSearchPeople = React.useCallback(
    (query: string) => riskService.searchPeople(query),
    [riskService]
  );
  const handleResolvePerson = React.useCallback(
    (key: string) => riskService.resolvePerson(key),
    [riskService]
  );

  const setValue = (internalName: string, value: SharePointFormFieldValue): void => {
    if (valuesOverride) {
      onValuesOverrideChange?.({ ...valuesOverride, [internalName]: value });
      return;
    }
    setInternalValues((prev) => ({ ...prev, [internalName]: value }));
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (readOnly) {
      return;
    }
    setError('');
    setSaving(true);
    onSubmittingChange?.(true);

    try {
      if (listTitle === ASSETS_LIST_TITLE && activeTemplate) {
        const templateError = validateTemplateFields(
          activeTemplate.fields,
          templateValuesRef.current
        );
        if (templateError) {
          setError(templateError);
          userPickedTabRef.current = true;
          setActiveTab(templateTabKey(activeTemplate));
          return;
        }
      }

      let savedItemId = itemId;
      const submitValues = valuesRef.current;
      if (mode === 'create') {
        savedItemId = await riskService.createListItemFromForm(
          listTitle,
          fields,
          submitValues,
          formConfig
        );
      } else if (itemId) {
        await riskService.updateListItemFromForm(listTitle, itemId, fields, submitValues, formConfig);
      }

      if (listTitle === ASSETS_LIST_TITLE && savedItemId) {
        const templatePayload = activeTemplate
          ? JSON.stringify(templateValuesRef.current)
          : '';
        await riskService.updateRiskTemplateData(savedItemId, templatePayload);

        const pendingAttachments = attachmentDraftRef.current;
        if (pendingAttachments.uploads.length > 0 || pendingAttachments.deletes.length > 0) {
          await riskService.syncRiskAttachments(savedItemId, pendingAttachments);
        }

        const pendingImage = imageDraftRef.current;
        if (pendingImage.upload || pendingImage.remove) {
          const nextImageUrl = await riskService.syncAssetImage(savedItemId, pendingImage);
          setAssetImageUrl(nextImageUrl);
          setImageDraft({});
        }
      }

      onSaved(savedItemId);
      if (listTitle === ASSETS_LIST_TITLE && savedItemId) {
        setHistoryRefreshKey((key) => key + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item.');
    } finally {
      setSaving(false);
      onSubmittingChange?.(false);
    }
  };

  if (loading) {
    return <Spinner label="Loading form..." />;
  }

  if (!showingTemplateTab && !showingActivityTab && visibleOrderedFields.length === 0) {
    return contentOnly ? null : (
      <Text style={{ color: tokens.colorNeutralForeground3 }}>
        {readOnly ? 'No fields available to display.' : 'No editable fields available.'}
      </Text>
    );
  }

  const renderField = (field: ISharePointFormField): React.ReactNode => {
    const config = formConfig?.fields[field.InternalName];
    const label = config?.label || field.Title;
    const required = !readOnly && (config?.required || field.Required);
    const disabled = readOnly || saving || disabledFields?.includes(field.InternalName);
    const current = values[field.InternalName];

    if (readOnly) {
      if (field.TypeAsString === 'User' || field.TypeAsString === 'UserMulti') {
        const users = Array.isArray(current) ? (current as IPersonPickerItem[]) : [];
        return (
          <div
            key={field.InternalName}
            className={isNoteField(field) ? styles.fullWidthField : undefined}
          >
            <Field label={label}>
              {users.length === 0 ? (
                <Text>—</Text>
              ) : users.length === 1 ? (
                <UserCell name={users[0].title} email={users[0].email} />
              ) : (
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {users.map((user) => (
                    <UserCell key={user.id} name={user.title} email={user.email} />
                  ))}
                </span>
              )}
            </Field>
          </div>
        );
      }

      return (
        <div
          key={field.InternalName}
          className={isNoteField(field) ? styles.fullWidthField : undefined}
        >
          <Field label={label}>
            <Text>{formatDisplayValue(field, current, lookupOptions)}</Text>
          </Field>
        </div>
      );
    }

    const fieldNode = (() => {
    if (field.TypeAsString === 'Note') {
      return (
        <Field key={field.InternalName} label={label} required={required}>
          <Textarea
            rows={3}
            resize="vertical"
            value={String(current || '')}
            disabled={disabled}
            onChange={(_, data) => setValue(field.InternalName, data.value)}
          />
        </Field>
      );
    }

    if (field.TypeAsString === 'Choice' || field.TypeAsString === 'MultiChoice') {
      const options = config?.options || field.Choices || [];
      return (
        <Field key={field.InternalName} label={label} required={required}>
          <AppDropdown
            value={String(current || '')}
            selectedOptions={current ? [String(current)] : []}
            disabled={disabled}
            onOptionSelect={(_, data) => setValue(field.InternalName, data.optionValue || '')}
          >
            {!required && <Option value="">None</Option>}
            {options.map((option) => (
              <Option key={option} value={option}>
                {option}
              </Option>
            ))}
          </AppDropdown>
        </Field>
      );
    }

    if (field.TypeAsString === 'Boolean') {
      return (
        <Field key={field.InternalName} label={label}>
          <Switch
            checked={Boolean(current)}
            disabled={disabled}
            onChange={(_, data) => setValue(field.InternalName, data.checked)}
          />
        </Field>
      );
    }

    if (field.TypeAsString === 'DateTime') {
      return (
        <Field key={field.InternalName} label={label} required={required}>
          <Input
            type="date"
            value={toDateInput(String(current || ''))}
            disabled={disabled}
            onChange={(_, data) => setValue(field.InternalName, data.value)}
          />
        </Field>
      );
    }

    if (field.TypeAsString === 'Lookup') {
      const options =
        lookupOptions?.[field.InternalName] ||
        lookupOptions?.[`${field.InternalName}Id`] ||
        [];
      const selectedId = String(current || '');
      return (
        <Field key={field.InternalName} label={label} required={required}>
          <AppDropdown
            placeholder="Select..."
            value={options.find((option) => String(option.id) === selectedId)?.title || ''}
            selectedOptions={selectedId ? [selectedId] : []}
            disabled={disabled}
            onOptionSelect={(_, data) => setValue(field.InternalName, data.optionValue || '')}
          >
            {!required && <Option value="">None</Option>}
            {options.map((option) => (
              <Option key={option.id} value={String(option.id)}>
                {option.title}
              </Option>
            ))}
          </AppDropdown>
        </Field>
      );
    }

    if (field.TypeAsString === 'User' || field.TypeAsString === 'UserMulti') {
      const selectedUsers = Array.isArray(current) ? (current as IPersonPickerItem[]) : [];
      return (
        <PeoplePickerField
          key={field.InternalName}
          label={label}
          required={required}
          disabled={disabled}
          multi={field.TypeAsString === 'UserMulti'}
          value={selectedUsers}
          onChange={(nextUsers) => setValue(field.InternalName, nextUsers)}
          onSearch={handleSearchPeople}
          onResolve={handleResolvePerson}
        />
      );
    }

    return (
      <Field key={field.InternalName} label={label} required={required}>
        <Input
          type={field.TypeAsString === 'Number' || field.TypeAsString === 'Currency' ? 'number' : 'text'}
          value={String(current ?? '')}
          disabled={disabled}
          onChange={(_, data) => setValue(field.InternalName, data.value)}
        />
      </Field>
    );
    })();

    return (
      <div
        key={field.InternalName}
        className={isNoteField(field) ? styles.fullWidthField : undefined}
      >
        {fieldNode}
      </div>
    );
  };

  const fieldContent = (
    <>
      {error && (
        <AppMessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalM }}>
          {error}
        </AppMessageBar>
      )}

      {listTitle === ASSETS_LIST_TITLE && (
        <AssetImageSection
          imageUrl={assetImageUrl}
          title={String(values.Title || '')}
          riskService={riskService}
          readOnly={readOnly}
          disabled={saving}
          draft={imageDraft}
          onDraftChange={setImageDraft}
        />
      )}

      {displayTabs.length > 0 && (
        <div className={mergeClasses('asset-mgmt-form-tab-bar', styles.tabBar)} role="tablist">
          {displayTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={mergeClasses(
                'asset-mgmt-form-tab',
                styles.tabButton,
                activeTab === tab.key && 'asset-mgmt-form-tab--active',
                activeTab === tab.key && styles.tabButtonActive
              )}
              onClick={() => {
                userPickedTabRef.current = true;
                setActiveTab(tab.key);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {showingTemplateTab && activeTemplate ? (
        <div className={styles.templatePanel} role="tabpanel">
          <FormTemplateFields
            fields={activeTemplate.fields}
            values={templateValues}
            readOnly={readOnly}
            disabled={saving}
            riskService={riskService}
            onChange={setTemplateValues}
          />
          <AssetAttachmentsSection
            itemId={itemId}
            riskService={riskService}
            readOnly={readOnly}
            disabled={saving}
            draft={attachmentDraft}
            onDraftChange={setAttachmentDraft}
          />
        </div>
      ) : showingActivityTab && itemId ? (
        <AssetActivityTab
          riskId={itemId}
          riskService={riskService}
          formConfig={formConfig}
          refreshKey={historyRefreshKey}
        />
      ) : (
        <div className={styles.formGrid} role="tabpanel">
          {visibleOrderedFields.map((field) => renderField(field))}
        </div>
      )}
    </>
  );

  if (contentOnly) {
    return fieldContent;
  }

  return (
    <form id={formId} onSubmit={(e) => void handleSubmit(e)} noValidate>
      {fieldContent}

      {!hideActions && (
        <div style={{ display: 'none' }}>
          <button type="submit" disabled={saving || readOnly}>
            Save
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      )}
    </form>
  );
};
