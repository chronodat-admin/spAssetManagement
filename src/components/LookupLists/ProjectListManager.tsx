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
import { PROJECTS_LIST_TITLE } from '../../models/IListDefinitions';
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
import type { ListPanelMode } from '../../utils/listPermissions';import { AppMessageBar } from '../Layout/AppMessageBar';


type PanelMode = ListPanelMode;

const PROJECT_COLUMNS: ListColumnMeta[] = [
  { key: 'title', label: 'Title', defaultVisible: true, locked: true },
  { key: 'code', label: 'Code', defaultVisible: true },
  { key: 'business', label: 'Business', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'priority', label: 'Priority', defaultVisible: true },
  { key: 'type', label: 'Type', defaultVisible: false },
  { key: 'manager', label: 'Manager', defaultVisible: false }
];

const PROJECT_DATA_COLUMNS: IDataListColumn<ILookupItem>[] = [
  { key: 'title', label: 'Title', isPrimary: true, render: (item) => item.Title },
  { key: 'code', label: 'Code', render: (item) => item.Code || '—' },
  { key: 'business', label: 'Business', render: (item) => item.Business?.Title || '—' },
  { key: 'status', label: 'Status', render: (item) => item.ProjectStatus || '—' },
  { key: 'priority', label: 'Priority', render: (item) => item.Priority || '—' },
  { key: 'type', label: 'Type', render: (item) => item.ProjectType || '—' },
  {
    key: 'manager',
    label: 'Manager',
    render: (item) => <UserCell name={item.ProjectManager?.Title} email={item.ProjectManager?.Email} />
  }
];

export interface IProjectListManagerProps {
  businesses: ILookupItem[];
  riskService: AssetService;
  settings?: IAppSettings;
  items?: ILookupItem[];
  dataReady?: boolean;
  onChanged?: () => void;
}

export const ProjectListManager: React.FC<IProjectListManagerProps> = ({
  businesses,
  riskService,
  settings,
  items: initialItems,
  dataReady = false,
  onChanged
}) => {
  const viewPrefs = useListViewPreferences(PROJECTS_LIST_TITLE, PROJECT_COLUMNS);
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
      Business: businesses.map((business) => ({ id: business.Id, title: business.Title }))
    }),
    [businesses]
  );

  const statusOptions = React.useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.ProjectStatus).filter(Boolean) as string[])
      ).sort((a, b) => a.localeCompare(b)),
    [items]
  );

  const filteredItems = React.useMemo(
    () =>
      applyLookupListFilters(items, filters, {
        businessField: true,
        statusField: true
      }),
    [items, filters]
  );

  const loadItems = React.useCallback(async (showSpinner = true): Promise<void> => {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const data = await riskService.getProjectItems({ skipFieldRepair: true, view: true });
      setItems(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects.');
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
      return;
    }

    void loadItems();
  }, [dataReady, initialItems, loadItems]);

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

  const { permissions: listPermissions } = useListPermissions(riskService, PROJECTS_LIST_TITLE);
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
      listTitle: PROJECTS_LIST_TITLE,
      items: [{ id: item.Id, title: item.Title }],
      dialogTitle: 'Delete project'
    });
    if (!confirmed) {
      return;
    }

    clearMessages();
    setSaving(true);
    try {
      await riskService.deleteProjectItem(item.Id);
      bulkSelection.clearSelection();
      setSuccess(`Deleted "${item.Title}".`);
      if (editingItem?.Id === item.Id) {
        closePanel();
      }
      await loadItems();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project.');
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
      listTitle: PROJECTS_LIST_TITLE,
      items: selectedItems,
      dialogTitle: 'Delete projects'
    });
    if (!confirmed) {
      return;
    }

    clearMessages();
    setSaving(true);
    try {
      const result = await riskService.deleteLookupItems(PROJECTS_LIST_TITLE, ids);
      bulkSelection.clearSelection();
      if (editingItem && ids.includes(editingItem.Id)) {
        closePanel();
      }
      await loadItems();
      onChanged?.();

      if (result.failed.length === 0) {
        setSuccess(`Deleted ${result.deletedIds.length} project(s).`);
      } else {
        setError(
          `Deleted ${result.deletedIds.length} of ${ids.length} project(s). ${result.failed.length} could not be deleted.`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete selected projects.');
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
          <ContentToolbar count={filteredItems.length} countLabel="projects">
            {viewPrefs.ready && (
              <ListViewControls
                viewMode={viewPrefs.viewMode}
                onViewModeChange={viewPrefs.setViewMode}
                columns={PROJECT_COLUMNS}
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
            searchPlaceholder="Search by title, code, status, or type..."
            showClear={hasActiveLookupListFilters(filters, {
              businessField: true,
              statusField: true
            })}
            onClear={() => setFilters(EMPTY_LOOKUP_LIST_FILTERS)}
            dropdowns={[
              {
                key: 'business',
                placeholder: 'All Businesses',
                value: filters.businessId,
                onChange: (value) =>
                  setFilters((current) => ({ ...current, businessId: value || 'all' })),
                options: [
                  { value: 'all', label: 'All Businesses' },
                  ...businesses.map((business) => ({
                    value: String(business.Id),
                    label: business.Title
                  }))
                ]
              },
              {
                key: 'status',
                placeholder: 'All Statuses',
                value: filters.status,
                onChange: (value) =>
                  setFilters((current) => ({ ...current, status: value || 'all' })),
                options: [
                  { value: 'all', label: 'All Statuses' },
                  ...statusOptions.map((status) => ({ value: status, label: status }))
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
            <Spinner label="Loading projects..." />
          </div>
        ) : (
          viewPrefs.ready && (
            <DataListView
              items={filteredItems}
              columns={PROJECT_DATA_COLUMNS}
              visibleColumns={viewPrefs.visibleColumns}
              viewMode={viewPrefs.viewMode}
              ariaLabel="Projects"
              emptyMessage="No projects yet. Click Add new to create one."
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
        listTitle={PROJECTS_LIST_TITLE}
        entity="projects"
        mode={panelMode}
        itemId={editingItem?.Id}
        title={
          panelMode === 'create'
            ? 'New Project'
            : panelMode === 'view'
              ? 'View Project'
              : 'Edit Project'
        }
        subtitle={panelMode === 'create' ? 'Create a new project linked to a business.' : editingItem?.Title}
        riskService={riskService}
        settings={settings}
        disabledFields={['AM_Code']}
        lookupOptions={lookupOptions}
        extraWide
        onClose={closePanel}
        onEdit={panelMode === 'view' ? () => setPanelMode('edit') : undefined}
        onSaved={async () => {
          closePanel();
          setSuccess(panelMode === 'create' ? 'Project created.' : 'Project updated.');
          riskService.invalidateDataCache(['projects:*']);
          await loadItems(false);
          onChanged?.();
        }}
      />
      {confirmDialog}
    </>
  );
};
