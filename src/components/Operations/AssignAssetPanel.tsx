import * as React from 'react';
import {
  Button,
  Field,
  Text,
  Textarea
} from '@fluentui/react-components';
import { PersonAddRegular, SaveRegular } from '@fluentui/react-icons';
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
import { buildAssetSelectOption } from '../../utils/assetSelectOptions';
import { useTranslation } from '../../i18n/LocaleContext';
import { PageNotifications } from '../Layout/PageNotifications';


export interface IAssignAssetPanelProps {
  assets: IAsset[];
  assetService: AssetService;
  assignmentService: AssignmentService;
  onComplete: () => void;
}

function isAvailableAsset(asset: IAsset): boolean {
  if (asset.AM_IsDeleted) {
    return false;
  }
  const status = typeof asset.AM_Status === 'string' ? asset.AM_Status : asset.AM_Status?.Title;
  return status === 'Available' && !asset.AM_AssignedTo;
}

export const AssignAssetPanel: React.FC<IAssignAssetPanelProps> = ({
  assets,
  assetService,
  assignmentService,
  onComplete
}) => {
  const styles = useFormStyles();
  const { t } = useTranslation();
  const availableAssets = React.useMemo(() => assets.filter(isAvailableAsset), [assets]);
  const [assetId, setAssetId] = React.useState('');
  const [assignees, setAssignees] = React.useState<IPersonPickerItem[]>([]);
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!assetId && availableAssets.length > 0) {
      setAssetId(String(availableAssets[0].Id));
    }
  }, [availableAssets, assetId]);

  const handleSubmit = async (): Promise<void> => {
    const parsedAssetId = Number(assetId);
    const assignee = assignees[0];
    if (!parsedAssetId || !assignee) {
      setError('Select an asset and assignee.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await assignmentService.assignAsset({
        assetId: parsedAssetId,
        assigneeUserId: assignee.id,
        notes: notes.trim() || undefined
      });
      setNotes('');
      setAssignees([]);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assignment failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ContentCard>
      <PageNotifications error={error || undefined} />

      {availableAssets.length === 0 ? (
        <EmptyState
          bordered
          icon={<PersonAddRegular />}
          title={t('operationsEmpty', 'noAvailableAssetsTitle', 'No available assets')}
          description={t(
            'operationsEmpty',
            'noAvailableAssetsDescription',
            'Add assets to the register or mark items as Available before assigning.'
          )}
        />
      ) : (
        <div className={styles.form}>
          <div className={styles.intro}>
            <Text>Assign an available asset to a person. The asset status changes to Assigned.</Text>
          </div>

          <Field label="Asset" required>
            <AppDropdown
              searchable
              searchPlaceholder="Search assets…"
              selectedOptions={assetId ? [assetId] : []}
              onOptionSelect={(_, data) => setAssetId(data.optionValue || '')}
            >
              {availableAssets.map((asset) => {
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
            label="Assign to"
            required
            multi={false}
            value={assignees}
            onChange={setAssignees}
            onSearch={(query) => assetService.searchPeople(query)}
            onResolve={(key) => assetService.resolvePerson(key)}
          />

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
              {saving ? 'Assigning…' : 'Assign asset'}
            </Button>
          </div>
        </div>
      )}
    </ContentCard>
  );
};
