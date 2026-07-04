import * as React from 'react';
import { Spinner } from '@fluentui/react-components';
import { parseFormSettings } from '../../lib/form-config/storage';
import type { FormMode } from '../../lib/form-config/types';
import { IAppSettings, IAsset, ILookupItem } from '../../models/IAssetApp';
import { AssetService, type IAssetSaveInput } from '../../services/AssetService';
import { IAssetFormHandle, AssetForm } from '../Assets/AssetForm';

export interface IDynamicAssetFormProps {
  mode: FormMode;
  risk?: IAsset;
  riskService: AssetService;
  settings?: IAppSettings;
  categories: ILookupItem[];
  onSave: () => void;
  onCancel: () => void;
}

export const DynamicAssetForm: React.FC<IDynamicAssetFormProps> = ({
  mode,
  risk,
  riskService,
  settings,
  onSave,
  onCancel: _onCancel
}) => {
  const formRef = React.useRef<IAssetFormHandle>(null);
  const [saving, setSaving] = React.useState(false);
  const readOnly = mode === 'view';
  const formConfig = React.useMemo(() => parseFormSettings(settings), [settings]);

  const handleSubmit = async (payload: Partial<IAsset>): Promise<void> => {
    setSaving(true);
    try {
      const input = payload as IAssetSaveInput;
      if (mode === 'create') {
        await riskService.createAsset(input);
      } else if (risk?.Id) {
        await riskService.updateAsset(risk.Id, input);
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  if (saving) {
    return <Spinner label="Saving..." />;
  }

  return (
    <AssetForm
      ref={formRef}
      risk={risk}
      readOnly={readOnly}
      formConfig={formConfig}
      onSubmit={readOnly ? undefined : handleSubmit}
    />
  );
};
