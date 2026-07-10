import * as React from 'react';
import { Field, Option, Text, tokens } from '@fluentui/react-components';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { DEFAULT_FORM_SETTINGS } from '../../lib/form-config/defaults';
import { FORM_ENTITY_OPTIONS } from '../../lib/form-config/entityFormSettingsUtils';
import { serializeFormSettings } from '../../lib/form-config/storage';
import type { FormSettings } from '../../lib/form-config/types';
import { IAppSettings } from '../../models/IAssetApp';
import { EntityFormSettingsEditor } from './EntityFormSettingsEditor';

export interface IFormSettingsTabProps {
  formSettings: FormSettings;
  onChange: (next: FormSettings) => void;
}

export const FormSettingsTab: React.FC<IFormSettingsTabProps> = ({ formSettings, onChange }) => {
  const [selectedEntityId, setSelectedEntityId] = React.useState('assets');
  const selectedEntity =
    FORM_ENTITY_OPTIONS.find((item) => item.id === selectedEntityId) || FORM_ENTITY_OPTIONS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL }}>
      <Field label="Configure forms for">
        <AppDropdown
          value={selectedEntity.label}
          selectedOptions={[selectedEntityId]}
          onOptionSelect={(_, data) => setSelectedEntityId(data.optionValue || 'assets')}
        >
          {FORM_ENTITY_OPTIONS.map((item) => (
            <Option key={item.id} value={item.id}>
              {item.label}
            </Option>
          ))}
        </AppDropdown>
      </Field>

      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
        {selectedEntity.description}
      </Text>

      <EntityFormSettingsEditor
        entity={selectedEntity.entity}
        formSettings={formSettings}
        onChange={onChange}
      />
    </div>
  );
};

export function buildFormSettingsForSave(settings: IAppSettings, formSettings: FormSettings): Partial<IAppSettings> {
  return {
    RequestFormTabs: serializeFormSettings(formSettings),
    RequestNewFormFields: JSON.stringify(formSettings.risks.customFields || [])
  };
}

export function getDefaultFormSettingsForSeed(): Pick<IAppSettings, 'RequestFormTabs' | 'RequestNewFormFields'> {
  return {
    RequestFormTabs: serializeFormSettings(DEFAULT_FORM_SETTINGS),
    RequestNewFormFields: '[]'
  };
}
