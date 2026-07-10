import * as React from 'react';
import {
  Field,
  Input,
  Text,
  Textarea,
  mergeClasses
} from '@fluentui/react-components';
import { parseFormSettings } from '../../lib/form-config/storage';
import { ILookupItem, IAsset } from '../../models/IAssetApp';
import { IAssetSaveInput } from '../../services/AssetService';
import { validateAssetForm } from '../../utils/assetValidation';
import { useFormStyles } from '../Forms/formStyles';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { Option } from '@fluentui/react-components';
import { PageNotifications } from '../Layout/PageNotifications';


export type AssetFormTab = 'details';

export interface IAssetFormHandle {
  submit: () => Promise<boolean>;
}

export interface IAssetFormProps {
  risk?: IAsset;
  readOnly?: boolean;
  formConfig?: ReturnType<typeof parseFormSettings>;
  statusOptions?: string[];
  categories?: ILookupItem[];
  assetTypes?: ILookupItem[];
  vendors?: ILookupItem[];
  locations?: ILookupItem[];
  onSubmit?: (payload: Partial<IAssetSaveInput>) => Promise<void>;
}

const NO_LOOKUP_VALUE = '__none__';

function lookupTitle(value?: { Id: number; Title: string }): string {
  return value?.Title || '';
}

export const AssetForm = React.forwardRef<IAssetFormHandle, IAssetFormProps>(
  (
    {
      risk,
      readOnly,
      statusOptions = [],
      categories = [],
      assetTypes = [],
      vendors = [],
      locations = [],
      onSubmit
    },
    ref
  ) => {
    const styles = useFormStyles();
    const [error, setError] = React.useState('');
    const [title, setTitle] = React.useState(risk?.Title || '');
    const [assetId, setAssetId] = React.useState(risk?.AM_AssetId || '');
    const [categoryId, setCategoryId] = React.useState(
      risk?.AM_Category?.Id ? String(risk.AM_Category.Id) : NO_LOOKUP_VALUE
    );
    const [assetTypeId, setAssetTypeId] = React.useState(
      risk?.AM_AssetType?.Id ? String(risk.AM_AssetType.Id) : NO_LOOKUP_VALUE
    );
    const [vendorId, setVendorId] = React.useState(
      risk?.AM_Vendor?.Id ? String(risk.AM_Vendor.Id) : NO_LOOKUP_VALUE
    );
    const [locationId, setLocationId] = React.useState(
      risk?.AM_Location?.Id ? String(risk.AM_Location.Id) : NO_LOOKUP_VALUE
    );
    const [serialNumber, setSerialNumber] = React.useState(risk?.AM_SerialNumber || '');
    const [status, setStatus] = React.useState(
      typeof risk?.AM_Status === 'string'
        ? risk.AM_Status
        : lookupTitle(risk?.AM_Status as { Id: number; Title: string }) || 'Available'
    );
    const [notes, setNotes] = React.useState(risk?.AM_Notes || '');

    const resolvedStatusOptions =
      statusOptions.length > 0
        ? statusOptions
        : ['Available', 'Assigned', 'In Repair', 'Retired', 'Disposed'];

    React.useEffect(() => {
      setTitle(risk?.Title || '');
      setAssetId(risk?.AM_AssetId || '');
      setCategoryId(risk?.AM_Category?.Id ? String(risk.AM_Category.Id) : NO_LOOKUP_VALUE);
      setAssetTypeId(risk?.AM_AssetType?.Id ? String(risk.AM_AssetType.Id) : NO_LOOKUP_VALUE);
      setVendorId(risk?.AM_Vendor?.Id ? String(risk.AM_Vendor.Id) : NO_LOOKUP_VALUE);
      setLocationId(risk?.AM_Location?.Id ? String(risk.AM_Location.Id) : NO_LOOKUP_VALUE);
      setSerialNumber(risk?.AM_SerialNumber || '');
      setStatus(
        typeof risk?.AM_Status === 'string'
          ? risk.AM_Status
          : lookupTitle(risk?.AM_Status as { Id: number; Title: string }) || 'Available'
      );
      setNotes(risk?.AM_Notes || '');
      setError('');
    }, [risk]);

    React.useImperativeHandle(ref, () => ({
      submit: async () => {
        if (readOnly || !onSubmit) return false;

        const validationError = validateAssetForm({ title, status }, resolvedStatusOptions);
        if (validationError) {
          setError(validationError);
          return false;
        }

        setError('');
        await onSubmit({
          Title: title.trim(),
          AM_AssetId: assetId.trim(),
          AM_Status: status,
          AM_CategoryId: categoryId !== NO_LOOKUP_VALUE ? parseInt(categoryId, 10) : undefined,
          AM_AssetTypeId: assetTypeId !== NO_LOOKUP_VALUE ? parseInt(assetTypeId, 10) : undefined,
          AM_VendorId: vendorId !== NO_LOOKUP_VALUE ? parseInt(vendorId, 10) : null,
          AM_LocationId: locationId !== NO_LOOKUP_VALUE ? parseInt(locationId, 10) : null,
          AM_SerialNumber: serialNumber.trim(),
          AM_Notes: notes
        });
        return true;
      }
    }));

    const readonlyValue = (value?: string): React.ReactNode =>
      value ? (
        <Text className={styles.readonlyValue}>{value}</Text>
      ) : (
        <Text className={styles.readonlyEmpty}>—</Text>
      );

    const lookupTitleById = (items: ILookupItem[], id: string): string =>
      id === NO_LOOKUP_VALUE ? '' : items.find((item) => String(item.Id) === id)?.Title || '';

    if (readOnly) {
      return (
        <div id="dynamic-asset-form" className={mergeClasses(styles.form, styles.formWide)}>
          <div className={styles.grid}>
            <Field label="Asset name" className={styles.fullWidth}>
              {readonlyValue(title)}
            </Field>
            <Field label="Asset ID">{readonlyValue(assetId)}</Field>
            <Field label="Serial number">{readonlyValue(serialNumber)}</Field>
            <Field label="Category">{readonlyValue(lookupTitleById(categories, categoryId))}</Field>
            <Field label="Asset type">{readonlyValue(lookupTitleById(assetTypes, assetTypeId))}</Field>
            <Field label="Vendor">{readonlyValue(lookupTitleById(vendors, vendorId))}</Field>
            <Field label="Location">{readonlyValue(lookupTitleById(locations, locationId))}</Field>
            <Field label="Status">{readonlyValue(status)}</Field>
            <Field label="Notes" className={styles.fullWidth}>
              {readonlyValue(notes)}
            </Field>
          </div>
        </div>
      );
    }

    return (
      <form
        id="dynamic-asset-form"
        className={mergeClasses(styles.form, styles.formWide)}
        onSubmit={(event) => event.preventDefault()}
      >
        <PageNotifications error={error || undefined} />

        <div className={styles.grid}>
          <Field label="Asset name" required className={styles.fullWidth}>
            <Input value={title} onChange={(_, d) => setTitle(d.value)} placeholder="e.g. Dell Latitude 7440" />
          </Field>

          <Field label="Asset ID" hint="Leave blank to auto-generate.">
            <Input value={assetId} onChange={(_, d) => setAssetId(d.value)} />
          </Field>
          <Field label="Serial number">
            <Input value={serialNumber} onChange={(_, d) => setSerialNumber(d.value)} />
          </Field>

          <Field label="Category">
            <AppDropdown
              placeholder="Select a category"
              value={lookupTitleById(categories, categoryId)}
              selectedOptions={[categoryId]}
              onOptionSelect={(_, d) => setCategoryId(d.optionValue || NO_LOOKUP_VALUE)}
            >
              <Option value={NO_LOOKUP_VALUE}>None</Option>
              {categories.map((item) => (
                <Option key={item.Id} value={String(item.Id)}>
                  {item.Title}
                </Option>
              ))}
            </AppDropdown>
          </Field>
          <Field label="Asset type">
            <AppDropdown
              placeholder="Select an asset type"
              value={lookupTitleById(assetTypes, assetTypeId)}
              selectedOptions={[assetTypeId]}
              onOptionSelect={(_, d) => setAssetTypeId(d.optionValue || NO_LOOKUP_VALUE)}
            >
              <Option value={NO_LOOKUP_VALUE}>None</Option>
              {assetTypes.map((item) => (
                <Option key={item.Id} value={String(item.Id)}>
                  {item.Title}
                </Option>
              ))}
            </AppDropdown>
          </Field>

          <Field label="Vendor">
            <AppDropdown
              placeholder="Select a vendor"
              value={lookupTitleById(vendors, vendorId)}
              selectedOptions={[vendorId]}
              onOptionSelect={(_, d) => setVendorId(d.optionValue || NO_LOOKUP_VALUE)}
            >
              <Option value={NO_LOOKUP_VALUE}>None</Option>
              {vendors.map((item) => (
                <Option key={item.Id} value={String(item.Id)}>
                  {item.Title}
                </Option>
              ))}
            </AppDropdown>
          </Field>
          <Field label="Location">
            <AppDropdown
              placeholder="Select a location"
              value={lookupTitleById(locations, locationId)}
              selectedOptions={[locationId]}
              onOptionSelect={(_, d) => setLocationId(d.optionValue || NO_LOOKUP_VALUE)}
            >
              <Option value={NO_LOOKUP_VALUE}>None</Option>
              {locations.map((item) => (
                <Option key={item.Id} value={String(item.Id)}>
                  {item.Title}
                </Option>
              ))}
            </AppDropdown>
          </Field>

          <Field label="Status" required>
            <AppDropdown
              selectedOptions={[status]}
              value={status}
              onOptionSelect={(_, d) => setStatus(d.optionValue || 'Available')}
            >
              {resolvedStatusOptions.map((opt) => (
                <Option key={opt} value={opt}>
                  {opt}
                </Option>
              ))}
            </AppDropdown>
          </Field>

          <Field label="Notes" className={styles.fullWidth}>
            <Textarea value={notes} onChange={(_, d) => setNotes(d.value)} rows={4} resize="vertical" />
          </Field>
        </div>
      </form>
    );
  }
);

AssetForm.displayName = 'AssetForm';
