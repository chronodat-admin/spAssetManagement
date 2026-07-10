import * as React from 'react';
import {
  Button,
  Spinner
} from '@fluentui/react-components';
import { AddRegular, DeleteRegular, EditRegular } from '@fluentui/react-icons';
import { ListFormPanel } from '../Forms/ListFormPanel';
import { ContentCard } from '../Layout/ContentCard';
import { ContentToolbar } from '../Layout/ContentToolbar';
import { DataListView, IDataListColumn, IDataListSelection } from '../ListView/DataListView';
import { ListFiltersBar } from '../ListView/ListFiltersBar';
import { ListViewControls } from '../ListView/ListViewControls';
import { IAppSettings, ILookupItem } from '../../models/IAssetApp';
import type { EntityKey } from '../../lib/form-config/types';
import { AssetService } from '../../services/AssetService';
import type { ListColumnMeta } from '../../lib/list-view/types';
import { useListViewPreferences } from '../../lib/list-view/useListViewPreferences';
import {
  applyLookupListFilters,
  EMPTY_LOOKUP_LIST_FILTERS,
  hasActiveLookupListFilters
} from '../../utils/lookupListFilters';
import { SettingsPageHeader } from '../Settings/SettingsPageHeader';
import { useListPermissions } from '../../hooks/useListPermissions';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { useLookupDeleteConfirm } from '../../hooks/useLookupDeleteConfirm';
import type { ListPanelMode } from '../../utils/listPermissions';import { AppMessageBar } from '../Layout/AppMessageBar';


type PanelMode = ListPanelMode;

function buildLookupColumns(showRating?: boolean): {
  meta: ListColumnMeta[];
  columns: IDataListColumn<ILookupItem>[];
} {
  const meta: ListColumnMeta[] = [{ key: 'title', label: 'Title', defaultVisible: true, locked: true }];
  const columns: IDataListColumn<ILookupItem>[] = [
    {
      key: 'title',
      label: 'Title',
      isPrimary: true,
      render: (item) => item.Title
    }
  ];

  if (showRating) {
    meta.push({ key: 'rating', label: 'Rating', defaultVisible: true });
    columns.push({
      key: 'rating',
      label: 'Rating',
      render: (item) => item.Rating || '—'
    });
  }

  return { meta, columns };
}

export interface ILookupListManagerProps {
  listTitle: string;
  displayTitle: string;
  showRating?: boolean;
  ratingReadOnlyTitle?: boolean;
  riskService: AssetService;
  settings?: IAppSettings;
  formEntity?: EntityKey;
  pageTitle?: string;
  pageDescription?: string;
  pageIcon?: React.ElementType;
  onChanged?: () => void;
}

export const LookupListManager: React.FC<ILookupListManagerProps> = ({
  listTitle,
  displayTitle,
  showRating,
  ratingReadOnlyTitle,
  riskService,
  settings,
  formEntity = 'lookups',
  pageTitle,
  pageDescription,
  pageIcon,
  onChanged
}) => {
  const [items, setItems] = React.useState<ILookupItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [panelMode, setPanelMode] = React.useState<PanelMode>('create');
  const [editingItem, setEditingItem] = React.useState<ILookupItem | undefined>();
  const { confirmLookupDelete, confirmDialog, checkingDelete } = useLookupDeleteConfirm(riskService);

  const { meta: columnMeta, columns } = React.useMemo(
    () => buildLookupColumns(showRating),
    [showRating]
  );
  const viewPrefs = useListViewPreferences(listTitle, columnMeta);
  const [filters, setFilters] = React.useState(EMPTY_LOOKUP_LIST_FILTERS);

  React.useEffect(() => {
    setFilters(EMPTY_LOOKUP_LIST_FILTERS);
  }, [listTitle]);

  const filteredItems = React.useMemo(
    () => applyLookupListFilters(items, filters, { includeRating: showRating }),
    [items, filters, showRating]
  );

  const includeFields = React.useMemo(() => {
    const fields = ['Title'];
    if (showRating) {
      fields.push('Rating');
    }
    return fields;
  }, [showRating]);

  const { permissions: listPermissions } = useListPermissions(riskService, listTitle);
  const canAdd = listPermissions.canAdd && !ratingReadOnlyTitle;
  const canEdit = listPermissions.canEdit;
  const canDelete = listPermissions.canDelete && !ratingReadOnlyTitle;
  const showRowActions = canEdit || canDelete;

  const getItemKey = React.useCallback((item: ILookupItem) => item.Id, []);
  const bulkSelection = useBulkSelection(filteredItems, getItemKey);
  const listSelection: IDataListSelection | undefined = canDelete
    ? {
        selectedKeys: bulkSelection.selectedKeys,
        allSelected: bulkSelection.allSelected,
        someSelected: bulkSelection.someSelected,
        onToggleItem: bulkSelection.toggleItem,
        onToggleAll: bulkSelection.toggleAll
      }
    : undefined;

  const singularTitle = displayTitle.replace(/s$/i, '');

  const loadItems = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await riskService.getLookupItems(listTitle);
      setItems(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items.');
    } finally {
      setLoading(false);
    }
  }, [listTitle, riskService]);

  React.useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const clearMessages = (): void => {
    setError('');
    setSuccess('');
  };

  const openCreatePanel = (): void => {
    clearMessages();
    setPanelMode('create');
    setEditingItem(undefined);
    setPanelOpen(true);
  };

  const openViewPanel = (item: ILookupItem): void => {
    clearMessages();
    setPanelMode('view');
    setEditingItem(item);
    setPanelOpen(true);
  };

  const openEditPanel = (item: ILookupItem): void => {
    clearMessages();
    setPanelMode('edit');
    setEditingItem(item);
    setPanelOpen(true);
  };

  const closePanel = (): void => {
    setPanelOpen(false);
    setEditingItem(undefined);
  };

  const handleDelete = async (item: ILookupItem): Promise<void> => {
    if (!canDelete) {
      return;
    }

    const confirmed = await confirmLookupDelete({
      listTitle,
      items: [{ id: item.Id, title: item.Title }],
      dialogTitle: 'Delete item'
    });
    if (!confirmed) {
      return;
    }

    clearMessages();
    setSaving(true);
    try {
      await riskService.deleteLookupItem(listTitle, item.Id);
      bulkSelection.clearSelection();
      setSuccess(`Deleted "${item.Title}".`);
      if (editingItem?.Id === item.Id) {
        closePanel();
      }
      await loadItems();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item.');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async (): Promise<void> => {
    if (!canDelete || bulkSelection.selectedCount === 0) {
      return;
    }

    const ids = Array.from(bulkSelection.selectedKeys).map((key) => Number(key));
    const selectedItems = items
      .filter((item) => ids.includes(item.Id))
      .map((item) => ({ id: item.Id, title: item.Title }));
    const confirmed = await confirmLookupDelete({
      listTitle,
      items: selectedItems,
      dialogTitle: 'Delete items'
    });
    if (!confirmed) {
      return;
    }

    clearMessages();
    setSaving(true);
    try {
      const result = await riskService.deleteLookupItems(listTitle, ids);
      bulkSelection.clearSelection();
      if (editingItem && ids.includes(editingItem.Id)) {
        closePanel();
      }
      await loadItems();

      if (result.failed.length === 0) {
        setSuccess(`Deleted ${result.deletedIds.length} item(s).`);
      } else {
        setError(
          `Deleted ${result.deletedIds.length} of ${ids.length} item(s). ${result.failed.length} could not be deleted.`
        );
      }
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete selected items.');
    } finally {
      setSaving(false);
    }
  };

  const renderActions = (item: ILookupItem): React.ReactNode => (
    <>
      {canEdit && (
        <Button appearance="subtle" icon={<EditRegular />} aria-label="Edit" onClick={() => openEditPanel(item)} />
      )}
      {canDelete && (
        <Button
          appearance="subtle"
          icon={<DeleteRegular />}
          aria-label="Delete"
          disabled={saving || checkingDelete}
          onClick={() => void handleDelete(item)}
        />
      )}
    </>
  );

  return (
    <>
      <ContentCard
        flushBody
        pageHeader={
          pageDescription || pageIcon ? (
            <SettingsPageHeader
              embedded
              title={pageTitle || displayTitle}
              description={pageDescription}
              icon={pageIcon}
              actions={
                canAdd ? (
                  <Button appearance="primary" icon={<AddRegular />} onClick={openCreatePanel}>
                    Add new
                  </Button>
                ) : undefined
              }
            />
          ) : undefined
        }
        toolbar={
          <ContentToolbar count={filteredItems.length} countLabel="items">
            {viewPrefs.ready && (
              <ListViewControls
                viewMode={viewPrefs.viewMode}
                onViewModeChange={viewPrefs.setViewMode}
                columns={columnMeta}
                visibleColumns={viewPrefs.visibleColumns}
                onToggleColumn={viewPrefs.toggleColumn}
                settingsOpen={viewPrefs.settingsOpen}
                onSettingsOpenChange={viewPrefs.setSettingsOpen}
              />
            )}
            {canDelete && bulkSelection.selectedCount > 0 && (
              <Button
                appearance="secondary"
                icon={<DeleteRegular />}
                disabled={saving || checkingDelete}
                onClick={() => void handleBulkDelete()}
              >
                Delete selected ({bulkSelection.selectedCount})
              </Button>
            )}
            {canAdd && !(pageDescription || pageIcon) && (
              <Button appearance="primary" icon={<AddRegular />} onClick={openCreatePanel}>
                Add new
              </Button>
            )}
          </ContentToolbar>
        }
        filtersBar={
          <ListFiltersBar
            searchValue={filters.search}
            onSearchChange={(search) => setFilters((current) => ({ ...current, search }))}
            searchPlaceholder={
              showRating
                ? 'Search by title or rating...'
                : 'Search by title...'
            }
            showClear={hasActiveLookupListFilters(filters)}
            onClear={() => setFilters(EMPTY_LOOKUP_LIST_FILTERS)}
          />
        }
      >
        {error && !panelOpen && (
          <div style={{ padding: '12px 16px 0' }}>
            <AppMessageBar intent="error">{error}</AppMessageBar>
          </div>
        )}
        {success && (
          <div style={{ padding: '12px 16px 0' }}>
            <AppMessageBar intent="success">{success}</AppMessageBar>
          </div>
        )}

        {loading ? (
          <div style={{ padding: 24 }}>
            <Spinner label="Loading..." />
          </div>
        ) : (
          viewPrefs.ready && (
            <DataListView
              items={filteredItems}
              columns={columns}
              visibleColumns={viewPrefs.visibleColumns}
              viewMode={viewPrefs.viewMode}
              ariaLabel={displayTitle}
              emptyMessage={`No items yet. ${canAdd ? 'Click Add new to create one.' : 'Edit ratings as needed.'}`}
              getItemKey={getItemKey}
              renderActions={showRowActions ? renderActions : undefined}
              onPrimaryClick={openViewPanel}
              selection={listSelection}
              getSelectionLabel={(item) => item.Title}
            />
          )
        )}
      </ContentCard>

      <ListFormPanel
        open={panelOpen}
        listTitle={listTitle}
        entity={formEntity}
        mode={panelMode}
        itemId={editingItem?.Id}
        title={
          panelMode === 'create'
            ? `Add ${singularTitle}`
            : panelMode === 'view'
              ? `View ${singularTitle}`
              : `Edit ${singularTitle}`
        }
        subtitle={editingItem?.Title}
        riskService={riskService}
        settings={settings}
        includeFields={includeFields}
        disabledFields={ratingReadOnlyTitle && panelMode === 'edit' ? ['Title'] : undefined}
        onClose={closePanel}
        onEdit={panelMode === 'view' ? () => setPanelMode('edit') : undefined}
        onSaved={async () => {
          closePanel();
          setSuccess(panelMode === 'create' ? 'Item created.' : 'Item updated.');
          onChanged?.();
          await loadItems();
        }}
      />
      {confirmDialog}
    </>
  );
};
