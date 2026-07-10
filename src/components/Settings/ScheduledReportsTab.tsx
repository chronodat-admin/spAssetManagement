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
  Text,
  tokens
} from '@fluentui/react-components';
import { AddRegular, CalendarClockRegular, DeleteRegular, EditRegular } from '@fluentui/react-icons';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { EmptyState } from '../Layout/EmptyState';
import { RightDetailPanel } from '../Layout/RightDetailPanel';
import type {
  IScheduledReport,
  IWorkflowSettings,
  ScheduledReportFrequency,
  ScheduledReportType
} from '../../models/IWorkflowSettings';
import type { IAppSettings } from '../../models/IAssetApp';
import { createTagId } from '../../lib/workflow-settings/utils';
import { serializeWorkflowSettings } from '../../lib/workflow-settings/storage';
import { AssetService } from '../../services/AssetService';
import { useWorkflowSettingsStyles } from './workflowSettingsStyles';
import { useContentCardStyles } from '../Layout/ContentCard';
import { AppMessageBar } from '../Layout/AppMessageBar';

import {
  DATA_TABLE_CLASS,
  getDataTableLayoutStyle,
  getListColumnStyle
} from '../../lib/list-view/columnWidths';

const REPORT_TYPES: Array<{ value: ScheduledReportType; label: string }> = [
  { value: 'assets', label: 'AM_Assets' },
  { value: 'business', label: 'Business' },
  { value: 'projects', label: 'Projects' }
];

const FREQUENCIES: Array<{ value: ScheduledReportFrequency; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
];

function computeNextRun(frequency: ScheduledReportFrequency): string {
  const next = new Date();
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next.toISOString();
}

export interface IScheduledReportsTabProps {
  workflowSettings: IWorkflowSettings;
  onChange: (next: IWorkflowSettings) => void;
  riskService: AssetService;
  settings?: IAppSettings;
}

export const ScheduledReportsTab: React.FC<IScheduledReportsTabProps> = ({
  workflowSettings,
  onChange,
  riskService,
  settings
}) => {
  const styles = useWorkflowSettingsStyles();
  const cardStyles = useContentCardStyles();
  const reports = workflowSettings.scheduledReports || [];
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [reportType, setReportType] = React.useState<ScheduledReportType>('assets');
  const [frequency, setFrequency] = React.useState<ScheduledReportFrequency>('weekly');
  const [isActive, setIsActive] = React.useState(true);
  const [recipientInput, setRecipientInput] = React.useState('');
  const [recipients, setRecipients] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');

  const resetForm = (): void => {
    setEditingId(null);
    setReportType('assets');
    setFrequency('weekly');
    setIsActive(true);
    setRecipientInput('');
    setRecipients([]);
  };

  const openCreate = (): void => {
    resetForm();
    setSaveError('');
    setPanelOpen(true);
  };

  const openEdit = (report: IScheduledReport): void => {
    setEditingId(report.id);
    setReportType(report.reportType);
    setFrequency(report.frequency);
    setIsActive(report.isActive);
    setRecipients([...report.recipients]);
    setRecipientInput('');
    setSaveError('');
    setPanelOpen(true);
  };

  const addRecipient = (): void => {
    const email = recipientInput.trim();
    if (email && email.includes('@') && !recipients.includes(email)) {
      setRecipients((prev) => [...prev, email]);
      setRecipientInput('');
    }
  };

  const saveReport = async (): Promise<void> => {
    if (recipients.length === 0) return;

    const nextReport: IScheduledReport = {
      id: editingId || createTagId().replace('tag', 'report'),
      reportType,
      frequency,
      recipients,
      isActive,
      nextRunAt: computeNextRun(frequency)
    };
    const nextReports = editingId
      ? reports.map((item) => (item.id === editingId ? { ...item, ...nextReport } : item))
      : [...reports, nextReport];
    const nextWorkflowSettings = { ...workflowSettings, scheduledReports: nextReports };

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
      setSaveError(err instanceof Error ? err.message : 'Failed to save scheduled report.');
    } finally {
      setSaving(false);
    }
  };

  const removeReport = (id: string): void => {
    onChange({
      ...workflowSettings,
      scheduledReports: reports.filter((item) => item.id !== id)
    });
  };

  const toggleReport = (id: string): void => {
    onChange({
      ...workflowSettings,
      scheduledReports: reports.map((item) =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      )
    });
  };

  return (
    <div>
      <div className={styles.tabToolbar}>
        <Button appearance="primary" icon={<AddRegular />} onClick={openCreate}>
          Add schedule
        </Button>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          bordered
          icon={<CalendarClockRegular />}
          title="No scheduled reports"
          description="Create a schedule to automatically deliver reports via email"
          action={
            <Button appearance="primary" icon={<AddRegular />} onClick={openCreate}>
              Add schedule
            </Button>
          }
        />
      ) : (
        <div className={cardStyles.tableWrap}>
          <Table
            className={DATA_TABLE_CLASS}
            style={{ ...getDataTableLayoutStyle(980), marginTop: tokens.spacingVerticalM }}
          >
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('report')}>
                  Report
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('frequency')}>
                  Frequency
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('recipients')}>
                  Recipients
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('nextRun')}>
                  Next run
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('active')}>
                  Active
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('actions')}>
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('report')}>
                    {report.reportType}
                  </TableCell>
                  <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('frequency')}>
                    {report.frequency}
                  </TableCell>
                  <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('recipients')}>
                    {report.recipients.join(', ')}
                  </TableCell>
                  <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('nextRun')}>
                    {report.nextRunAt ? new Date(report.nextRunAt).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell style={getListColumnStyle('active')}>
                    <Badge appearance={report.isActive ? 'filled' : 'outline'}>
                      {report.isActive ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell style={getListColumnStyle('actions')}>
                    <Button appearance="subtle" icon={<EditRegular />} onClick={() => openEdit(report)} />
                    <Button appearance="subtle" icon={<DeleteRegular />} onClick={() => removeReport(report.id)} />
                    <Switch checked={report.isActive} onChange={() => toggleReport(report.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RightDetailPanel
        open={panelOpen}
        title={editingId ? 'Edit scheduled report' : 'Add scheduled report'}
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
              disabled={recipients.length === 0 || saving}
              icon={saving ? <Spinner size="tiny" /> : undefined}
              onClick={() => void saveReport()}
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
          <Field label="Report type">
            <AppDropdown
              value={REPORT_TYPES.find((item) => item.value === reportType)?.label || 'AM_Assets'}
              selectedOptions={[reportType]}
              onOptionSelect={(_, data) =>
                setReportType((data.optionValue as ScheduledReportType) || 'assets')
              }
            >
              {REPORT_TYPES.map((item) => (
                <Option key={item.value} value={item.value}>
                  {item.label}
                </Option>
              ))}
            </AppDropdown>
          </Field>
          <Field label="Frequency">
            <AppDropdown
              value={FREQUENCIES.find((item) => item.value === frequency)?.label || 'Weekly'}
              selectedOptions={[frequency]}
              onOptionSelect={(_, data) =>
                setFrequency((data.optionValue as ScheduledReportFrequency) || 'weekly')
              }
            >
              {FREQUENCIES.map((item) => (
                <Option key={item.value} value={item.value}>
                  {item.label}
                </Option>
              ))}
            </AppDropdown>
          </Field>
          <Field label="Recipients" required hint="Add at least one email address">
            <div className={styles.optionRow}>
              <Input
                className={styles.optionInput}
                value={recipientInput}
                onChange={(_, data) => setRecipientInput(data.value)}
                placeholder="email@company.com"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addRecipient();
                  }
                }}
              />
              <Button type="button" appearance="secondary" onClick={addRecipient}>
                Add
              </Button>
            </div>
            {recipients.map((email) => (
              <div key={email} className={styles.optionRow}>
                <Text>{email}</Text>
                <Button
                  appearance="subtle"
                  icon={<DeleteRegular />}
                  onClick={() => setRecipients((prev) => prev.filter((item) => item !== email))}
                />
              </div>
            ))}
          </Field>
          <Switch label="Active" checked={isActive} onChange={(_, data) => setIsActive(data.checked)} />
        </div>
      </RightDetailPanel>
    </div>
  );
};
