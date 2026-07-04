import * as React from 'react';
import {
  Button,
  Field,
  MessageBar,
  MessageBarBody,
  Textarea,
  tokens
} from '@fluentui/react-components';
import { ArrowUndoRegular } from '@fluentui/react-icons';
import { ContentCard } from '../Layout/ContentCard';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { Option } from '@fluentui/react-components';
import { IAsset } from '../../models/IAssetApp';
import { AssignmentService } from '../../services/AssignmentService';
import { isReturnableAsset } from '../../utils/assignmentUtils';

export interface IReturnAssetPanelProps {
  assets: IAsset[];
  assignmentService: AssignmentService;
  onComplete: () => void;
}

export const ReturnAssetPanel: React.FC<IReturnAssetPanelProps> = ({
  assets,
  assignmentService,
  onComplete
}) => {
  const returnable = React.useMemo(() => assets.filter(isReturnableAsset), [assets]);
  const [assetId, setAssetId] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!assetId && returnable.length > 0) {
      setAssetId(String(returnable[0].Id));
    }
  }, [returnable, assetId]);

  const handleSubmit = async (): Promise<void> => {
    const parsedId = Number(assetId);
    if (!parsedId) {
      setError('Select an asset to return.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await assignmentService.returnAsset({ assetId: parsedId, notes: notes.trim() || undefined });
      setNotes('');
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Return failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ContentCard>
      {error ? (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      ) : null}
      {returnable.length === 0 ? (
        <MessageBar intent="info">
          <MessageBarBody>No assigned assets are available to return.</MessageBarBody>
        </MessageBar>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM, maxWidth: 560 }}>
          <Field label="Assigned asset" required>
            <AppDropdown
              selectedOptions={assetId ? [assetId] : []}
              onOptionSelect={(_, data) => setAssetId(data.optionValue || '')}
            >
              {returnable.map((asset) => (
                <Option
                  key={asset.Id}
                  value={String(asset.Id)}
                  text={`${asset.AM_AssetId || asset.Id} — ${asset.Title}${
                    asset.AM_AssignedTo ? ` (${asset.AM_AssignedTo.Title})` : ''
                  }`}
                >
                  {asset.AM_AssetId || asset.Id} — {asset.Title}
                  {asset.AM_AssignedTo ? ` (${asset.AM_AssignedTo.Title})` : ''}
                </Option>
              ))}
            </AppDropdown>
          </Field>
          <Field label="Notes">
            <Textarea value={notes} onChange={(_, data) => setNotes(data.value)} rows={3} />
          </Field>
          <Button
            appearance="primary"
            icon={<ArrowUndoRegular />}
            disabled={saving || !assetId}
            onClick={() => void handleSubmit()}
          >
            {saving ? 'Returning…' : 'Return asset'}
          </Button>
        </div>
      )}
    </ContentCard>
  );
};
