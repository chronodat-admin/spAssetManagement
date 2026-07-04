import * as React from 'react';
import {
  Button,
  MessageBar,
  MessageBarBody,
  Spinner
} from '@fluentui/react-components';
import { AddRegular, DeleteRegular } from '@fluentui/react-icons';
import { ContentCard } from '../Layout/ContentCard';
import { ContentToolbar } from '../Layout/ContentToolbar';
import { DataListView, IDataListColumn } from '../ListView/DataListView';
import { ListFiltersBar } from '../ListView/ListFiltersBar';
import { RightDetailPanel } from '../Layout/RightDetailPanel';
import { PeoplePickerField } from '../PeoplePicker/PeoplePickerField';
import { UserCell } from '../PeoplePicker/UserAvatar';
import { IAppAdministrator } from '../../models/IAssetApp';
import { IPersonPickerItem } from '../../models/IPersonPickerItem';
import { AssetService } from '../../services/AssetService';
import { SettingsPageHeader } from './SettingsPageHeader';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

export interface IAppAdministratorsTabProps {
  riskService: AssetService;
  pageTitle: string;
  pageDescription?: string;
  pageIcon?: React.ElementType;
}

export const AppAdministratorsTab: React.FC<IAppAdministratorsTabProps> = ({
  riskService,
  pageTitle,
  pageDescription,
  pageIcon
}) => {
  const [administrators, setAdministrators] = React.useState<IAppAdministrator[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<IPersonPickerItem[]>([]);
  const { confirm, confirmDialog } = useConfirmDialog();

  const loadAdministrators = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await riskService.getAppAdministrators();
      setAdministrators(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load app administrators.');
    } finally {
      setLoading(false);
    }
  }, [riskService]);

  React.useEffect(() => {
    void loadAdministrators();
  }, [loadAdministrators]);

  const filteredAdministrators = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return administrators;
    }

    return administrators.filter((administrator) => {
      const name = administrator.AM_User?.Title || administrator.UserName1?.Title || administrator.Title;
      const email = administrator.AM_User?.Email || administrator.UserName1?.Email || '';
      return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
    });
  }, [administrators, search]);

  const columns = React.useMemo<IDataListColumn<IAppAdministrator>[]>(
    () => [
      {
        key: 'user',
        label: 'User',
        isPrimary: true,
        render: (item) => (
          <UserCell
            name={item.AM_User?.Title || item.UserName1?.Title || item.Title}
            email={item.AM_User?.Email || item.UserName1?.Email}
          />
        )
      },
      {
        key: 'email',
        label: 'Email',
        render: (item) => item.AM_User?.Email || item.UserName1?.Email || '—'
      }
    ],
    []
  );

  const clearMessages = (): void => {
    setError('');
    setSuccess('');
  };

  const openAddPanel = (): void => {
    clearMessages();
    setSelectedUser([]);
    setPanelOpen(true);
  };

  const closePanel = (): void => {
    setPanelOpen(false);
    setSelectedUser([]);
  };

  const handleAdd = async (): Promise<void> => {
    const person = selectedUser[0];
    if (!person) {
      setError('Select a user to add.');
      return;
    }

    clearMessages();
    setSaving(true);
    try {
      const added = await riskService.addAppAdministrator(person);
      setSuccess(
        added
          ? `Added ${person.title} as an app administrator.`
          : `${person.title} is already an app administrator.`
      );
      closePanel();
      await loadAdministrators();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add app administrator.');
    } finally {
      setSaving(false);
    }
  };

  const canRemoveAdministrators = administrators.length > 1;

  const handleDelete = async (administrator: IAppAdministrator): Promise<void> => {
    if (!canRemoveAdministrators) {
      return;
    }

    const displayName = administrator.AM_User?.Title || administrator.UserName1?.Title || administrator.Title;
    const confirmed = await confirm({
      title: 'Remove app administrator',
      message: `Remove ${displayName} from app administrators? They will no longer be able to open Settings.`,
      confirmLabel: 'Remove'
    });
    if (!confirmed) {
      return;
    }

    clearMessages();
    setSaving(true);
    try {
      await riskService.deleteAppAdministrator(administrator.Id);
      setSuccess(`Removed ${displayName}.`);
      await loadAdministrators();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove app administrator.');
    } finally {
      setSaving(false);
    }
  };

  const renderActions = (item: IAppAdministrator): React.ReactNode => {
    const deleteButton = (
      <Button
        appearance="subtle"
        icon={<DeleteRegular />}
        aria-label="Remove"
        disabled={saving || !canRemoveAdministrators}
        onClick={() => void handleDelete(item)}
      />
    );

    if (!canRemoveAdministrators) {
      return (
        <span title="At least one app administrator is required.">{deleteButton}</span>
      );
    }

    return deleteButton;
  };

  return (
    <>
      <ContentCard
        flushBody
        pageHeader={
          <SettingsPageHeader
            embedded
            title={pageTitle}
            description={pageDescription}
            icon={pageIcon}
            actions={
              <Button appearance="primary" icon={<AddRegular />} onClick={openAddPanel}>
                Add administrator
              </Button>
            }
          />
        }
        toolbar={
          <ContentToolbar count={filteredAdministrators.length} countLabel="administrators" />
        }
        filtersBar={
          <ListFiltersBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name or email..."
            showClear={Boolean(search.trim())}
            onClear={() => setSearch('')}
          />
        }
      >
        {error && !panelOpen && (
          <div style={{ padding: '12px 16px 0' }}>
            <MessageBar intent="error">
              <MessageBarBody>{error}</MessageBarBody>
            </MessageBar>
          </div>
        )}
        {success && (
          <div style={{ padding: '12px 16px 0' }}>
            <MessageBar intent="success">
              <MessageBarBody>{success}</MessageBarBody>
            </MessageBar>
          </div>
        )}

        {loading ? (
          <div style={{ padding: 24 }}>
            <Spinner label="Loading..." />
          </div>
        ) : (
          <DataListView
            items={filteredAdministrators}
            columns={columns}
            visibleColumns={['user', 'email']}
            viewMode="table"
            ariaLabel="App administrators"
            emptyMessage="No app administrators yet. Click Add administrator to grant Settings access."
            getItemKey={(item) => item.Id}
            renderActions={renderActions}
            getSelectionLabel={(item) => item.AM_User?.Title || item.UserName1?.Title || item.Title}
          />
        )}
      </ContentCard>

      <RightDetailPanel
        open={panelOpen}
        title="Add app administrator"
        subtitle="Grant Settings access"
        onClose={closePanel}
        footer={
          <>
            <Button appearance="secondary" onClick={closePanel} disabled={saving}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              disabled={saving || selectedUser.length === 0}
              onClick={() => void handleAdd()}
            >
              {saving ? 'Adding...' : 'Add administrator'}
            </Button>
          </>
        }
      >
        {error && panelOpen && (
          <MessageBar intent="error" style={{ marginBottom: 16 }}>
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}
        <PeoplePickerField
          label="User"
          required
          multi={false}
          placeholder="Search for a person"
          value={selectedUser}
          onChange={setSelectedUser}
          onSearch={(query) => riskService.searchPeople(query)}
          onResolve={(key) => riskService.resolvePerson(key)}
        />
      </RightDetailPanel>

      {confirmDialog}
    </>
  );
};
