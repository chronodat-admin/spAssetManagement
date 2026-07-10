import * as React from 'react';
import {
  Badge,
  Button,
  Field,
  Input,
  makeStyles,
  Option,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Textarea,
  tokens
} from '@fluentui/react-components';
import { AppMessageBar } from '../Layout/AppMessageBar';
import { AppDropdown } from '../Dropdown/AppDropdown';
import {
  AddRegular,
  ArrowDownRegular,
  ArrowUpRegular,
  DeleteRegular,
  DocumentAddRegular,
  DocumentRegular,
  EditRegular,
  InfoRegular,
  SparkleRegular
} from '@fluentui/react-icons';
import { ILookupItem } from '../../models/IAssetApp';
import { CATEGORIES_LIST_TITLE } from '../../models/IListDefinitions';
import { AssetService } from '../../services/AssetService';
import { EmptyState } from '../Layout/EmptyState';
import { RightDetailPanel } from '../Layout/RightDetailPanel';
import { useContentCardStyles } from '../Layout/ContentCard';
import {
  DATA_TABLE_CLASS,
  getDataTableLayoutStyle,
  getListColumnStyle
} from '../../lib/list-view/columnWidths';
import {
  FORM_TEMPLATE_FIELD_TYPES,
  FormTemplateField,
  FormTemplateFieldType,
  getFormTemplateFieldTypeLabel,
  AssetFormTemplate
} from '../../lib/form-templates/types';

const NO_CATEGORY_VALUE = '__none__';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  headerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    justifyContent: 'flex-end'
  },
  infoBar: {
    width: '100%',
    minWidth: 0
  },
  tableWrap: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    overflow: 'auto'
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: 0
  },
  nameIcon: {
    fontSize: '18px',
    color: tokens.colorNeutralForeground3,
    flexShrink: 0
  },
  actionsCell: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end'
  },
  editorSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  fieldCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  fieldCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS
  },
  fieldCardActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXXS
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr'
    }
  },
  sectionLabel: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalS
  }
});

function generateFieldId(): string {
  return `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function blankField(): FormTemplateField {
  return {
    id: generateFieldId(),
    type: 'text',
    label: 'New field',
    required: false
  };
}

const TYPES_WITH_OPTIONS: FormTemplateFieldType[] = ['dropdown'];
const TYPES_WITHOUT_PLACEHOLDER: FormTemplateFieldType[] = [
  'checkbox',
  'user_lookup',
  'user_multi'
];

export interface IFormTemplatesManagerProps {
  riskService: AssetService;
}

export const FormTemplatesManager: React.FC<IFormTemplatesManagerProps> = ({ riskService }) => {
  const styles = useStyles();
  const cardStyles = useContentCardStyles();
  const [templates, setTemplates] = React.useState<AssetFormTemplate[]>([]);
  const [categories, setCategories] = React.useState<ILookupItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const [draft, setDraft] = React.useState<AssetFormTemplate | null>(null);

  const load = React.useCallback(async (): Promise<AssetFormTemplate[]> => {
    setLoading(true);
    setError('');
    try {
      const categoryList = await riskService.getLookupItems(CATEGORIES_LIST_TITLE);
      setCategories(categoryList);
      // The FormTemplates list may not exist yet on sites provisioned before this
      // feature; treat a load failure as "no templates" rather than a hard error.
      try {
        const templateList = await riskService.getFormTemplates();
        setTemplates(templateList);
        return templateList;
      } catch {
        setTemplates([]);
        return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form templates.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [riskService]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const categoryName = React.useCallback(
    (categoryId: number | null): string => {
      if (categoryId === null) {
        return 'No category';
      }
      return categories.find((category) => category.Id === categoryId)?.Title || 'Unknown category';
    },
    [categories]
  );

  const openCreate = (): void => {
    setInfo('');
    setDraft({ name: '', categoryId: null, fields: [], isActive: true });
  };

  const openEdit = (template: AssetFormTemplate): void => {
    setInfo('');
    setDraft({
      ...template,
      fields: template.fields.map((field) => ({ ...field })),
      tabs: template.tabs ? template.tabs.map((tab) => ({ ...tab })) : undefined
    });
  };

  const handleSeedDefaults = async (): Promise<void> => {
    setBusy(true);
    setError('');
    setInfo('');
    try {
      const created = await riskService.seedDefaultFormTemplates(categories);
      const refreshed = await load();
      if (created > 0) {
        setInfo(`Created ${created} default template${created === 1 ? '' : 's'}.`);
      } else if (refreshed.length > 0) {
        setInfo('Default templates already exist for your categories.');
      } else {
        setError(
          'No matching asset categories were found to generate default templates. Add categories under Dropdown Options, or use "Create Template" to build one manually.'
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create default templates.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (template: AssetFormTemplate): Promise<void> => {
    if (template.id === undefined) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await riskService.deleteFormTemplate(template.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (template: AssetFormTemplate, isActive: boolean): Promise<void> => {
    if (template.id === undefined) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await riskService.updateFormTemplate(template.id, {
        name: template.name,
        categoryId: template.categoryId,
        fields: template.fields,
        tabs: template.tabs,
        isActive
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template status.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDraft = async (): Promise<void> => {
    if (!draft) {
      return;
    }
    if (!draft.name.trim()) {
      setError('Template name is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const input = {
        name: draft.name.trim(),
        categoryId: draft.categoryId,
        fields: draft.fields,
        tabs: draft.tabs,
        isActive: draft.isActive
      };
      if (draft.id === undefined) {
        await riskService.createFormTemplate(input);
      } else {
        await riskService.updateFormTemplate(draft.id, input);
      }
      setDraft(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template.');
    } finally {
      setBusy(false);
    }
  };

  const updateField = (index: number, patch: Partial<FormTemplateField>): void => {
    setDraft((prev) => {
      if (!prev) {
        return prev;
      }
      const fields = prev.fields.map((field, i) => (i === index ? { ...field, ...patch } : field));
      return { ...prev, fields };
    });
  };

  const moveField = (index: number, direction: -1 | 1): void => {
    setDraft((prev) => {
      if (!prev) {
        return prev;
      }
      const target = index + direction;
      if (target < 0 || target >= prev.fields.length) {
        return prev;
      }
      const fields = [...prev.fields];
      const [moved] = fields.splice(index, 1);
      fields.splice(target, 0, moved);
      return { ...prev, fields };
    });
  };

  const removeField = (index: number): void => {
    setDraft((prev) =>
      prev ? { ...prev, fields: prev.fields.filter((_, i) => i !== index) } : prev
    );
  };

  const addField = (): void => {
    setDraft((prev) => (prev ? { ...prev, fields: [...prev.fields, blankField()] } : prev));
  };

  return (
    <div className={styles.root}>
      <div className={styles.headerActions}>
        <Button
          appearance="secondary"
          icon={busy ? <Spinner size="tiny" /> : <SparkleRegular />}
          disabled={busy || loading}
          type="button"
          onClick={() => void handleSeedDefaults()}
        >
          Create default templates
        </Button>
        <Button
          appearance="primary"
          icon={<AddRegular />}
          disabled={busy || loading}
          type="button"
          onClick={openCreate}
        >
          Create Template
        </Button>
      </div>

      <AppMessageBar intent="info" icon={<InfoRegular />} className={styles.infoBar} title="How form templates work">
        Each template is linked to an asset category. When creating or editing an asset, selecting a
        category with a linked template will show additional custom fields. Core fields (name, ID,
        status, category, and notes) are always available regardless of template.
      </AppMessageBar>

      {error && (
        <AppMessageBar intent="error">{error}</AppMessageBar>
      )}
      {info && (
        <AppMessageBar intent="success">{info}</AppMessageBar>
      )}

      {loading ? (
        <Spinner label="Loading templates..." />
      ) : templates.length === 0 ? (
        <EmptyState
          bordered
          icon={<DocumentAddRegular />}
          title="No form templates yet"
          description="Create a template, or generate the built-in set for your categories."
          action={
            <Button appearance="primary" icon={<AddRegular />} disabled={busy} onClick={openCreate}>
              Create Template
            </Button>
          }
        />
      ) : (
        <div className={styles.tableWrap}>
          <Table
            aria-label="Form templates"
            className={DATA_TABLE_CLASS}
            style={getDataTableLayoutStyle(760)}
          >
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('name')}>
                  Name
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('category')}>
                  Category
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('fields')}>
                  Fields
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('status')}>
                  Status
                </TableHeaderCell>
                <TableHeaderCell
                  className={cardStyles.tableHeaderCell}
                  style={{ ...getListColumnStyle('actions'), textAlign: 'right' }}
                >
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('name')}>
                    <div className={styles.nameCell}>
                      <DocumentRegular className={styles.nameIcon} />
                      <Text weight="semibold">{template.name}</Text>
                    </div>
                  </TableCell>
                  <TableCell style={getListColumnStyle('category')}>
                    <Badge appearance="outline" color="informative">
                      {categoryName(template.categoryId)}
                    </Badge>
                  </TableCell>
                  <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('fields')}>
                    {template.fields.length} field{template.fields.length === 1 ? '' : 's'}
                  </TableCell>
                  <TableCell style={getListColumnStyle('status')}>
                    <Badge appearance="tint" color={template.isActive ? 'brand' : 'informative'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell style={getListColumnStyle('actions')}>
                    <div className={styles.actionsCell}>
                      <Switch
                        checked={template.isActive}
                        disabled={busy}
                        aria-label={`${template.isActive ? 'Deactivate' : 'Activate'} ${template.name}`}
                        onChange={(_, data) => void handleToggleActive(template, data.checked)}
                      />
                      <Button
                        appearance="subtle"
                        icon={<EditRegular />}
                        aria-label={`Edit ${template.name}`}
                        type="button"
                        onClick={() => openEdit(template)}
                      />
                      <Button
                        appearance="subtle"
                        icon={<DeleteRegular />}
                        aria-label={`Delete ${template.name}`}
                        type="button"
                        disabled={busy}
                        onClick={() => void handleDelete(template)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RightDetailPanel
        open={draft !== null}
        wide
        title={draft?.id === undefined ? 'New form template' : 'Edit form template'}
        subtitle="Fields appear on the asset form for the selected category"
        onClose={() => setDraft(null)}
        footer={
          <>
            <Button appearance="secondary" onClick={() => setDraft(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              icon={busy ? <Spinner size="tiny" /> : undefined}
              disabled={busy}
              onClick={() => void handleSaveDraft()}
            >
              {busy ? 'Saving...' : 'Save template'}
            </Button>
          </>
        }
      >
        {draft && (
          <div className={styles.editorSection}>
            <Field label="Template name" required>
              <Input
                value={draft.name}
                onChange={(_, data) =>
                  setDraft((prev) => (prev ? { ...prev, name: data.value } : prev))
                }
              />
            </Field>
            <div className={styles.twoCol}>
              <Field label="Asset category">
                <AppDropdown
                  placeholder="Select a category"
                  value={
                    draft.categoryId !== null
                      ? categories.find((c) => c.Id === draft.categoryId)?.Title || ''
                      : 'No category'
                  }
                  selectedOptions={[
                    draft.categoryId !== null ? String(draft.categoryId) : NO_CATEGORY_VALUE
                  ]}
                  onOptionSelect={(_, data) => {
                    const optionValue = data.optionValue || NO_CATEGORY_VALUE;
                    setDraft((prev) => {
                      if (!prev) {
                        return prev;
                      }
                      return {
                        ...prev,
                        categoryId:
                          optionValue === NO_CATEGORY_VALUE
                            ? null
                            : parseInt(optionValue, 10)
                      };
                    });
                  }}
                >
                  <Option value={NO_CATEGORY_VALUE}>No category</Option>
                  {categories.map((category) => (
                    <Option key={category.Id} value={String(category.Id)}>
                      {category.Title}
                    </Option>
                  ))}
                </AppDropdown>
              </Field>
              <Field label="Status">
                <Switch
                  checked={draft.isActive}
                  label={draft.isActive ? 'Active' : 'Inactive'}
                  onChange={(_, data) =>
                    setDraft((prev) => (prev ? { ...prev, isActive: data.checked } : prev))
                  }
                />
              </Field>
            </div>

            <Text className={styles.sectionLabel}>Fields</Text>
            {draft.fields.map((field, index) => (
              <div key={field.id} className={styles.fieldCard}>
                <div className={styles.fieldCardHeader}>
                  <Text weight="semibold">{field.label || 'Untitled field'}</Text>
                  <div className={styles.fieldCardActions}>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ArrowUpRegular />}
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => moveField(index, -1)}
                    />
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ArrowDownRegular />}
                      aria-label="Move down"
                      disabled={index === draft.fields.length - 1}
                      onClick={() => moveField(index, 1)}
                    />
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<DeleteRegular />}
                      aria-label="Remove field"
                      onClick={() => removeField(index)}
                    />
                  </div>
                </div>
                <div className={styles.twoCol}>
                  <Field label="Label">
                    <Input
                      value={field.label}
                      onChange={(_, data) => updateField(index, { label: data.value })}
                    />
                  </Field>
                  <Field label="Type">
                    <AppDropdown
                      value={getFormTemplateFieldTypeLabel(field.type)}
                      selectedOptions={[field.type]}
                      onOptionSelect={(_, data) => {
                        const nextType = (data.optionValue as FormTemplateFieldType) || 'text';
                        updateField(index, {
                          type: nextType,
                          options: nextType === 'dropdown' ? field.options || [] : undefined,
                          linked_field_id:
                            nextType === 'currency' ? field.linked_field_id : undefined
                        });
                      }}
                    >
                      {FORM_TEMPLATE_FIELD_TYPES.map((type) => (
                        <Option key={type.value} value={type.value} text={type.label}>
                          {type.sharePointType
                            ? `${type.label} (${type.sharePointType})`
                            : type.label}
                        </Option>
                      ))}
                    </AppDropdown>
                  </Field>
                </div>
                {TYPES_WITHOUT_PLACEHOLDER.indexOf(field.type) < 0 && (
                  <Field label="Placeholder">
                    <Input
                      value={field.placeholder || ''}
                      onChange={(_, data) => updateField(index, { placeholder: data.value })}
                    />
                  </Field>
                )}
                {field.type === 'currency' && (
                  <Field
                    label="Linked currency field"
                    hint="Optional dropdown field id that supplies the currency code (e.g. f-currency)."
                  >
                    <AppDropdown
                      placeholder="None (defaults to USD)"
                      value={
                        field.linked_field_id
                          ? draft.fields.find((entry) => entry.id === field.linked_field_id)
                              ?.label || field.linked_field_id
                          : 'None'
                      }
                      selectedOptions={[field.linked_field_id || NO_CATEGORY_VALUE]}
                      onOptionSelect={(_, data) => {
                        const optionValue = data.optionValue || NO_CATEGORY_VALUE;
                        updateField(index, {
                          linked_field_id:
                            optionValue === NO_CATEGORY_VALUE ? undefined : optionValue
                        });
                      }}
                    >
                      <Option value={NO_CATEGORY_VALUE}>None</Option>
                      {draft.fields
                        .filter(
                          (entry) =>
                            entry.id !== field.id &&
                            entry.type === 'dropdown' &&
                            (entry.options || []).length > 0
                        )
                        .map((entry) => (
                          <Option key={entry.id} value={entry.id}>
                            {entry.label}
                          </Option>
                        ))}
                    </AppDropdown>
                  </Field>
                )}
                {TYPES_WITH_OPTIONS.indexOf(field.type) >= 0 && (
                  <Field label="Options (one per line)">
                    <Textarea
                      rows={3}
                      resize="vertical"
                      value={(field.options || []).join('\n')}
                      onChange={(_, data) =>
                        updateField(index, {
                          options: data.value
                            .split('\n')
                            .map((option) => option.trim())
                            .filter((option) => option.length > 0)
                        })
                      }
                    />
                  </Field>
                )}
                <Switch
                  checked={field.required}
                  label="Required"
                  onChange={(_, data) => updateField(index, { required: data.checked })}
                />
              </div>
            ))}
            <Button appearance="secondary" icon={<AddRegular />} onClick={addField}>
              Add field
            </Button>
          </div>
        )}
      </RightDetailPanel>
    </div>
  );
};
