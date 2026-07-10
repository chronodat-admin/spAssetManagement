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
  Text
} from '@fluentui/react-components';
import { AddRegular, DeleteRegular, EditRegular } from '@fluentui/react-icons';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { PeoplePickerField } from '../PeoplePicker/PeoplePickerField';
import { RightDetailPanel } from '../Layout/RightDetailPanel';
import type { IWorkflowAction, IWorkflowCondition, IWorkflowRule, IWorkflowSettings } from '../../models/IWorkflowSettings';
import type { IPersonPickerItem } from '../../models/IPersonPickerItem';
import type { IAppSettings } from '../../models/IAssetApp';
import { serializeWorkflowSettings } from '../../lib/workflow-settings/storage';
import { AssetService } from '../../services/AssetService';
import { createTagId } from '../../lib/workflow-settings/utils';
import {
  ASSET_WORKFLOW_TRIGGER_EVENTS,
  WORKFLOW_TRIGGER_LABELS,
  normalizeWorkflowTriggerEvent
} from '../../lib/workflow-settings/slugs';
import {
  formatWorkflowActionLabel,
  formatWorkflowActionTarget,
  serializePersonTarget,
  usesPeoplePickerAction,
  WORKFLOW_ROLE_TARGETS
} from '../../utils/workflowActionTargetUtils';
import { useWorkflowSettingsStyles } from './workflowSettingsStyles';
import { useContentCardStyles } from '../Layout/ContentCard';
import { AppMessageBar } from '../Layout/AppMessageBar';

import {
  DATA_TABLE_CLASS,
  getDataTableLayoutStyle,
  getListColumnStyle
} from '../../lib/list-view/columnWidths';

const TRIGGER_EVENTS = ASSET_WORKFLOW_TRIGGER_EVENTS.map((value) => ({
  value,
  label: WORKFLOW_TRIGGER_LABELS[value]
}));

const ACTION_TYPES = [
  { value: 'notify', label: 'Send notification' },
  { value: 'assign', label: 'Assign to' },
  { value: 'set_field', label: 'Set field' },
  { value: 'escalate', label: 'Escalate' }
];

const RECIPIENT_OPTIONS = [
  { value: 'user_or_group', label: 'User or group' },
  ...WORKFLOW_ROLE_TARGETS.map((item) => ({ value: item.value, label: item.label }))
];

const CONDITION_FIELDS = [
  { value: 'Priority', label: 'Priority' },
  { value: 'Category', label: 'Category' },
  { value: 'Status', label: 'Status' },
  { value: 'AssetValueSummary', label: 'Asset rating' },
  { value: 'consequence', label: 'Consequence score' }
];

export interface IWorkflowRulesTabProps {
  workflowSettings: IWorkflowSettings;
  onChange: (next: IWorkflowSettings) => void;
  riskService: AssetService;
  settings?: IAppSettings;
}

export const WorkflowRulesTab: React.FC<IWorkflowRulesTabProps> = ({
  workflowSettings,
  onChange,
  riskService,
  settings
}) => {
  const styles = useWorkflowSettingsStyles();
  const cardStyles = useContentCardStyles();
  const rules = workflowSettings.workflowRules || [];
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [triggerEvent, setTriggerEvent] = React.useState('asset_created');
  const [isActive, setIsActive] = React.useState(false);
  const [conditions, setConditions] = React.useState<IWorkflowCondition[]>([]);
  const [actions, setActions] = React.useState<IWorkflowAction[]>([]);
  const [condField, setCondField] = React.useState('Priority');
  const [condOperator] = React.useState('equals');
  const [condValue, setCondValue] = React.useState('');
  const [actionType, setActionType] = React.useState('notify');
  const [actionTarget, setActionTarget] = React.useState('');
  const [recipientMode, setRecipientMode] = React.useState('user_or_group');
  const [recipientPeople, setRecipientPeople] = React.useState<IPersonPickerItem[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');

  const handleSearchPeople = React.useCallback(
    (query: string) => riskService.searchPeople(query),
    [riskService]
  );
  const handleResolvePerson = React.useCallback(
    (key: string) => riskService.resolvePerson(key),
    [riskService]
  );

  const resetForm = (): void => {
    setEditingId(null);
    setName('');
    setTriggerEvent('asset_created');
    setIsActive(false);
    setConditions([]);
    setActions([]);
    setActionType('notify');
    setActionTarget('');
    setRecipientMode('user_or_group');
    setRecipientPeople([]);
  };

  const openCreate = (): void => {
    resetForm();
    setSaveError('');
    setPanelOpen(true);
  };

  const openEdit = (rule: IWorkflowRule): void => {
    setEditingId(rule.id);
    setName(rule.name);
    setTriggerEvent(rule.triggerEvent);
    setIsActive(rule.isActive);
    setConditions([...rule.conditions]);
    setActions([...rule.actions]);
    setActionType('notify');
    setActionTarget('');
    setRecipientMode('user_or_group');
    setRecipientPeople([]);
    setSaveError('');
    setPanelOpen(true);
  };

  const saveRule = async (): Promise<void> => {
    if (!name.trim()) {
      return;
    }

    const nextRule: IWorkflowRule = {
      id: editingId || createTagId().replace('tag', 'rule'),
      name: name.trim(),
      triggerEvent,
      conditions,
      actions,
      isActive
    };
    const nextRules = editingId
      ? rules.map((item) => (item.id === editingId ? nextRule : item))
      : [...rules, nextRule];
    const nextWorkflowSettings = { ...workflowSettings, workflowRules: nextRules };

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
      setSaveError(err instanceof Error ? err.message : 'Failed to save workflow rule.');
    } finally {
      setSaving(false);
    }
  };

  const removeRule = (id: string): void => {
    onChange({ ...workflowSettings, workflowRules: rules.filter((item) => item.id !== id) });
  };

  const toggleRule = (id: string): void => {
    onChange({
      ...workflowSettings,
      workflowRules: rules.map((item) =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      )
    });
  };

  const addAction = (): void => {
    let target = '';

    if (usesPeoplePickerAction(actionType)) {
      if (recipientMode === 'user_or_group') {
        if (recipientPeople.length === 0) {
          return;
        }
        target = serializePersonTarget(recipientPeople[0]);
      } else {
        target = recipientMode;
      }
    } else if (!actionTarget.trim()) {
      return;
    } else {
      target = actionTarget.trim();
    }

    setActions((prev) => [...prev, { type: actionType, target }]);
    setActionTarget('');
    setRecipientPeople([]);
    setRecipientMode('user_or_group');
  };

  const usesPeoplePicker = usesPeoplePickerAction(actionType);
  const canAddAction =
    usesPeoplePicker &&
    (recipientMode !== 'user_or_group' || recipientPeople.length > 0);

  return (
    <div>
      <div className={styles.tabToolbar}>
        <Button appearance="primary" icon={<AddRegular />} onClick={openCreate}>
          Add rule
        </Button>
      </div>

      <div className={cardStyles.tableWrap}>
        <Table
          className={DATA_TABLE_CLASS}
          style={getDataTableLayoutStyle(700)}
        >
          <TableHeader>
            <TableRow>
              <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('name')}>
                Name
              </TableHeaderCell>
              <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('trigger')}>
                Trigger
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
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('name')}>
                  {rule.name}
                </TableCell>
                <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('trigger')}>
                  {WORKFLOW_TRIGGER_LABELS[
                    normalizeWorkflowTriggerEvent(rule.triggerEvent) as keyof typeof WORKFLOW_TRIGGER_LABELS
                  ] || rule.triggerEvent}
                </TableCell>
                <TableCell style={getListColumnStyle('status')}>
                  <Badge appearance={rule.isActive ? 'filled' : 'outline'} color={rule.isActive ? 'success' : 'subtle'}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell style={getListColumnStyle('actions')}>
                  <Button appearance="subtle" icon={<EditRegular />} onClick={() => openEdit(rule)} />
                  <Button appearance="subtle" icon={<DeleteRegular />} onClick={() => removeRule(rule.id)} />
                  <Switch checked={rule.isActive} onChange={() => toggleRule(rule.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RightDetailPanel
        open={panelOpen}
        title={editingId ? 'Edit workflow rule' : 'Add workflow rule'}
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
              disabled={!name.trim() || saving}
              icon={saving ? <Spinner size="tiny" /> : undefined}
              onClick={() => void saveRule()}
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
          <Field label="Rule name" required>
            <Input
              className={styles.panelFullWidth}
              value={name}
              onChange={(_, data) => setName(data.value)}
            />
          </Field>
          <Field label="Trigger event">
            <AppDropdown
              className={styles.panelFullWidth}
              value={TRIGGER_EVENTS.find((item) => item.value === triggerEvent)?.label || 'Asset created'}
              selectedOptions={[triggerEvent]}
              onOptionSelect={(_, data) => setTriggerEvent(String(data.optionValue || 'asset_created'))}
            >
              {TRIGGER_EVENTS.map((item) => (
                <Option key={item.value} value={item.value}>
                  {item.label}
                </Option>
              ))}
            </AppDropdown>
          </Field>
          <Switch label="Active" checked={isActive} onChange={(_, data) => setIsActive(data.checked)} />

          <div className={styles.panelSection}>
            <Text className={styles.panelSectionTitle}>Conditions</Text>
            {conditions.length > 0 && (
              <div className={styles.builderList}>
                {conditions.map((condition, index) => (
                  <div key={`${condition.field}-${index}`} className={styles.builderItem}>
                    <Text className={styles.builderItemText}>
                      {condition.field} {condition.operator} {condition.value}
                    </Text>
                    <Button
                      appearance="subtle"
                      icon={<DeleteRegular />}
                      aria-label="Remove condition"
                      onClick={() => setConditions((prev) => prev.filter((_, idx) => idx !== index))}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className={styles.builderAddRow}>
              <AppDropdown
                className={styles.builderControl}
                value={condField}
                selectedOptions={[condField]}
                onOptionSelect={(_, data) => setCondField(String(data.optionValue || 'Priority'))}
              >
                {CONDITION_FIELDS.map((item) => (
                  <Option key={item.value} value={item.value}>
                    {item.label}
                  </Option>
                ))}
              </AppDropdown>
              <Input
                className={styles.builderControl}
                value={condValue}
                onChange={(_, data) => setCondValue(data.value)}
                placeholder="Value"
              />
              <Button
                appearance="secondary"
                onClick={() => {
                  if (!condValue.trim()) return;
                  setConditions((prev) => [
                    ...prev,
                    { field: condField, operator: condOperator, value: condValue.trim() }
                  ]);
                  setCondValue('');
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <div className={styles.panelSection}>
            <Text className={styles.panelSectionTitle}>Actions</Text>
            {actions.length > 0 && (
              <div className={styles.builderList}>
                {actions.map((action, index) => (
                  <div key={`${action.type}-${index}`} className={styles.builderItem}>
                    <Text className={styles.builderItemText}>
                      {formatWorkflowActionLabel(action.type)} →{' '}
                      {formatWorkflowActionTarget(action.type, action.target)}
                    </Text>
                    <Button
                      appearance="subtle"
                      icon={<DeleteRegular />}
                      aria-label="Remove action"
                      onClick={() => setActions((prev) => prev.filter((_, idx) => idx !== index))}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className={usesPeoplePicker ? styles.builderAddRowStacked : styles.builderAddRow}>
              <AppDropdown
                className={styles.builderControl}
                value={ACTION_TYPES.find((item) => item.value === actionType)?.label || 'Notify'}
                selectedOptions={[actionType]}
                onOptionSelect={(_, data) => {
                  setActionType(String(data.optionValue || 'notify'));
                  setActionTarget('');
                  setRecipientPeople([]);
                  setRecipientMode('user_or_group');
                }}
              >
                {ACTION_TYPES.map((item) => (
                  <Option key={item.value} value={item.value}>
                    {item.label}
                  </Option>
                ))}
              </AppDropdown>

              {usesPeoplePicker ? (
                <AppDropdown
                  className={styles.builderControl}
                  value={
                    RECIPIENT_OPTIONS.find((item) => item.value === recipientMode)?.label ||
                    'User or group'
                  }
                  selectedOptions={[recipientMode]}
                  onOptionSelect={(_, data) => {
                    const next = String(data.optionValue || 'user_or_group');
                    setRecipientMode(next);
                    if (next !== 'user_or_group') {
                      setRecipientPeople([]);
                    }
                  }}
                >
                  {RECIPIENT_OPTIONS.map((item) => (
                    <Option key={item.value} value={item.value}>
                      {item.label}
                    </Option>
                  ))}
                </AppDropdown>
              ) : (
                <Input
                  className={styles.builderControl}
                  value={actionTarget}
                  onChange={(_, data) => setActionTarget(data.value)}
                  placeholder={
                    actionType === 'set_field'
                      ? 'Field name (e.g. priority, status)'
                      : 'Escalation target'
                  }
                />
              )}

              <Button
                appearance="secondary"
                disabled={usesPeoplePicker ? !canAddAction : !actionTarget.trim()}
                onClick={addAction}
              >
                Add
              </Button>

              {usesPeoplePicker && recipientMode === 'user_or_group' && (
                <div className={styles.builderPickerRow}>
                  <PeoplePickerField
                    multi={false}
                    placeholder="Search for a user or group"
                    value={recipientPeople}
                    onChange={setRecipientPeople}
                    onSearch={handleSearchPeople}
                    onResolve={handleResolvePerson}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </RightDetailPanel>
    </div>
  );
};

