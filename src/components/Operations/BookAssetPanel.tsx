import * as React from 'react';
import {
  Button,
  Field,
  Input,
  Text,
  Textarea
} from '@fluentui/react-components';
import { SaveRegular, CalendarRegular } from '@fluentui/react-icons';
import { ContentCard } from '../Layout/ContentCard';
import { EmptyState } from '../Layout/EmptyState';
import { useFormStyles } from '../Forms/formStyles';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { Option } from '@fluentui/react-components';
import { PeoplePickerField } from '../PeoplePicker/PeoplePickerField';
import { IAsset } from '../../models/IAssetApp';
import { IPersonPickerItem } from '../../models/IPersonPickerItem';
import { AssetService } from '../../services/AssetService';
import { AssignmentService } from '../../services/AssignmentService';
import { isBookableAsset } from '../../utils/assignmentUtils';
import { buildAssetSelectOption } from '../../utils/assetSelectOptions';
import { useTranslation } from '../../i18n/LocaleContext';
import { PageNotifications } from '../Layout/PageNotifications';


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
  const styles = useFormStyles();
  const { t } = useTranslation();
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
      <PageNotifications error={error || undefined} />

      {bookableAssets.length === 0 ? (
        <EmptyState
          bordered
          icon={<CalendarRegular />}
          title={t('operationsEmpty', 'noBookableAssetsTitle', 'No bookable assets')}
          description={t(
            'operationsEmpty',
            'noBookableAssetsDescription',
            'Available assets can be booked from the asset register.'
          )}
        />
      ) : (
        <div className={styles.form}>
          <div className={styles.intro}>
            <Text>Reserve an asset for a person with an optional expected return date.</Text>
          </div>

          <Field label="Asset" required>
            <AppDropdown
              searchable
              searchPlaceholder="Search assets…"
              selectedOptions={assetId ? [assetId] : []}
              onOptionSelect={(_, data) => setAssetId(data.optionValue || '')}
            >
              {bookableAssets.map((asset) => {
                const option = buildAssetSelectOption(asset);
                return (
                  <Option key={asset.Id} value={option.value} text={option.searchText}>
                    {option.label}
                  </Option>
                );
              })}
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

          <div className={styles.grid}>
            <Field label="Expected return date">
              <Input
                type="date"
                value={expectedReturnDate}
                onChange={(_, data) => setExpectedReturnDate(data.value)}
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea value={notes} onChange={(_, data) => setNotes(data.value)} rows={3} resize="vertical" />
          </Field>

          <div className={styles.actions}>
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
