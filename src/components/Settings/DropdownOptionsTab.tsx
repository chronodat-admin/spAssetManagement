import * as React from 'react';

import { Button, Field, Input, Tab, TabList, Text, tokens } from '@fluentui/react-components';

import { AddRegular, DeleteRegular } from '@fluentui/react-icons';

import type { FormSettings } from '../../lib/form-config/types';

import {

  formatAssetDropdownOptionLabel,

  getAssetDropdownOptions,

  listAssetDropdownFields,

  type IAssetDropdownFieldConfig

} from '../../utils/assetDropdownFields';

import { AppMessageBar } from '../Layout/AppMessageBar';

import { useWorkflowSettingsStyles } from './workflowSettingsStyles';



export interface IDropdownOptionsTabProps {

  formSettings: FormSettings;

  onChange: (next: FormSettings) => void;

}



export const DropdownOptionsTab: React.FC<IDropdownOptionsTabProps> = ({ formSettings, onChange }) => {

  const styles = useWorkflowSettingsStyles();

  const dropdownFields = React.useMemo(() => listAssetDropdownFields(formSettings), [formSettings]);

  const [activeTab, setActiveTab] = React.useState(dropdownFields[0]?.key || '');



  React.useEffect(() => {

    if (!dropdownFields.some((field) => field.key === activeTab)) {

      setActiveTab(dropdownFields[0]?.key || '');

    }

  }, [activeTab, dropdownFields]);



  const activeField =

    dropdownFields.find((field) => field.key === activeTab) || dropdownFields[0];



  const updateBuiltInOptions = (fieldKey: string, options: string[]): void => {

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



  const updateCustomOptions = (fieldKey: string, options: string[]): void => {

    onChange({

      ...formSettings,

      risks: {

        ...formSettings.risks,

        customFields: (formSettings.risks.customFields || []).map((field) =>

          field.key === fieldKey ? { ...field, options } : field

        )

      }

    });

  };



  const updateOptions = (field: IAssetDropdownFieldConfig, options: string[]): void => {

    if (field.source === 'custom') {

      updateCustomOptions(field.key, options);

      return;

    }

    updateBuiltInOptions(field.key, options);

  };



  const addOption = (field: IAssetDropdownFieldConfig): void => {

    const options = [...getAssetDropdownOptions(formSettings, field), ''];

    updateOptions(field, options);

  };



  const updateOption = (field: IAssetDropdownFieldConfig, index: number, value: string): void => {

    const options = [...getAssetDropdownOptions(formSettings, field)];

    options[index] = value;

    updateOptions(field, options);

  };



  const removeOption = (field: IAssetDropdownFieldConfig, index: number): void => {

    const options = getAssetDropdownOptions(formSettings, field).filter((_, idx) => idx !== index);

    updateOptions(field, options);

  };



  if (!activeField) {

    return (

      <AppMessageBar intent="info">

        No editable dropdown fields are configured for asset forms yet. Add custom dropdown fields under

        Forms, or use Asset Status and lookup lists for status and reference data.

      </AppMessageBar>

    );

  }



  const options = getAssetDropdownOptions(formSettings, activeField);



  return (

    <div>

      <AppMessageBar intent="info" style={{ marginBottom: tokens.spacingVerticalM }}>

        Asset status choices are managed under <strong>Asset Status</strong>. Asset type, category, vendor,

        and location values come from their lookup lists. This page covers choice dropdowns on asset forms.

      </AppMessageBar>



      <TabList

        selectedValue={activeTab}

        onTabSelect={(_, data) => setActiveTab(String(data.value || dropdownFields[0]?.key || ''))}

        style={{ flexWrap: 'wrap' }}

      >

        {dropdownFields.map((field) => (

          <Tab key={field.key} value={field.key}>

            {field.label}

          </Tab>

        ))}

      </TabList>



      <div className={styles.numberingCard} style={{ marginTop: tokens.spacingVerticalM }}>

        <Text weight="semibold">{activeField.label}</Text>

        {activeField.description ? (

          <Text className={styles.sectionDescription} block style={{ marginTop: tokens.spacingVerticalXXS }}>

            {activeField.description}

          </Text>

        ) : null}

        <div className={styles.list} style={{ marginTop: tokens.spacingVerticalS }}>

          {options.map((option, index) => (

            <div key={`${activeField.key}-${index}`} className={styles.optionRow}>

              <Input

                className={styles.optionInput}

                value={option}

                onChange={(_, data) => updateOption(activeField, index, data.value)}

                placeholder="Option value"

              />

              {option ? (

                <Text className={styles.rowMeta} style={{ minWidth: '140px' }}>

                  Displays as {formatAssetDropdownOptionLabel(activeField.key, option)}

                </Text>

              ) : null}

              <Button appearance="subtle" icon={<DeleteRegular />} onClick={() => removeOption(activeField, index)} />

            </div>

          ))}

        </div>

        <Button appearance="secondary" icon={<AddRegular />} onClick={() => addOption(activeField)}>

          Add option

        </Button>

      </div>



      <Field label="Note">

        <Text className={styles.sectionDescription}>

          Save settings to persist dropdown options and sync SharePoint choice fields where applicable.

        </Text>

      </Field>

    </div>

  );

};


