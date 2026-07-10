import * as React from 'react';
import { Button, Spinner } from '@fluentui/react-components';
import { ArrowDownloadRegular, DeleteRegular, EditRegular, BarcodeScannerRegular } from '@fluentui/react-icons';
import { ContentCard } from '../Layout/ContentCard';
import { ContentToolbar } from '../Layout/ContentToolbar';
import { DataListView, IDataListColumn, IDataListSelection } from '../ListView/DataListView';
import { ListFiltersBar } from '../ListView/ListFiltersBar';
import { ListViewControls } from '../ListView/ListViewControls';
import { IAppSettings, IAsset } from '../../models/IAssetApp';
import { parseWorkflowSettings } from '../../lib/workflow-settings/storage';
import { parseAppearanceSettings } from '../../lib/appearance-settings/storage';
import { AssetService } from '../../services/AssetService';
import { exportAssetsToCsv } from '../../utils/assetExport';
import { RiskStatusBadge } from './AssetColoredBadges';
import {
  applyAssetListFilters,
  EMPTY_ASSET_LIST_FILTERS,
  getAssetStatusFilterOptions,
  hasActiveAssetListFilters,
  IAssetListFilters
} from '../../utils/assetListFilters';
import type { ListColumnMeta } from '../../lib/list-view/types';
import { useListViewPreferences } from '../../lib/list-view/useListViewPreferences';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { UserCell } from '../PeoplePicker/UserAvatar';
import { AssetImageThumbnail } from './AssetImageThumbnail';
import { BarcodeLabelDialog } from './BarcodeLabelDialog';
import { useTranslation } from '../../i18n/LocaleContext';
import { PageNotifications } from '../Layout/PageNotifications';


const BASE_ASSET_COLUMNS: ListColumnMeta[] = [
  { key: 'assetId', label: 'Asset ID', defaultVisible: true, locked: true },
  { key: 'title', label: 'Title', defaultVisible: true, locked: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'category', label: 'Category', defaultVisible: true },
  { key: 'location', label: 'Location', defaultVisible: true },
  { key: 'assignee', label: 'Assigned To', defaultVisible: true },
  { key: 'serial', label: 'Serial Number', defaultVisible: false },
  { key: 'cost', label: 'Cost', defaultVisible: false }
];

function buildAssetColumnMeta(showImageColumn: boolean): ListColumnMeta[] {
  if (!showImageColumn) {
    return BASE_ASSET_COLUMNS;
  }
  return [{ key: 'image', label: 'Image', defaultVisible: true }, ...BASE_ASSET_COLUMNS];
}

function buildAssetColumns(
  showImageColumn: boolean,
  settings?: IAppSettings,
  webOrigin?: string
): IDataListColumn<IAsset>[] {
  const workflowSettings = parseWorkflowSettings(settings);
  const columns: IDataListColumn<IAsset>[] = [];

  if (showImageColumn) {
    columns.push({
      key: 'image',
      label: 'Image',
      render: (asset) => (
        <AssetImageThumbnail
          imageUrl={asset.AM_ImageUrl}
          alt={asset.Title ? `${asset.Title} image` : 'Asset image'}
          webOrigin={webOrigin}
        />
      )
    });
  }

  columns.push(
    { key: 'assetId', label: 'Asset ID', render: (asset) => asset.AM_AssetId || '—' },
    {
      key: 'title',
      label: 'Title',
      isPrimary: true,
      render: (asset) => asset.Title || '—'
    },
    {
      key: 'status',
      label: 'Status',
      render: (asset) => (
        <RiskStatusBadge
          status={
            typeof asset.AM_Status === 'string'
              ? asset.AM_Status
              : asset.AM_Status?.Title || asset.Riskstatus
          }
          workflowSettings={workflowSettings}
        />
      )
    },
    { key: 'category', label: 'Category', render: (asset) => asset.AM_Category?.Title || '—' },
    { key: 'location', label: 'Location', render: (asset) => asset.AM_Location?.Title || '—' },
    {
      key: 'assignee',
      label: 'Assigned To',
      render: (asset) => {
        const assignee = asset.AM_AssignedTo || asset.AssignedTo?.[0];
        return assignee ? (
          <UserCell name={assignee.Title} email={assignee.Email} />
        ) : (
          '—'
        );
      }
    },
    { key: 'serial', label: 'Serial Number', render: (asset) => asset.AM_SerialNumber || '—' },
    {
      key: 'cost',
      label: 'Cost',
      render: (asset) => (asset.AM_Cost != null ? `$${asset.AM_Cost.toLocaleString()}` : '—')
    }
  );

  return columns;
}

export interface IAssetListProps {
  risks: IAsset[];
  title: string;
  subtitle?: string;
  listKey?: string;
  settings?: IAppSettings;
  riskService: AssetService;
  onView: (asset: IAsset) => void;
  onEdit: (asset: IAsset) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canRunBulkOps?: boolean;
  onRefresh: () => void;
}

export const AssetList: React.FC<IAssetListProps> = ({
  risks,
  title,
  subtitle,
  listKey = 'assets',
  settings,
  riskService,
  onView,
  onEdit,
  canEdit = false,
  canDelete = false,
  canRunBulkOps = false,
  onRefresh
}) => {
  const { t } = useTranslation();
  const webOrigin = React.useMemo(() => {
    try {
      return new URL(riskService.getSiteWebUrl()).origin;
    } catch {
      return undefined;
    }
  }, [riskService]);
  const appearanceSettings = React.useMemo(() => parseAppearanceSettings(settings), [settings]);
  const showImageColumn = appearanceSettings.showAssetImageColumn;
  const assetColumnMeta = React.useMemo(
    () => buildAssetColumnMeta(showImageColumn),
    [showImageColumn]
  );
  const columns = React.useMemo(
    () => buildAssetColumns(showImageColumn, settings, webOrigin),
    [showImageColumn, settings, webOrigin]
  );
  const viewPrefs = useListViewPreferences(listKey, assetColumnMeta);
  const [localFilters, setLocalFilters] = React.useState<IAssetListFilters>(EMPTY_ASSET_LIST_FILTERS);
  const [deletingId, setDeletingId] = React.useState<number | undefined>();
  const [error, setError] = React.useState('');
  const workflowSettings = React.useMemo(() => parseWorkflowSettings(settings), [settings]);

  const getAssetKey = React.useCallback((asset: IAsset) => asset.Id, []);

  const filteredAssets = React.useMemo(
    () => applyAssetListFilters(risks, localFilters),
    [risks, localFilters]
  );

  const bulkSelection = useBulkSelection(filteredAssets, getAssetKey);
  const { confirm, confirmDialog } = useConfirmDialog();
  const [labelDialogOpen, setLabelDialogOpen] = React.useState(false);

  const selectedAssets = React.useMemo(
    () => filteredAssets.filter((asset) => bulkSelection.selectedKeys.has(asset.Id)),
    [bulkSelection.selectedKeys, filteredAssets]
  );

  const listSelection: IDataListSelection | undefined =
    canDelete || canRunBulkOps
    ? {
        selectedKeys: bulkSelection.selectedKeys,
        allSelected: bulkSelection.allSelected,
        someSelected: bulkSelection.someSelected,
        onToggleItem: bulkSelection.toggleItem,
        onToggleAll: bulkSelection.toggleAll
      }
    : undefined;

  const statusOptions = React.useMemo(
    () => getAssetStatusFilterOptions(risks, workflowSettings),
    [risks, workflowSettings]
  );

  const handleDelete = async (asset: IAsset): Promise<void> => {
    const ok = await confirm({
      title: 'Delete asset',
      message: `Soft-delete "${asset.Title}"?`
    });
    if (!ok) return;
    setDeletingId(asset.Id);
    try {
      await riskService.deleteRisk(asset.Id);
      bulkSelection.clearSelection();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(undefined);
    }
  };

  const handleBulkDelete = async (): Promise<void> => {
    if (!canDelete || bulkSelection.selectedCount === 0) return;
    const ok = await confirm({
      title: 'Delete selected assets',
      message: `Soft-delete ${bulkSelection.selectedCount} selected asset(s)?`
    });
    if (!ok) return;
    setDeletingId(-1);
    try {
      for (const id of bulkSelection.selectedKeys) {
        await riskService.deleteRisk(Number(id));
      }
      bulkSelection.clearSelection();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk delete failed');
    } finally {
      setDeletingId(undefined);
    }
  };

  const renderActions = (asset: IAsset): React.ReactNode => (
    <>
      {canEdit ? (
        <Button appearance="subtle" icon={<EditRegular />} aria-label="Edit" onClick={() => onEdit(asset)} />
      ) : null}
      {canDelete ? (
        <Button
          appearance="subtle"
          icon={<DeleteRegular />}
          aria-label="Delete"
          disabled={deletingId === asset.Id}
          onClick={() => void handleDelete(asset)}
        />
      ) : null}
      {deletingId === asset.Id ? <Spinner size="tiny" /> : null}
    </>
  );

  return (
    <>
      <ContentCard
        flushBody
        pageHeader={subtitle ? undefined : undefined}
        toolbar={
          <ContentToolbar count={filteredAssets.length} countLabel="assets">
            {viewPrefs.ready ? (
              <ListViewControls
                viewMode={viewPrefs.viewMode}
                onViewModeChange={viewPrefs.setViewMode}
                columns={assetColumnMeta}
                visibleColumns={viewPrefs.visibleColumns}
                onToggleColumn={viewPrefs.toggleColumn}
                settingsOpen={viewPrefs.settingsOpen}
                onSettingsOpenChange={viewPrefs.setSettingsOpen}
              />
            ) : null}
            <Button
              appearance="secondary"
              icon={<ArrowDownloadRegular />}
              disabled={filteredAssets.length === 0}
              onClick={() =>
                exportAssetsToCsv(
                  selectedAssets.length > 0 ? selectedAssets : filteredAssets,
                  selectedAssets.length > 0 ? 'assets-selected-export.csv' : 'assets-export.csv'
                )
              }
            >
              {selectedAssets.length > 0
                ? t('operations', 'exportSelected', 'Export selected')
                : t('operations', 'exportCsv', 'Export CSV')}
            </Button>
            {canRunBulkOps && bulkSelection.selectedCount > 0 ? (
              <Button appearance="secondary" icon={<BarcodeScannerRegular />} onClick={() => setLabelDialogOpen(true)}>
                {t('barcode', 'generate', 'Generate labels')}
              </Button>
            ) : null}
            {canDelete && bulkSelection.selectedCount > 0 ? (
              <Button appearance="secondary" icon={<DeleteRegular />} onClick={() => void handleBulkDelete()}>
                {t('operations', 'deleteSelected', 'Delete selected')} ({bulkSelection.selectedCount})
              </Button>
            ) : null}
          </ContentToolbar>
        }
        filtersBar={
          <ListFiltersBar
            searchValue={localFilters.search}
            onSearchChange={(search) => setLocalFilters((f) => ({ ...f, search }))}
            dropdowns={[
              {
                key: 'status',
                placeholder: 'Status',
                value: localFilters.status,
                options: [{ value: '', label: 'All statuses' }, ...statusOptions.map((s) => ({ value: s, label: s }))],
                onChange: (status) => setLocalFilters((f) => ({ ...f, status }))
              }
            ]}
            onClear={
              hasActiveAssetListFilters(localFilters)
                ? () => setLocalFilters(EMPTY_ASSET_LIST_FILTERS)
                : undefined
            }
          />
        }
      >
        <PageNotifications error={error || undefined} />
        <DataListView
          items={filteredAssets}
          columns={columns}
          visibleColumns={viewPrefs.visibleColumns}
          viewMode={viewPrefs.viewMode}
          ariaLabel={title}
          emptyMessage="No assets found"
          emptyDescription="Try adjusting your filters or add a new asset."
          getItemKey={getAssetKey}
          renderActions={canEdit || canDelete ? renderActions : undefined}
          onPrimaryClick={onView}
          selection={listSelection}
          getSelectionLabel={(asset) => asset.Title}
        />
      </ContentCard>
      <BarcodeLabelDialog
        open={labelDialogOpen}
        assets={selectedAssets}
        onClose={() => setLabelDialogOpen(false)}
      />
      {confirmDialog}
    </>
  );
};
