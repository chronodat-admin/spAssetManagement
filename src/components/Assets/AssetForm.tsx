import * as React from 'react';
import {
  Field,
  Input,
  Textarea,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { parseFormSettings } from '../../lib/form-config/storage';
import { IAsset } from '../../models/IAssetApp';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { Option } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  }
});

export type AssetFormTab = 'details';

export interface IAssetFormHandle {
  submit: () => Promise<boolean>;
}

export interface IAssetFormProps {
  risk?: IAsset;
  readOnly?: boolean;
  formConfig?: ReturnType<typeof parseFormSettings>;
  statusOptions?: string[];
  onSubmit?: (payload: Partial<IAsset>) => Promise<void>;
}

export const AssetForm = React.forwardRef<IAssetFormHandle, IAssetFormProps>(
  ({ risk, readOnly, statusOptions = [], onSubmit }, ref) => {
    const styles = useStyles();
    const [title, setTitle] = React.useState(risk?.Title || '');
    const [assetId, setAssetId] = React.useState(risk?.AM_AssetId || '');
    const [status, setStatus] = React.useState(
      typeof risk?.AM_Status === 'string' ? risk.AM_Status : risk?.AM_Status?.Title || 'Available'
    );
    const [notes, setNotes] = React.useState(risk?.AM_Notes || '');

    React.useEffect(() => {
      setTitle(risk?.Title || '');
      setAssetId(risk?.AM_AssetId || '');
      setStatus(
        typeof risk?.AM_Status === 'string' ? risk.AM_Status : risk?.AM_Status?.Title || 'Available'
      );
      setNotes(risk?.AM_Notes || '');
    }, [risk]);

    React.useImperativeHandle(ref, () => ({
      submit: async () => {
        if (readOnly || !onSubmit) return false;
        if (!title.trim()) return false;
        await onSubmit({
          Title: title.trim(),
          AM_AssetId: assetId.trim(),
          AM_Status: status,
          AM_Notes: notes
        });
        return true;
      }
    }));

    return (
      <div className={styles.root}>
        <Field label="Asset name" required>
          <Input value={title} onChange={(_, d) => setTitle(d.value)} readOnly={readOnly} />
        </Field>
        <Field label="Asset ID">
          <Input value={assetId} onChange={(_, d) => setAssetId(d.value)} readOnly={readOnly} />
        </Field>
        <Field label="Status">
          <AppDropdown
            selectedOptions={[status]}
            onOptionSelect={(_, d) => setStatus(d.optionValue || 'Available')}
            disabled={readOnly}
          >
            {(statusOptions.length ? statusOptions : ['Available', 'Assigned', 'In Repair', 'Retired', 'Disposed']).map(
              (opt) => (
                <Option key={opt} value={opt}>
                  {opt}
                </Option>
              )
            )}
          </AppDropdown>
        </Field>
        <Field label="Notes">
          <Textarea value={notes} onChange={(_, d) => setNotes(d.value)} readOnly={readOnly} rows={4} />
        </Field>
      </div>
    );
  }
);

AssetForm.displayName = 'AssetForm';
