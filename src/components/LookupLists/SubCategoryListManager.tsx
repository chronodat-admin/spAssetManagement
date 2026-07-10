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
import { SUB_CATEGORIES_LIST_TITLE } from '../../models/IListDefinitions';
import { IAppSettings, ILookupItem } from '../../models/IAssetApp';
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

const SUB_CATEGORY_COLUMNS: ListColumnMeta[] = [
  { key: 'title', label: 'Title', defaultVisible: true, locked: true },
  { key: 'category', label: 'Category', defaultVisible: true }
];

const SUB_CATEGORY_DATA_COLUMNS: IDataListColumn<ILookupItem>[] = [
  { key: 'title', label: 'Title', isPrimary: true, render: (item) => item.Title },
  {
    key: 'category',
    label: 'Category',
    render: (item) => item.AM_ParentCategory?.Title || item.ParentCategory?.Title || '—'
  }
];

export interface ISubCategoryListManagerProps {
  categories: ILookupItem[];
  riskService: AssetService;
  settings?: IAppSettings;
  onChanged?: () => void;
  pageTitle?: string;
  pageDescription?: string;
  pageIcon?: React.ElementType;
}

export const SubCategoryListManager: React.FC<ISubCategoryListManagerProps> = ({
  categories,
  riskService,
  settings,
  onChanged,
  pageTitle,
  pageDescription,
  pageIcon
}) => {
  const viewPrefs = useListViewPreferences(SUB_CATEGORIES_LIST_TITLE, SUB_CATEGORY_COLUMNS);
  const [filters, setFilters] = React.useState(EMPTY_LOOKUP_LIST_FILTERS);
  const [items, setItems] = React.useState<ILookupItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [panelMode, setPanelMode] = React.useState<PanelMode>('create');
  const [editingItem, setEditingItem] = React.useState<ILookupItem | undefined>();
  const { confirmLookupDelete, confirmDialog, checkingDelete } = useLookupDeleteConfirm(riskService);

  const lookupOptions = React.useMemo(
    () => ({
      AM_ParentCategory: categories.map((category) => ({ id: category.Id, title: category.Title }))
    }),
    [categories]
  );

  const filteredItems = React.useMemo(
    () => applyLookupListFilters(items, filters, { categoryField: true }),
    [items, filters]
  );

  const loadItems = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await riskService.getSubCategoryItems();
      setItems(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sub-categories.');
    } finally {
      setLoading(false);
    }
  }, [riskService]);

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

  const { permissions: listPermissions } = useListPermissions(riskService, SUB_CATEGORIES_LIST_TITLE);
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
      listTitle: SUB_CATEGORIES_LIST_TITLE,
      items: [{ id: item.Id, title: item.Title }],
      dialogTitle: 'Delete sub-category'
    });
    if (!confirmed) {
      return;
    }

    clearMessages();
    setSaving(true);
    try {
      await riskService.deleteSubCategoryItem(item.Id);
      bulkSelection.clearSelection();
      setSuccess(`Deleted "${item.Title}".`);
      if (editingItem?.Id === item.Id) {
        closePanel();
      }
      await loadItems();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sub-category.');
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
      listTitle: SUB_CATEGORIES_LIST_TITLE,
      items: selectedItems,
      dialogTitle: 'Delete sub-categories'
    });
    if (!confirmed) {
      return;
    }

    clearMessages();
    setSaving(true);
    try {
      const result = await riskService.deleteLookupItems(SUB_CATEGORIES_LIST_TITLE, ids);
      bulkSelection.clearSelection();
      if (editingItem && ids.includes(editingItem.Id)) {
        closePanel();
      }
      await loadItems();
      onChanged?.();

      if (result.failed.length === 0) {
        setSuccess(`Deleted ${result.deletedIds.length} sub-categor${result.deletedIds.length === 1 ? 'y' : 'ies'}.`);
      } else {
        setError(
          `Deleted ${result.deletedIds.length} of ${ids.length} sub-categor${ids.length === 1 ? 'y' : 'ies'}. ${result.failed.length} could not be deleted.`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete selected sub-categories.');
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
              title={pageTitle || 'Asset Sub-Categories'}
              description={pageDescription}
              icon={pageIcon}
              actions={
                <Button appearance="primary" icon={<AddRegular />} onClick={openCreatePanel} disabled={!canAdd}>
                  Add new
                </Button>
              }
            />
          ) : undefined
        }
        toolbar={
          <ContentToolbar count={filteredItems.length} countLabel="sub-categories">
            {viewPrefs.ready && (
              <ListViewControls
                viewMode={viewPrefs.viewMode}
                onViewModeChange={viewPrefs.setViewMode}
                columns={SUB_CATEGORY_COLUMNS}
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
            {!(pageDescription || pageIcon) && (
              <Button
                appearance="primary"
                icon={<AddRegular />}
                onClick={openCreatePanel}
                disabled={!canAdd}
              >
                Add new
              </Button>
            )}
          </ContentToolbar>
        }
        filtersBar={
          <ListFiltersBar
            searchValue={filters.search}
            onSearchChange={(search) => setFilters((current) => ({ ...current, search }))}
            searchPlaceholder="Search by title..."
            showClear={hasActiveLookupListFilters(filters, { categoryField: true })}
            onClear={() => setFilters(EMPTY_LOOKUP_LIST_FILTERS)}
            dropdowns={[
              {
                key: 'category',
                placeholder: 'All Categories',
                value: filters.categoryId,
                onChange: (value) =>
                  setFilters((current) => ({ ...current, categoryId: value || 'all' })),
                options: [
                  { value: 'all', label: 'All Categories' },
                  ...categories.map((category) => ({
                    value: String(category.Id),
                    label: category.Title
                  }))
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
            <Spinner label="Loading..." />
          </div>
        ) : (
          viewPrefs.ready && (
            <DataListView
              items={filteredItems}
              columns={SUB_CATEGORY_DATA_COLUMNS}
              visibleColumns={viewPrefs.visibleColumns}
              viewMode={viewPrefs.viewMode}
              ariaLabel="Asset sub-categories"
              emptyMessage="No sub-categories yet. Click Add new to create one."
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
        listTitle={SUB_CATEGORIES_LIST_TITLE}
        entity="subCategories"
        mode={panelMode}
        itemId={editingItem?.Id}
        title={
          panelMode === 'create'
            ? 'Add sub-category'
            : panelMode === 'view'
              ? 'View sub-category'
              : 'Edit sub-category'
        }
        subtitle={editingItem?.Title}
        riskService={riskService}
        settings={settings}
        includeFields={['Title', 'AM_ParentCategory']}
        lookupOptions={lookupOptions}
        onClose={closePanel}
        onEdit={panelMode === 'view' ? () => setPanelMode('edit') : undefined}
        onSaved={async () => {
          closePanel();
          setSuccess(panelMode === 'create' ? 'Sub-category created.' : 'Sub-category updated.');
          await loadItems();
          onChanged?.();
        }}
      />
      {confirmDialog}
    </>
  );
};
