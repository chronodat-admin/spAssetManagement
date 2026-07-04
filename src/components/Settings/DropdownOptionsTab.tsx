import * as React from 'react';
import { Button, Field, Input, Tab, TabList, Text, tokens } from '@fluentui/react-components';
import { AddRegular, DeleteRegular } from '@fluentui/react-icons';
import type { FormSettings } from '../../lib/form-config/types';
import { useWorkflowSettingsStyles } from './workflowSettingsStyles';

const DROPDOWN_FIELDS: Array<{ key: string; label: string; fallback: string[] }> = [
  { key: 'type', label: 'Risk type', fallback: ['Risk', 'Opportunity'] },
  {
    key: 'controlEffectiveness',
    label: 'Control effectiveness',
    fallback: ['Good', 'Fair', 'Poor']
  }
];

function getFieldOptions(formSettings: FormSettings, fieldKey: string, fallback: string[]): string[] {
  const field = (formSettings.risks.fields as Record<string, { options?: string[] }>)[fieldKey];
  if (field?.options && field.options.length > 0) {
    return field.options;
  }
  return fallback;
}

export interface IDropdownOptionsTabProps {
  formSettings: FormSettings;
  onChange: (next: FormSettings) => void;
}

export const DropdownOptionsTab: React.FC<IDropdownOptionsTabProps> = ({ formSettings, onChange }) => {
  const styles = useWorkflowSettingsStyles();
  const [activeTab, setActiveTab] = React.useState(DROPDOWN_FIELDS[0].key);

  const activeField =
    DROPDOWN_FIELDS.find((field) => field.key === activeTab) || DROPDOWN_FIELDS[0];

  const updateOptions = (fieldKey: string, options: string[]): void => {
    const current = formSettings.risks.fields[fieldKey] || {
      label: fieldKey,
      create: true,
      createRequired: false,
      edit: true,
      editRequired: false,
      view: true
    };

    onChange({
      ...formSettings,
      risks: {
        ...formSettings.risks,
        fields: {
          ...formSettings.risks.fields,
          [fieldKey]: {
            ...current,
            options
          }
        }
      }
    });
  };

  const addOption = (fieldKey: string, fallback: string[]): void => {
    const options = [...getFieldOptions(formSettings, fieldKey, fallback), ''];
    updateOptions(fieldKey, options);
  };

  const updateOption = (
    fieldKey: string,
    fallback: string[],
    index: number,
    value: string
  ): void => {
    const options = [...getFieldOptions(formSettings, fieldKey, fallback)];
    options[index] = value;
    updateOptions(fieldKey, options);
  };

  const removeOption = (fieldKey: string, fallback: string[], index: number): void => {
    const options = getFieldOptions(formSettings, fieldKey, fallback).filter((_, idx) => idx !== index);
    updateOptions(fieldKey, options);
  };

  const options = getFieldOptions(formSettings, activeField.key, activeField.fallback);

  return (
    <div>
      <TabList
        selectedValue={activeTab}
        onTabSelect={(_, data) => setActiveTab(String(data.value || DROPDOWN_FIELDS[0].key))}
        style={{ flexWrap: 'wrap' }}
      >
        {DROPDOWN_FIELDS.map((field) => (
          <Tab key={field.key} value={field.key}>
            {field.label}
          </Tab>
        ))}
      </TabList>

      <div className={styles.numberingCard} style={{ marginTop: tokens.spacingVerticalM }}>
        <Text weight="semibold">{activeField.label}</Text>
        <div className={styles.list} style={{ marginTop: tokens.spacingVerticalS }}>
          {options.map((option, index) => (
            <div key={`${activeField.key}-${index}`} className={styles.optionRow}>
              <Input
                className={styles.optionInput}
                value={option}
                onChange={(_, data) =>
                  updateOption(activeField.key, activeField.fallback, index, data.value)
                }
              />
              <Button
                appearance="subtle"
                icon={<DeleteRegular />}
                onClick={() => removeOption(activeField.key, activeField.fallback, index)}
              />
            </div>
          ))}
        </div>
        <Button
          appearance="secondary"
          icon={<AddRegular />}
          onClick={() => addOption(activeField.key, activeField.fallback)}
        >
          Add option
        </Button>
      </div>

      <Field label="Note">
        <Text className={styles.sectionDescription}>
          Save settings to persist dropdown options.
        </Text>
      </Field>
    </div>
  );
};
