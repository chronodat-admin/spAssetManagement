import * as React from 'react';
import {
  Button,
  Spinner
} from '@fluentui/react-components';
import { AddRegular, DeleteRegular, EditRegular } from '@fluentui/react-icons';
import { ListFormPanel } from '../Forms/ListFormPanel';
import { UserCell } from '../PeoplePicker/UserAvatar';
import { ContentCard } from '../Layout/ContentCard';
import { ContentToolbar } from '../Layout/ContentToolbar';
import { DataListView, IDataListColumn, IDataListSelection } from '../ListView/DataListView';
import { ListFiltersBar } from '../ListView/ListFiltersBar';
import { ListViewControls } from '../ListView/ListViewControls';
import { BUSINESS_LIST_TITLE } from '../../models/IListDefinitions';
import { IAppSettings, ILookupItem } from '../../models/IAssetApp';
import { AssetService } from '../../services/AssetService';
import type { ListColumnMeta } from '../../lib/list-view/types';
import { useListViewPreferences } from '../../lib/list-view/useListViewPreferences';
import {
  applyLookupListFilters,
  EMPTY_LOOKUP_LIST_FILTERS,
  hasActiveLookupListFilters
} from '../../utils/lookupListFilters';
import { useListPermissions } from '../../hooks/useListPermissions';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { useLookupDeleteConfirm } from '../../hooks/useLookupDeleteConfirm';
import type { ListPanelMode } from '../../utils/listPermissions';
import { AppMessageBar } from '../Layout/AppMessageBar';


type PanelMode = ListPanelMode;

const BUSINESS_COLUMNS: ListColumnMeta[] = [
  { key: 'title', label: 'Title', defaultVisible: true, locked: true },
  { key: 'industry', label: 'Industry', defaultVisible: true },
  { key: 'region', label: 'Region', defaultVisible: true },
  { key: 'criticality', label: 'Criticality', defaultVisible: true },
  { key: 'owner', label: 'Owner', defaultVisible: false }
];

const BUSINESS_DATA_COLUMNS: IDataListColumn<ILookupItem>[] = [
  { key: 'title', label: 'Title', isPrimary: true, render: (item) => item.Title },
  { key: 'industry', label: 'Industry', render: (item) => item.Industry || '—' },
  { key: 'region', label: 'Region', render: (item) => item.GeographicRegion || '—' },
  {
    key: 'criticality',
    label: 'Criticality',
    render: (item) => item.BusinessCriticality || '—'
  },
  {
    key: 'owner',
    label: 'Owner',
    render: (item) => <UserCell name={item.Owner?.Title} email={item.Owner?.Email} />
  }
];

export interface IBusinessListManagerProps {
  riskService: AssetService;
  settings?: IAppSettings;
  items?: ILookupItem[];
  dataReady?: boolean;
  onChanged?: () => void;
}

export const BusinessListManager: React.FC<IBusinessListManagerProps> = ({
  riskService,
  settings,
  items: initialItems,
  dataReady = false,
  onChanged
}) => {
  const viewPrefs = useListViewPreferences(BUSINESS_LIST_TITLE, BUSINESS_COLUMNS);
  const [filters, setFilters] = React.useState(EMPTY_LOOKUP_LIST_FILTERS);
  const [items, setItems] = React.useState<ILookupItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [panelMode, setPanelMode] = React.useState<PanelMode>('create');
  const [editingItem, setEditingItem] = React.useState<ILookupItem | undefined>();
  const [listTitle, setListTitle] = React.useState(BUSINESS_LIST_TITLE);
  const { confirmLookupDelete, confirmDialog, checkingDelete } = useLookupDeleteConfirm(riskService);

  const criticalityOptions = React.useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.BusinessCriticality).filter(Boolean) as string[])
      ).sort((a, b) => a.localeCompare(b)),
    [items]
  );

  const filteredItems = React.useMemo(
    () => applyLookupListFilters(items, filters, { criticalityField: true }),
    [items, filters]
  );

  const loadItems = React.useCallback(async (showSpinner = true): Promise<void> => {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const [data, resolvedTitle] = await Promise.all([
        riskService.getBusinessItems({ skipFieldRepair: true, view: true }),
        riskService.getBusinessListTitle()
      ]);
      setItems(data);
      setListTitle(resolvedTitle);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load businesses.');
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [riskService]);

  React.useEffect(() => {
    if (dataReady && initialItems !== undefined) {
      setItems(initialItems);
      setLoading(false);
      void riskService.getBusinessListTitle().then(setListTitle).catch(() => undefined);
      return;
    }

    void loadItems();
  }, [dataReady, initialItems, loadItems, riskService]);

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

  const { permissions: listPermissions } = useListPermissions(riskService, listTitle);
  const canEdit = listPermissions.canEdit;
  const canDelete = listPermissions.canDelete;
  const canAdd = listPermissions.canAdd;
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

  const handleDelete = async (item: ILookupItem): Promise<void> => {
    if (!canDelete) {
      return;
    }

    const confirmed = await confirmLookupDelete({
      listTitle,
      items: [{ id: item.Id, title: item.Title }],
      dialogTitle: 'Delete business'
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
      setError(err instanceof Error ? err.message : 'Failed to delete business.');
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
      dialogTitle: 'Delete businesses'
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
      onChanged?.();

      if (result.failed.length === 0) {
        setSuccess(`Deleted ${result.deletedIds.length} business(es).`);
      } else {
        setError(
          `Deleted ${result.deletedIds.length} of ${ids.length} business(es). ${result.failed.length} could not be deleted.`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete selected businesses.');
    } finally {
      setSaving(false);
    }
  };

  const renderActions = (item: ILookupItem): React.ReactNode => (
    <>
      {listPermissions.canEdit && (
        <Button appearance="subtle" icon={<EditRegular />} aria-label="Edit" onClick={() => openEditPanel(item)} />
      )}
      {listPermissions.canDelete && (
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
        toolbar={
          <ContentToolbar count={filteredItems.length} countLabel="businesses">
            {viewPrefs.ready && (
              <ListViewControls
                viewMode={viewPrefs.viewMode}
                onViewModeChange={viewPrefs.setViewMode}
                columns={BUSINESS_COLUMNS}
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
            <Button appearance="primary" icon={<AddRegular />} onClick={openCreatePanel} disabled={!canAdd}>
              Add new
            </Button>
          </ContentToolbar>
        }
        filtersBar={
          <ListFiltersBar
            searchValue={filters.search}
            onSearchChange={(search) => setFilters((current) => ({ ...current, search }))}
            searchPlaceholder="Search by title, industry, region, or criticality..."
            showClear={hasActiveLookupListFilters(filters, { criticalityField: true })}
            onClear={() => setFilters(EMPTY_LOOKUP_LIST_FILTERS)}
            dropdowns={[
              {
                key: 'criticality',
                placeholder: 'All Criticality',
                value: filters.status,
                onChange: (value) =>
                  setFilters((current) => ({ ...current, status: value || 'all' })),
                options: [
                  { value: 'all', label: 'All Criticality' },
                  ...criticalityOptions.map((status) => ({ value: status, label: status }))
                ]
              }
            ]}
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
            <Spinner label="Loading businesses..." />
          </div>
        ) : (
          viewPrefs.ready && (
            <DataListView
              items={filteredItems}
              columns={BUSINESS_DATA_COLUMNS}
              visibleColumns={viewPrefs.visibleColumns}
              viewMode={viewPrefs.viewMode}
              ariaLabel="Businesses"
              emptyMessage="No businesses yet. Click Add new to create one."
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
        entity="business"
        mode={panelMode}
        itemId={editingItem?.Id}
        title={
          panelMode === 'create'
            ? 'New Business'
            : panelMode === 'view'
              ? 'View Business'
              : 'Edit Business'
        }
        subtitle={
          panelMode === 'create'
            ? 'Create a new business with organizational context and management details.'
            : editingItem?.Title
        }
        riskService={riskService}
        settings={settings}
        disabledFields={['BusinessCode']}
        extraWide
        onClose={closePanel}
        onEdit={panelMode === 'view' ? () => setPanelMode('edit') : undefined}
        onSaved={async () => {
          closePanel();
          setSuccess(panelMode === 'create' ? 'Business created.' : 'Business updated.');
          riskService.invalidateDataCache(['business:*']);
          await loadItems(false);
          onChanged?.();
        }}
      />
      {confirmDialog}
    </>
  );
};
