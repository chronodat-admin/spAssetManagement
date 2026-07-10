import * as React from 'react';
import {
  Badge,
  Button,
  Field,
  Input,
  Option,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Textarea,
  tokens
} from '@fluentui/react-components';
import { AddRegular, DeleteRegular, EditRegular, MailRegular } from '@fluentui/react-icons';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { EmptyState } from '../Layout/EmptyState';
import { RightDetailPanel } from '../Layout/RightDetailPanel';
import type { IEmailTemplate, IWorkflowSettings } from '../../models/IWorkflowSettings';
import type { IAppSettings } from '../../models/IAssetApp';
import { createTagId } from '../../lib/workflow-settings/utils';
import { getDefaultEmailTemplateBySlug } from '../../lib/workflow-settings/templateRefresh';
import { serializeWorkflowSettings } from '../../lib/workflow-settings/storage';
import {
  ASSET_EMAIL_TEMPLATE_SLUGS,
  EMAIL_TEMPLATE_SLUG_LABELS,
  normalizeEmailTemplateSlug,
  normalizeEmailEntityType
} from '../../lib/workflow-settings/slugs';
import { isScheduleDependentEmailTemplateSlug } from '../../constants/scheduleDependentFeatures';
import { AssetService } from '../../services/AssetService';
import { useWorkflowSettingsStyles } from './workflowSettingsStyles';
import { useContentCardStyles } from '../Layout/ContentCard';
import { AppMessageBar } from '../Layout/AppMessageBar';

import {
  DATA_TABLE_CLASS,
  getDataTableLayoutStyle,
  getListColumnStyle
} from '../../lib/list-view/columnWidths';

const ENTITY_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'asset', label: 'Asset' },
  { value: 'business', label: 'Business' },
  { value: 'project', label: 'Project' }
];

const TEMPLATE_SLUGS = [...ASSET_EMAIL_TEMPLATE_SLUGS];

const AVAILABLE_VARIABLES = [
  'AM_AssetId',
  'Title',
  'CreatedBy',
  'CreatedByName',
  'ModifiedByName',
  'AM_Notes',
  'AM_Status',
  'Status',
  'RiskCategory',
  'Category',
  'Priority',
  'AssignedTo',
  'DueDate',
  'LinkTitle',
  'AssetUrl',
  'OrgName'
];

export interface IEmailTemplatesTabProps {
  workflowSettings: IWorkflowSettings;
  onChange: (next: IWorkflowSettings) => void;
  riskService: AssetService;
  settings?: IAppSettings;
}

export const EmailTemplatesTab: React.FC<IEmailTemplatesTabProps> = ({
  workflowSettings,
  onChange,
  riskService,
  settings
}) => {
  const styles = useWorkflowSettingsStyles();
  const cardStyles = useContentCardStyles();
  const templates = (workflowSettings.emailTemplates || []).filter(
    (template) => !isScheduleDependentEmailTemplateSlug(template.slug)
  );
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('asset_created');
  const [subject, setSubject] = React.useState('');
  const [bodyHtml, setBodyHtml] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [entityType, setEntityType] = React.useState<IEmailTemplate['entityType']>('asset');
  const [isActive, setIsActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');

  const applyDefaultTemplateFields = React.useCallback(
    (slugValue: string, options?: { fillName?: boolean }): void => {
      const seed = getDefaultEmailTemplateBySlug(slugValue);
      if (!seed) {
        return;
      }
      setSubject(seed.subject);
      setBodyHtml(seed.bodyHtml);
      if (options?.fillName) {
        setName(seed.name);
        setDescription(seed.description || '');
      }
    },
    []
  );

  const resetForm = (): void => {
    setEditingId(null);
    setSlug('asset_created');
    setEntityType('asset');
    setIsActive(true);
    applyDefaultTemplateFields('asset_created', { fillName: true });
  };

  const openCreate = (): void => {
    resetForm();
    setSaveError('');
    setPanelOpen(true);
  };

  const openEdit = (template: IEmailTemplate): void => {
    setEditingId(template.id);
    setName(template.name);
    setSlug(template.slug);
    setSubject(template.subject);
    setBodyHtml(template.bodyHtml);
    setDescription(template.description || '');
    setEntityType(template.entityType);
    setIsActive(template.isActive);
    setSaveError('');
    setPanelOpen(true);
  };

  const saveTemplate = async (): Promise<void> => {
    if (!name.trim() || !slug.trim() || !subject.trim()) {
      return;
    }

    const nextTemplate: IEmailTemplate = {
      id: editingId || createTagId().replace('tag', 'email'),
      name: name.trim(),
      slug: slug.trim(),
      subject: subject.trim(),
      bodyHtml,
      description: description.trim() || undefined,
      entityType,
      variables: [...AVAILABLE_VARIABLES],
      isActive
    };
    const nextTemplates = editingId
      ? templates.map((item) => (item.id === editingId ? nextTemplate : item))
      : [...templates, nextTemplate];
    const nextWorkflowSettings = { ...workflowSettings, emailTemplates: nextTemplates };

    if (!settings?.Id) {
      onChange(nextWorkflowSettings);
      setPanelOpen(false);
      resetForm();
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      await riskService.updateAppSettings(settings.Id, {
        WorkflowSettings: serializeWorkflowSettings(nextWorkflowSettings)
      });
      onChange(nextWorkflowSettings);
      setPanelOpen(false);
      resetForm();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save email template.');
    } finally {
      setSaving(false);
    }
  };

  const removeTemplate = (id: string): void => {
    onChange({
      ...workflowSettings,
      emailTemplates: templates.filter((item) => item.id !== id)
    });
  };

  const toggleTemplate = (id: string): void => {
    onChange({
      ...workflowSettings,
      emailTemplates: templates.map((item) =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      )
    });
  };

  return (
    <div>
      <div className={styles.tabToolbar}>
        <Button appearance="primary" icon={<AddRegular />} onClick={openCreate}>
          Add template
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          bordered
          icon={<MailRegular />}
          title="No email templates"
          description="Add a reusable template to customize notification emails. Workflows use built-in text until you add one."
          action={
            <Button appearance="primary" icon={<AddRegular />} onClick={openCreate}>
              Add template
            </Button>
          }
        />
      ) : (
        <div className={cardStyles.tableWrap}>
          <Table
            className={DATA_TABLE_CLASS}
            style={{ ...getDataTableLayoutStyle(820), marginTop: tokens.spacingVerticalM }}
          >
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('name')}>
                  Name
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('slug')}>
                  Slug
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('entity')}>
                  Entity
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('status')}>
                  Status
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('actions')}>
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('name')}>
                    {template.name}
                  </TableCell>
                  <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('slug')}>
                    {EMAIL_TEMPLATE_SLUG_LABELS[
                      normalizeEmailTemplateSlug(template.slug) as keyof typeof EMAIL_TEMPLATE_SLUG_LABELS
                    ] || template.slug}
                  </TableCell>
                  <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('entity')}>
                    {ENTITY_TYPES.find(
                      (item) => item.value === normalizeEmailEntityType(template.entityType)
                    )?.label || template.entityType}
                  </TableCell>
                  <TableCell style={getListColumnStyle('status')}>
                    <Badge appearance={template.isActive ? 'filled' : 'outline'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell style={getListColumnStyle('actions')}>
                    <Button appearance="subtle" icon={<EditRegular />} onClick={() => openEdit(template)} />
                    <Button appearance="subtle" icon={<DeleteRegular />} onClick={() => removeTemplate(template.id)} />
                    <Switch checked={template.isActive} onChange={() => toggleTemplate(template.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RightDetailPanel
        open={panelOpen}
        title={editingId ? 'Edit email template' : 'Add email template'}
        onClose={() => {
          setPanelOpen(false);
          resetForm();
          setSaveError('');
        }}
        footer={
          <div className={styles.panelFooter}>
            <Button
              type="button"
              appearance="secondary"
              disabled={saving}
              onClick={() => {
                setPanelOpen(false);
                resetForm();
                setSaveError('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              appearance="primary"
              disabled={!name.trim() || !subject.trim() || saving}
              icon={saving ? <Spinner size="tiny" /> : undefined}
              onClick={() => void saveTemplate()}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className={styles.panelBody}>
          {saveError ? (
            <AppMessageBar intent="error">{saveError}</AppMessageBar>
          ) : null}
          <Field label="Template name" required>
            <Input value={name} onChange={(_, data) => setName(data.value)} />
          </Field>
          <Field label="Slug">
            <AppDropdown
              value={slug}
              selectedOptions={[slug]}
              onOptionSelect={(_, data) => {
                const nextSlug = String(data.optionValue || 'asset_created');
                setSlug(nextSlug);
                if (!editingId) {
                  applyDefaultTemplateFields(nextSlug, { fillName: true });
                }
              }}
            >
              {TEMPLATE_SLUGS.map((item) => (
                <Option key={item} value={item}>
                  {EMAIL_TEMPLATE_SLUG_LABELS[item]}
                </Option>
              ))}
            </AppDropdown>
          </Field>
          <Field label="Entity type">
            <AppDropdown
              value={ENTITY_TYPES.find((item) => item.value === entityType)?.label || 'Asset'}
              selectedOptions={[entityType]}
              onOptionSelect={(_, data) =>
                setEntityType((data.optionValue as IEmailTemplate['entityType']) || 'asset')
              }
            >
              {ENTITY_TYPES.map((item) => (
                <Option key={item.value} value={item.value}>
                  {item.label}
                </Option>
              ))}
            </AppDropdown>
          </Field>
          <Field label="Subject" required>
            <Input value={subject} onChange={(_, data) => setSubject(data.value)} />
          </Field>
          <Field
            label="Body (HTML)"
            hint={`Variables: ${AVAILABLE_VARIABLES.map((item) => `{${item}}`).join(', ')}`}
          >
            <Textarea rows={8} resize="vertical" value={bodyHtml} onChange={(_, data) => setBodyHtml(data.value)} />
          </Field>
          <Field label="Description">
            <Input value={description} onChange={(_, data) => setDescription(data.value)} />
          </Field>
          <Switch label="Active" checked={isActive} onChange={(_, data) => setIsActive(data.checked)} />
        </div>
      </RightDetailPanel>
    </div>
  );
};
