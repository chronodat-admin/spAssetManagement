import * as React from 'react';
import {
  Button,
  Field,
  Textarea
} from '@fluentui/react-components';
import { SaveRegular, ArrowUndoRegular } from '@fluentui/react-icons';
import { ContentCard } from '../Layout/ContentCard';
import { EmptyState } from '../Layout/EmptyState';
import { useFormStyles } from '../Forms/formStyles';
import { SearchableCheckboxList } from '../Dropdown/SearchableCheckboxList';
import { IAsset } from '../../models/IAssetApp';
import { AssignmentService } from '../../services/AssignmentService';
import { useTranslation } from '../../i18n/LocaleContext';
import { buildAssetCheckboxItem } from '../../utils/assetSelectOptions';
import { PageNotifications } from '../Layout/PageNotifications';


export interface IBulkReturnPanelProps {
  assets: IAsset[];
  assignmentService: AssignmentService;
  onComplete: () => void;
}

function isAssignedAsset(asset: IAsset): boolean {
  if (asset.AM_IsDeleted) return false;
  const status = typeof asset.AM_Status === 'string' ? asset.AM_Status : asset.AM_Status?.Title;
  return status === 'Assigned' || Boolean(asset.AM_AssignedTo);
}

export const BulkReturnPanel: React.FC<IBulkReturnPanelProps> = ({
  assets,
  assignmentService,
  onComplete
}) => {
  const styles = useFormStyles();
  const { t } = useTranslation();
  const assignedAssets = React.useMemo(() => assets.filter(isAssignedAsset), [assets]);
  const assetListItems = React.useMemo(
    () => assignedAssets.map((asset) => buildAssetCheckboxItem(asset, { includeAssignee: true })),
    [assignedAssets]
  );
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
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
    if (selectedIds.size === 0) {
      setError('Select at least one asset.');
      return;
    }
    setSaving(true);
    setError('');
    setResult('');
    try {
      const summary = await assignmentService.bulkReturnAssets(
        Array.from(selectedIds),
        notes.trim() || undefined
      );
      setResult(`Returned ${summary.success} asset(s). ${summary.failed ? `${summary.failed} failed.` : ''}`);
      setSelectedIds(new Set());
      setNotes('');
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk return failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ContentCard>
      <PageNotifications error={error || undefined} success={result || undefined} />
      {assignedAssets.length === 0 ? (
        <EmptyState
          bordered
          icon={<ArrowUndoRegular />}
          title={t('operationsEmpty', 'noAssignedAssetsTitle', 'No assigned assets')}
          description={t(
            'operationsEmpty',
            'noAssignedAssetsDescription',
            'Assigned assets will appear here when you are ready to process a return.'
          )}
        />
      ) : (
        <>
      <Field label={t('operations', 'selectAssets', 'Select assets')} className={styles.fullWidth}>
        <SearchableCheckboxList
          items={assetListItems}
          selectedIds={selectedIds}
          onToggle={toggleAsset}
          onSelectionChange={setSelectedIds}
          searchPlaceholder={t('operations', 'searchAssets', 'Search assets…')}
          emptyMessage={t('operations', 'noAssignedAssets', 'No assigned assets.')}
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
        {t('operations', 'returnSelected', 'Return selected')} ({selectedIds.size})
      </Button>
        </>
      )}
    </ContentCard>
  );
};
