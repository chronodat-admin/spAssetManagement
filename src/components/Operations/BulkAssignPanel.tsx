import * as React from 'react';
import {
  Button,
  Field,
  Textarea
} from '@fluentui/react-components';
import { SaveRegular, PersonAddRegular } from '@fluentui/react-icons';
import { ContentCard } from '../Layout/ContentCard';
import { EmptyState } from '../Layout/EmptyState';
import { useFormStyles } from '../Forms/formStyles';
import { SearchableCheckboxList } from '../Dropdown/SearchableCheckboxList';
import { PeoplePickerField } from '../PeoplePicker/PeoplePickerField';
import { IAsset } from '../../models/IAssetApp';
import { IPersonPickerItem } from '../../models/IPersonPickerItem';
import { AssetService } from '../../services/AssetService';
import { AssignmentService } from '../../services/AssignmentService';
import { useTranslation } from '../../i18n/LocaleContext';
import { buildAssetCheckboxItem } from '../../utils/assetSelectOptions';
import { PageNotifications } from '../Layout/PageNotifications';


export interface IBulkAssignPanelProps {
  assets: IAsset[];
  assetService: AssetService;
  assignmentService: AssignmentService;
  onComplete: () => void;
}

function isAvailableAsset(asset: IAsset): boolean {
  if (asset.AM_IsDeleted) return false;
  const status = typeof asset.AM_Status === 'string' ? asset.AM_Status : asset.AM_Status?.Title;
  return status === 'Available' && !asset.AM_AssignedTo;
}

export const BulkAssignPanel: React.FC<IBulkAssignPanelProps> = ({
  assets,
  assetService,
  assignmentService,
  onComplete
}) => {
  const styles = useFormStyles();
  const { t } = useTranslation();
  const availableAssets = React.useMemo(() => assets.filter(isAvailableAsset), [assets]);
  const assetListItems = React.useMemo(
    () => availableAssets.map((asset) => buildAssetCheckboxItem(asset)),
    [availableAssets]
  );
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [assignees, setAssignees] = React.useState<IPersonPickerItem[]>([]);
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState('');

  const toggleAsset = (id: number, checked: boolean): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSubmit = async (): Promise<void> => {
    const assignee = assignees[0];
    if (!assignee || selectedIds.size === 0) {
      setError('Select at least one asset and an assignee.');
      return;
    }
    setSaving(true);
    setError('');
    setResult('');
    try {
      const inputs = Array.from(selectedIds).map((assetId) => ({
        assetId,
        assigneeUserId: assignee.id,
        notes: notes.trim() || undefined
      }));
      const summary = await assignmentService.bulkAssignAssets(inputs);
      setResult(`Assigned ${summary.success} asset(s). ${summary.failed ? `${summary.failed} failed.` : ''}`);
      setSelectedIds(new Set());
      setNotes('');
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk assign failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ContentCard>
      <PageNotifications error={error || undefined} success={result || undefined} />
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
        <>
      <Field label={t('operations', 'selectAssignee', 'Select assignee')} required>
        <PeoplePickerField
          multi={false}
          value={assignees}
          onChange={setAssignees}
          onSearch={(query) => assetService.searchPeople(query)}
          onResolve={(key) => assetService.resolvePerson(key)}
        />
      </Field>
      <Field label={t('operations', 'selectAssets', 'Select assets')} className={styles.fullWidth}>
        <SearchableCheckboxList
          items={assetListItems}
          selectedIds={selectedIds}
          onToggle={toggleAsset}
          onSelectionChange={setSelectedIds}
          searchPlaceholder={t('operations', 'searchAssets', 'Search assets…')}
          emptyMessage={t('operations', 'noAvailableAssets', 'No available assets.')}
          noResultsMessage={t('operations', 'noMatchingAssets', 'No matching assets.')}
          selectAllLabel={t('operations', 'selectAllShown', 'Select all shown')}
          clearLabel={t('operations', 'clearSelection', 'Clear selection')}
          disabled={saving}
        />
      </Field>
      <Field label={t('common', 'notes', 'Notes')} className={styles.fullWidth}>
        <Textarea value={notes} onChange={(_, d) => setNotes(d.value)} rows={3} />
      </Field>
      <Button appearance="primary" icon={<SaveRegular />} disabled={saving || selectedIds.size === 0} onClick={() => void handleSubmit()}>
        {t('operations', 'assignSelected', 'Assign selected')} ({selectedIds.size})
      </Button>
        </>
      )}
    </ContentCard>
  );
};
