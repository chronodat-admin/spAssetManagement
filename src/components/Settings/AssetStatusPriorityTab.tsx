import * as React from 'react';
import {
  Button,
  Field,
  Input,
  Option,
  Tab,
  TabList,
  Text,
  tokens
} from '@fluentui/react-components';
import { AddRegular, DeleteRegular, EditRegular, FlagRegular, ListRegular } from '@fluentui/react-icons';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { RightDetailPanel } from '../Layout/RightDetailPanel';
import type {
  IAssetCustomPriority,
  IAssetCustomStatus,
  IWorkflowSettings,
  StatusBucket
} from '../../models/IWorkflowSettings';
import { STATUS_BUCKET_LABELS, STATUS_BUCKETS } from '../../models/IWorkflowSettings';
import {
  createPriorityId,
  createStatusId,
  slugifyStatusName
} from '../../lib/workflow-settings/utils';
import {
  PRIORITY_COLOR_PRESETS,
  STATUS_COLOR_PRESETS,
  useWorkflowSettingsStyles
} from './workflowSettingsStyles';

export interface AssetStatusPriorityTabProps {
  workflowSettings: IWorkflowSettings;
  onChange: (next: IWorkflowSettings) => void;
}

export const AssetStatusPriorityTab: React.FC<AssetStatusPriorityTabProps> = ({
  workflowSettings,
  onChange
}) => {
  const styles = useWorkflowSettingsStyles();
  const [subTab, setSubTab] = React.useState<'statuses' | 'priorities'>('statuses');
  const [statusPanelOpen, setStatusPanelOpen] = React.useState(false);
  const [priorityPanelOpen, setPriorityPanelOpen] = React.useState(false);
  const [editingStatusId, setEditingStatusId] = React.useState<string | null>(null);
  const [editingPriorityId, setEditingPriorityId] = React.useState<string | null>(null);

  const [statusName, setStatusName] = React.useState('');
  const [statusColor, setStatusColor] = React.useState(STATUS_COLOR_PRESETS[0]);
  const [statusBucket, setStatusBucket] = React.useState<StatusBucket>('open');

  const [priorityName, setPriorityName] = React.useState('');
  const [priorityLevel, setPriorityLevel] = React.useState(2);
  const [priorityColor, setPriorityColor] = React.useState(PRIORITY_COLOR_PRESETS[1]);

  const statuses = [...workflowSettings.customStatuses].sort((a, b) => a.sortOrder - b.sortOrder);
  const priorities = [...workflowSettings.customPriorities].sort((a, b) => a.sortOrder - b.sortOrder);

  const resetStatusForm = (): void => {
    setEditingStatusId(null);
    setStatusName('');
    setStatusColor(STATUS_COLOR_PRESETS[0]);
    setStatusBucket('open');
  };

  const resetPriorityForm = (): void => {
    setEditingPriorityId(null);
    setPriorityName('');
    setPriorityLevel(2);
    setPriorityColor(PRIORITY_COLOR_PRESETS[1]);
  };

  const openStatusCreate = (): void => {
    resetStatusForm();
    setStatusPanelOpen(true);
  };

  const openStatusEdit = (status: IAssetCustomStatus): void => {
    setEditingStatusId(status.id);
    setStatusName(status.name);
    setStatusColor(status.color);
    setStatusBucket(status.bucket);
    setStatusPanelOpen(true);
  };

  const openPriorityCreate = (): void => {
    resetPriorityForm();
    setPriorityPanelOpen(true);
  };

  const openPriorityEdit = (priority: IAssetCustomPriority): void => {
    setEditingPriorityId(priority.id);
    setPriorityName(priority.name);
    setPriorityLevel(priority.level);
    setPriorityColor(priority.color);
    setPriorityPanelOpen(true);
  };

  const saveStatus = (): void => {
    const name = statusName.trim();
    if (!name) return;

    const nextStatus: IAssetCustomStatus = {
      id: editingStatusId || createStatusId(),
      name,
      slug: slugifyStatusName(name),
      color: statusColor,
      bucket: statusBucket,
      sortOrder: editingStatusId
        ? statuses.find((item) => item.id === editingStatusId)?.sortOrder ?? statuses.length
        : statuses.length
    };

    const nextStatuses = editingStatusId
      ? statuses.map((item) => (item.id === editingStatusId ? nextStatus : item))
      : [...statuses, nextStatus];

    onChange({ ...workflowSettings, customStatuses: nextStatuses });
    setStatusPanelOpen(false);
    resetStatusForm();
  };

  const savePriority = (): void => {
    const name = priorityName.trim();
    if (!name) return;

    const nextPriority: IAssetCustomPriority = {
      id: editingPriorityId || createPriorityId(),
      name,
      slug: slugifyStatusName(name),
      level: Math.min(10, Math.max(1, priorityLevel)),
      color: priorityColor,
      sortOrder: editingPriorityId
        ? priorities.find((item) => item.id === editingPriorityId)?.sortOrder ?? priorities.length
        : priorities.length
    };

    const nextPriorities = editingPriorityId
      ? priorities.map((item) => (item.id === editingPriorityId ? nextPriority : item))
      : [...priorities, nextPriority];

    onChange({ ...workflowSettings, customPriorities: nextPriorities });
    setPriorityPanelOpen(false);
    resetPriorityForm();
  };

  const removeStatus = (id: string): void => {
    onChange({
      ...workflowSettings,
      customStatuses: statuses.filter((item) => item.id !== id)
    });
  };

  const removePriority = (id: string): void => {
    onChange({
      ...workflowSettings,
      customPriorities: priorities.filter((item) => item.id !== id)
    });
  };

  return (
    <div>
      <TabList
        selectedValue={subTab}
        onTabSelect={(_, data) => setSubTab((data.value as 'statuses' | 'priorities') || 'statuses')}
      >
        <Tab value="statuses">Custom Statuses</Tab>
        <Tab value="priorities">Custom Priorities</Tab>
      </TabList>

      {subTab === 'statuses' && (
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Text weight="semibold" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ListRegular /> Custom Statuses
          </Text>
          <Text className={styles.sectionDescription}>
            Add statuses beyond the default open, in progress, mitigation, resolved, closed.
          </Text>
          <Button appearance="primary" icon={<AddRegular />} onClick={openStatusCreate}>
            Add Status
          </Button>
          <div className={styles.list} style={{ marginTop: tokens.spacingVerticalM }}>
            {statuses.map((status) => (
              <div key={status.id} className={styles.listRow}>
                <div className={styles.listRowMain}>
                  <span className={styles.colorDot} style={{ backgroundColor: status.color }} />
                  <Text weight="semibold">{status.name}</Text>
                  <Text className={styles.rowMeta}>({STATUS_BUCKET_LABELS[status.bucket]})</Text>
                </div>
                <div className={styles.rowActions}>
                  <Button appearance="subtle" icon={<EditRegular />} onClick={() => openStatusEdit(status)} />
                  <Button appearance="subtle" icon={<DeleteRegular />} onClick={() => removeStatus(status.id)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'priorities' && (
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Text weight="semibold" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FlagRegular /> Custom Priorities
          </Text>
          <Text className={styles.sectionDescription}>
            Add priority levels beyond the default low, medium, high, critical.
          </Text>
          <Button appearance="primary" icon={<AddRegular />} onClick={openPriorityCreate}>
            Add Priority
          </Button>
          <div className={styles.list} style={{ marginTop: tokens.spacingVerticalM }}>
            {priorities.map((priority) => (
              <div key={priority.id} className={styles.listRow}>
                <div className={styles.listRowMain}>
                  <span className={styles.colorDot} style={{ backgroundColor: priority.color }} />
                  <Text weight="semibold">{priority.name}</Text>
                  <Text className={styles.rowMeta}>Level {priority.level}</Text>
                </div>
                <div className={styles.rowActions}>
                  <Button appearance="subtle" icon={<EditRegular />} onClick={() => openPriorityEdit(priority)} />
                  <Button appearance="subtle" icon={<DeleteRegular />} onClick={() => removePriority(priority.id)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <RightDetailPanel
        open={statusPanelOpen}
        title={editingStatusId ? 'Edit Status' : 'Add Status'}
        onClose={() => {
          setStatusPanelOpen(false);
          resetStatusForm();
        }}
        footer={
          <div className={styles.panelFooter}>
            <Button appearance="secondary" onClick={() => setStatusPanelOpen(false)}>
              Cancel
            </Button>
            <Button appearance="primary" disabled={!statusName.trim()} onClick={saveStatus}>
              Save
            </Button>
          </div>
        }
      >
        <div className={styles.panelBody}>
          <Field label="Status name" required>
            <Input value={statusName} onChange={(_, data) => setStatusName(data.value)} />
          </Field>
          <Field label="Color">
            <div className={styles.colorPicker}>
              {STATUS_COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`${styles.colorSwatch} ${statusColor === color ? styles.colorSwatchActive : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setStatusColor(color)}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </Field>
          <Field label="Counts as">
            <AppDropdown
              value={STATUS_BUCKET_LABELS[statusBucket]}
              selectedOptions={[statusBucket]}
              onOptionSelect={(_, data) => setStatusBucket((data.optionValue as StatusBucket) || 'open')}
            >
              {STATUS_BUCKETS.map((bucket) => (
                <Option key={bucket} value={bucket}>
                  {STATUS_BUCKET_LABELS[bucket]}
                </Option>
              ))}
            </AppDropdown>
          </Field>
        </div>
      </RightDetailPanel>

      <RightDetailPanel
        open={priorityPanelOpen}
        title={editingPriorityId ? 'Edit Priority' : 'Add Priority'}
        onClose={() => {
          setPriorityPanelOpen(false);
          resetPriorityForm();
        }}
        footer={
          <div className={styles.panelFooter}>
            <Button appearance="secondary" onClick={() => setPriorityPanelOpen(false)}>
              Cancel
            </Button>
            <Button appearance="primary" disabled={!priorityName.trim()} onClick={savePriority}>
              Save
            </Button>
          </div>
        }
      >
        <div className={styles.panelBody}>
          <Field label="Priority name" required>
            <Input value={priorityName} onChange={(_, data) => setPriorityName(data.value)} />
          </Field>
          <Field label="Level (1-10)">
            <Input
              type="number"
              min={1}
              max={10}
              value={String(priorityLevel)}
              onChange={(_, data) =>
                setPriorityLevel(Math.min(10, Math.max(1, Number(data.value) || 1)))
              }
            />
          </Field>
          <Field label="Color">
            <div className={styles.colorPicker}>
              {PRIORITY_COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`${styles.colorSwatch} ${priorityColor === color ? styles.colorSwatchActive : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setPriorityColor(color)}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </Field>
        </div>
      </RightDetailPanel>
    </div>
  );
};
