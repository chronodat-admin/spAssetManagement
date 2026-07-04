import * as React from 'react';
import {
  Button,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  Switch,
  Tab,
  TabList,
  Text,
  tokens
} from '@fluentui/react-components';
import { ArrowCounterclockwiseRegular } from '@fluentui/react-icons';
import { AppDropdown } from '../Dropdown/AppDropdown';
import type {
  INumberingConfig,
  IWorkflowSettings,
  NumberingEntityType,
  NumberingResetFrequency
} from '../../models/IWorkflowSettings';
import { resetNumberingSequence } from '../../lib/workflow-settings/numberingEngine';
import { buildNumberPreview } from '../../lib/workflow-settings/utils';
import { useWorkflowSettingsStyles } from './workflowSettingsStyles';

const NUMBERING_TABS: Array<{ entityType: NumberingEntityType; label: string }> = [
  { entityType: 'risk', label: 'Assets' },
  { entityType: 'business', label: 'Business' },
  { entityType: 'project', label: 'Projects' }
];

const ENTITY_LABELS: Record<NumberingEntityType, { label: string; description: string }> = {
  risk: { label: 'Assets', description: 'Auto-numbering for AM_AssetId values on create' },
  business: { label: 'Business', description: 'Reserved for future business codes' },
  project: { label: 'Project', description: 'Auto-numbering for project Code on create' }
};

const SEPARATOR_OPTIONS = [
  { value: '-', label: 'Dash (-)' },
  { value: '_', label: 'Underscore (_)' },
  { value: '', label: 'None' }
];

const DATE_FORMAT_OPTIONS = [
  { value: '', label: 'No date' },
  { value: 'YYYY', label: 'YYYY (year)' },
  { value: 'YYYYMMDD', label: 'YYYYMMDD' },
  { value: 'YYYYMM', label: 'YYYYMM' },
  { value: 'YYMMDD', label: 'YYMMDD' },
  { value: 'YYMM', label: 'YYMM' }
];

const RESET_FREQUENCY_OPTIONS: Array<{ value: NumberingResetFrequency; label: string }> = [
  { value: 'never', label: 'Never reset' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'daily', label: 'Daily' }
];

export interface INumberingSettingsTabProps {
  workflowSettings: IWorkflowSettings;
  onChange: (next: IWorkflowSettings) => void;
}

export const NumberingSettingsTab: React.FC<INumberingSettingsTabProps> = ({
  workflowSettings,
  onChange
}) => {
  const styles = useWorkflowSettingsStyles();
  const [resetMessage, setResetMessage] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<NumberingEntityType>('risk');

  const updateConfig = (entityType: NumberingEntityType, patch: Partial<INumberingConfig>): void => {
    const nextNumbering = workflowSettings.numbering.map((item) =>
      item.entityType === entityType ? { ...item, ...patch } : item
    );
    onChange({ ...workflowSettings, numbering: nextNumbering });
  };

  const handleReset = (entityType: NumberingEntityType): void => {
    onChange(resetNumberingSequence(workflowSettings, entityType));
    setResetMessage(`${ENTITY_LABELS[entityType].label} sequence reset to 1. Save settings to persist.`);
  };

  const config =
    workflowSettings.numbering.find((item) => item.entityType === activeTab) ||
    workflowSettings.numbering[0];

  if (!config) {
    return null;
  }

  const meta = ENTITY_LABELS[config.entityType];
  const preview = buildNumberPreview(
    config.prefix,
    config.padLength,
    config.nextValue,
    config.separator,
    config.dateFormat
  );

  return (
    <div>
      {resetMessage && (
        <MessageBar intent="success" style={{ marginBottom: tokens.spacingVerticalM }}>
          <MessageBarBody>{resetMessage}</MessageBarBody>
        </MessageBar>
      )}

      <TabList
        selectedValue={activeTab}
        onTabSelect={(_, data) => setActiveTab((data.value as NumberingEntityType) || 'risk')}
        style={{ flexWrap: 'wrap' }}
      >
        {NUMBERING_TABS.map((tab) => (
          <Tab key={tab.entityType} value={tab.entityType}>
            {tab.label}
          </Tab>
        ))}
      </TabList>

      <div className={styles.numberingCard} style={{ marginTop: tokens.spacingVerticalM }}>
        <div className={styles.settingRow}>
          <div className={styles.settingRowCopy}>
            <Text weight="semibold" block>
              {meta.label}
            </Text>
            <Text block className={styles.settingRowDescription}>
              {meta.description}
            </Text>
          </div>
          <Switch
            checked={config.enabled}
            onChange={(_, data) => updateConfig(config.entityType, { enabled: data.checked })}
          />
        </div>

        <Field label="Prefix">
          <Input
            value={config.prefix}
            onChange={(_, data) => updateConfig(config.entityType, { prefix: data.value.toUpperCase() })}
          />
        </Field>

        <Field label="Separator">
          <AppDropdown
            value={SEPARATOR_OPTIONS.find((item) => item.value === config.separator)?.label || 'Dash (-)'}
            selectedOptions={[config.separator || '-']}
            onOptionSelect={(_, data) =>
              updateConfig(config.entityType, { separator: data.optionValue ?? '-' })
            }
          >
            {SEPARATOR_OPTIONS.map((item) => (
              <Option key={item.label} value={item.value}>
                {item.label}
              </Option>
            ))}
          </AppDropdown>
        </Field>

        <Field label="Date format">
          <AppDropdown
            value={
              DATE_FORMAT_OPTIONS.find((item) => item.value === (config.dateFormat || ''))?.label ||
              'No date'
            }
            selectedOptions={[config.dateFormat || '']}
            onOptionSelect={(_, data) =>
              updateConfig(config.entityType, {
                dateFormat: data.optionValue ? String(data.optionValue) : null
              })
            }
          >
            {DATE_FORMAT_OPTIONS.map((item) => (
              <Option key={item.label} value={item.value}>
                {item.label}
              </Option>
            ))}
          </AppDropdown>
        </Field>

        <Field label="Sequence reset">
          <AppDropdown
            value={
              RESET_FREQUENCY_OPTIONS.find((item) => item.value === (config.resetFrequency || 'never'))
                ?.label || 'Never reset'
            }
            selectedOptions={[config.resetFrequency || 'never']}
            onOptionSelect={(_, data) =>
              updateConfig(config.entityType, {
                resetFrequency: (data.optionValue as NumberingResetFrequency) || 'never'
              })
            }
          >
            {RESET_FREQUENCY_OPTIONS.map((item) => (
              <Option key={item.value} value={item.value}>
                {item.label}
              </Option>
            ))}
          </AppDropdown>
        </Field>

        <Field label="Sequence pad length">
          <Input
            value={String(config.padLength)}
            onChange={(_, data) =>
              updateConfig(config.entityType, {
                padLength: Math.min(8, Math.max(1, Number(data.value) || 4))
              })
            }
          />
        </Field>

        <Field label="Next value" hint="Updated automatically when records are created.">
          <Input value={String(config.nextValue)} readOnly />
        </Field>

        <Text className={styles.preview}>Preview: {preview}</Text>

        <Button
          appearance="secondary"
          icon={<ArrowCounterclockwiseRegular />}
          onClick={() => handleReset(config.entityType)}
        >
          Reset sequence
        </Button>
      </div>
    </div>
  );
};
