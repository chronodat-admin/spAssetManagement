import * as React from 'react';
import { Field, Option, Text, tokens } from '@fluentui/react-components';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { DEFAULT_FORM_SETTINGS } from '../../lib/form-config/defaults';
import {
  PRIMARY_FORM_ENTITIES,
  SECONDARY_FORM_ENTITIES
} from '../../lib/form-config/entityFormSettingsUtils';
import { serializeFormSettings } from '../../lib/form-config/storage';
import type { EntityKey, FormSettings } from '../../lib/form-config/types';
import { IAppSettings } from '../../models/IAssetApp';
import { EntityFormSettingsEditor } from './EntityFormSettingsEditor';

const ALL_ENTITIES: Array<{ key: EntityKey; label: string; description: string }> = [
  ...PRIMARY_FORM_ENTITIES,
  ...SECONDARY_FORM_ENTITIES
];

export interface IFormSettingsTabProps {
  formSettings: FormSettings;
  onChange: (next: FormSettings) => void;
}

export const FormSettingsTab: React.FC<IFormSettingsTabProps> = ({ formSettings, onChange }) => {
  const [entity, setEntity] = React.useState<EntityKey>('risks');
  const selectedEntity = ALL_ENTITIES.find((item) => item.key === entity);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL }}>
      <Field label="Configure forms for">
        <AppDropdown
          value={selectedEntity?.label || 'AM_Assets'}
          selectedOptions={[entity]}
          onOptionSelect={(_, data) => setEntity((data.optionValue as EntityKey) || 'risks')}
        >
          {ALL_ENTITIES.map((item) => (
            <Option key={item.key} value={item.key}>
              {item.label}
            </Option>
          ))}
        </AppDropdown>
      </Field>

      {selectedEntity ? (
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          {selectedEntity.description}
        </Text>
      ) : null}

      <EntityFormSettingsEditor entity={entity} formSettings={formSettings} onChange={onChange} />
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
