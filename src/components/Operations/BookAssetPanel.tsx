import * as React from 'react';
import {
  Button,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Textarea,
  tokens
} from '@fluentui/react-components';
import { SaveRegular } from '@fluentui/react-icons';
import { ContentCard } from '../Layout/ContentCard';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { Option } from '@fluentui/react-components';
import { PeoplePickerField } from '../PeoplePicker/PeoplePickerField';
import { IAsset } from '../../models/IAssetApp';
import { IPersonPickerItem } from '../../models/IPersonPickerItem';
import { AssetService } from '../../services/AssetService';
import { AssignmentService } from '../../services/AssignmentService';
import { isBookableAsset } from '../../utils/assignmentUtils';

export interface IBookAssetPanelProps {
  assets: IAsset[];
  assetService: AssetService;
  assignmentService: AssignmentService;
  onComplete: () => void;
}

export const BookAssetPanel: React.FC<IBookAssetPanelProps> = ({
  assets,
  assetService,
  assignmentService,
  onComplete
}) => {
  const bookableAssets = React.useMemo(() => assets.filter(isBookableAsset), [assets]);
  const [assetId, setAssetId] = React.useState('');
  const [assignees, setAssignees] = React.useState<IPersonPickerItem[]>([]);
  const [expectedReturnDate, setExpectedReturnDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!assetId && bookableAssets.length > 0) {
      setAssetId(String(bookableAssets[0].Id));
    }
  }, [bookableAssets, assetId]);

  const handleSubmit = async (): Promise<void> => {
    const parsedAssetId = Number(assetId);
    const assignee = assignees[0];
    if (!parsedAssetId || !assignee) {
      setError('Select an asset and requester.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await assignmentService.bookAsset({
        assetId: parsedAssetId,
        assigneeUserId: assignee.id,
        expectedReturnDate: expectedReturnDate || undefined,
        notes: notes.trim() || undefined
      });
      setNotes('');
      setAssignees([]);
      setExpectedReturnDate('');
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed.');
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

      {bookableAssets.length === 0 ? (
        <MessageBar intent="info">
          <MessageBarBody>No assets available to book.</MessageBarBody>
        </MessageBar>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM, maxWidth: 560 }}>
          <Field label="Asset" required>
            <AppDropdown
              selectedOptions={assetId ? [assetId] : []}
              onOptionSelect={(_, data) => setAssetId(data.optionValue || '')}
            >
              {bookableAssets.map((asset) => (
                <Option key={asset.Id} value={String(asset.Id)} text={`${asset.AM_AssetId || asset.Id} — ${asset.Title}`}>
                  {asset.AM_AssetId || asset.Id} — {asset.Title}
                </Option>
              ))}
            </AppDropdown>
          </Field>

          <PeoplePickerField
            label="Book for"
            required
            multi={false}
            value={assignees}
            onChange={setAssignees}
            onSearch={(query) => assetService.searchPeople(query)}
            onResolve={(key) => assetService.resolvePerson(key)}
          />

          <Field label="Expected return date">
            <Input
              type="date"
              value={expectedReturnDate}
              onChange={(_, data) => setExpectedReturnDate(data.value)}
            />
          </Field>

          <Field label="Notes">
            <Textarea value={notes} onChange={(_, data) => setNotes(data.value)} rows={3} />
          </Field>

          <div>
            <Button
              appearance="primary"
              icon={<SaveRegular />}
              disabled={saving || !assetId || assignees.length === 0}
              onClick={() => void handleSubmit()}
            >
              {saving ? 'Booking…' : 'Book asset'}
            </Button>
          </div>
        </div>
      )}
    </ContentCard>
  );
};
