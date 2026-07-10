import * as React from 'react';
import { Spinner } from '@fluentui/react-components';
import { parseFormSettings } from '../../lib/form-config/storage';
import type { FormMode } from '../../lib/form-config/types';
import { IAppSettings, IAsset, ILookupItem } from '../../models/IAssetApp';
import {
  ASSET_TYPES_LIST_TITLE,
  LOCATIONS_LIST_TITLE,
  VENDORS_LIST_TITLE
} from '../../models/IListDefinitions';
import { AssetService, type IAssetSaveInput } from '../../services/AssetService';
import { IAssetFormHandle, AssetForm } from '../Assets/AssetForm';

export interface IDynamicAssetFormProps {
  mode: FormMode;
  risk?: IAsset;
  riskService: AssetService;
  settings?: IAppSettings;
  categories: ILookupItem[];
  assetTypes?: ILookupItem[];
  vendors?: ILookupItem[];
  locations?: ILookupItem[];
  onSave: () => void;
  onCancel: () => void;
}

export const DynamicAssetForm: React.FC<IDynamicAssetFormProps> = ({
  mode,
  risk,
  riskService,
  settings,
  categories,
  assetTypes: assetTypesProp,
  vendors: vendorsProp,
  locations: locationsProp,
  onSave,
  onCancel: _onCancel
}) => {
  const formRef = React.useRef<IAssetFormHandle>(null);
  const [saving, setSaving] = React.useState(false);
  const [loadingLookups, setLoadingLookups] = React.useState(false);
  const [assetTypes, setAssetTypes] = React.useState<ILookupItem[]>(assetTypesProp || []);
  const [vendors, setVendors] = React.useState<ILookupItem[]>(vendorsProp || []);
  const [locations, setLocations] = React.useState<ILookupItem[]>(locationsProp || []);
  const readOnly = mode === 'view';
  const formConfig = React.useMemo(() => parseFormSettings(settings), [settings]);
  const statusOptions = React.useMemo(
    () => riskService.getAssetStatusOptions(settings),
    [riskService, settings]
  );

  React.useEffect(() => {
    if (assetTypesProp && vendorsProp && locationsProp) {
      setAssetTypes(assetTypesProp);
      setVendors(vendorsProp);
      setLocations(locationsProp);
      return;
    }

    let cancelled = false;
    setLoadingLookups(true);

    void Promise.all([
      assetTypesProp
        ? Promise.resolve(assetTypesProp)
        : riskService.getLookupItems(ASSET_TYPES_LIST_TITLE).catch(() => [] as ILookupItem[]),
      vendorsProp
        ? Promise.resolve(vendorsProp)
        : riskService.getLookupItems(VENDORS_LIST_TITLE).catch(() => [] as ILookupItem[]),
      locationsProp
        ? Promise.resolve(locationsProp)
        : riskService.getLookupItems(LOCATIONS_LIST_TITLE).catch(() => [] as ILookupItem[])
    ])
      .then(([nextAssetTypes, nextVendors, nextLocations]) => {
        if (!cancelled) {
          setAssetTypes(nextAssetTypes);
          setVendors(nextVendors);
          setLocations(nextLocations);
        }
      })
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) {
          setLoadingLookups(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [assetTypesProp, vendorsProp, locationsProp, riskService]);

  const handleSubmit = async (payload: Partial<IAssetSaveInput>): Promise<void> => {
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

  if (saving || loadingLookups) {
    return <Spinner label={saving ? 'Saving...' : 'Loading form...'} />;
  }

  return (
    <AssetForm
      ref={formRef}
      risk={risk}
      readOnly={readOnly}
      formConfig={formConfig}
      statusOptions={statusOptions}
      categories={categories}
      assetTypes={assetTypes}
      vendors={vendors}
      locations={locations}
      onSubmit={readOnly ? undefined : handleSubmit}
    />
  );
};
