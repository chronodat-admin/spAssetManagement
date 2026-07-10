import * as React from 'react';
import {
  Badge,
  Button,
  Field,
  Option,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  tokens
} from '@fluentui/react-components';
import { AddRegular, DeleteRegular } from '@fluentui/react-icons';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { ContentCard } from '../Layout/ContentCard';
import { ContentToolbar } from '../Layout/ContentToolbar';
import { ListFiltersBar } from '../ListView/ListFiltersBar';
import { PageNotifications } from '../Layout/PageNotifications';
import { RightDetailPanel } from '../Layout/RightDetailPanel';
import {
  ASSET_ROLE_CHOICES,
  PERMISSION_ACTIONS,
  PERMISSION_RESOURCES,
  type PermissionAction,
  type PermissionResource
} from '../../constants/rolePermissionsSeedData';
import type { IRolePermission } from '../../models/IRolePermission';
import { RoleService } from '../../services/RoleService';
import { SettingsPageHeader } from './SettingsPageHeader';

export interface IRolePermissionsTabProps {
  roleService: RoleService;
  pageTitle?: string;
  pageDescription?: string;
  pageIcon?: React.ElementType;
  hideHeader?: boolean;
}

type RoleFilter = 'all' | (typeof ASSET_ROLE_CHOICES)[number];

export const RolePermissionsTab: React.FC<IRolePermissionsTabProps> = ({
  roleService,
  pageTitle,
  pageDescription,
  pageIcon,
  hideHeader = false
}) => {
  const [permissions, setPermissions] = React.useState<IRolePermission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<number | undefined>();
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>('all');
  const [search, setSearch] = React.useState('');
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [draftRole, setDraftRole] = React.useState<(typeof ASSET_ROLE_CHOICES)[number]>('User');
  const [draftResource, setDraftResource] = React.useState<PermissionResource>(PERMISSION_RESOURCES[0]);
  const [draftAction, setDraftAction] = React.useState<PermissionAction>(PERMISSION_ACTIONS[0]);
  const [draftAllowed, setDraftAllowed] = React.useState(true);

  const load = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const rows = await roleService.getRolePermissions();
      setPermissions(rows);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permission rules.');
    } finally {
      setLoading(false);
    }
  }, [roleService]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return permissions.filter((row) => {
      if (roleFilter !== 'all' && row.role !== roleFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        row.role.toLowerCase().includes(query) ||
        row.resource.toLowerCase().includes(query) ||
        row.action.toLowerCase().includes(query)
      );
    });
  }, [permissions, roleFilter, search]);

  const handleToggle = async (permission: IRolePermission, isAllowed: boolean): Promise<void> => {
    setBusyId(permission.id);
    setSuccess('');
    try {
      await roleService.updateRolePermission(permission.id, { isAllowed });
      await load();
      setSuccess('Permission updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permission.');
    } finally {
      setBusyId(undefined);
    }
  };

  const handleDelete = async (permission: IRolePermission): Promise<void> => {
    setSuccess('');
    try {
      await roleService.deleteRolePermission(permission.id);
      await load();
      setSuccess('Permission rule deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete permission.');
    }
  };

  const handleAdd = async (): Promise<void> => {
    setSaving(true);
    setSuccess('');
    try {
      await roleService.createRolePermission({
        role: draftRole,
        resource: draftResource,
        action: draftAction,
        isAllowed: draftAllowed
      });
      setPanelOpen(false);
      await load();
      setSuccess('Permission rule added.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add permission rule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {!hideHeader ? (
        <SettingsPageHeader
          title={pageTitle || 'Role Permissions'}
          description={pageDescription}
          icon={pageIcon}
        />
      ) : null}
      <PageNotifications error={error || undefined} success={success || undefined} />

      <ContentCard
        flushBody
        toolbar={
          <ContentToolbar count={filtered.length} countLabel="permission rules">
            <Button appearance="primary" icon={<AddRegular />} onClick={() => setPanelOpen(true)}>
              Add rule
            </Button>
          </ContentToolbar>
        }
        filtersBar={
          <ListFiltersBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search permissions..."
            showClear={Boolean(search.trim()) || roleFilter !== 'all'}
            onClear={() => {
              setSearch('');
              setRoleFilter('all');
            }}
            dropdowns={[
              {
                key: 'role',
                placeholder: 'All roles',
                value: roleFilter,
                onChange: (value) => setRoleFilter((value || 'all') as RoleFilter),
                options: [
                  { value: 'all', label: 'All roles' },
                  ...ASSET_ROLE_CHOICES.map((role) => ({ value: role, label: role }))
                ]
              }
            ]}
          />
        }
      >
        <Text block style={{ marginBottom: tokens.spacingVerticalM, color: tokens.colorNeutralForeground2 }}>
          These rules control what each application role can see and do in the UI. SharePoint list
          permissions remain the security boundary for data access. Toggle Allowed or add rules to
          customize access.
        </Text>

        {loading ? (
          <Spinner label="Loading permission rules…" />
        ) : filtered.length === 0 ? (
          <Text block style={{ color: tokens.colorNeutralForeground3 }}>
            No permission rules match your filters. Run setup to create the AM_RolePermissions list,
            or add a rule.
          </Text>
        ) : (
          <Table aria-label="Role permissions">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Resource</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
                <TableHeaderCell>Allowed</TableHeaderCell>
                <TableHeaderCell />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Badge appearance="outline">{row.role}</Badge>
                  </TableCell>
                  <TableCell>{row.resource}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>
                    <Switch
                      checked={row.isAllowed}
                      disabled={busyId === row.id}
                      onChange={(_, data) => void handleToggle(row, data.checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      appearance="subtle"
                      icon={<DeleteRegular />}
                      aria-label="Delete permission rule"
                      onClick={() => void handleDelete(row)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ContentCard>

      <RightDetailPanel
        open={panelOpen}
        title="Add permission rule"
        onClose={() => setPanelOpen(false)}
        footer={
          <Button appearance="primary" disabled={saving} onClick={() => void handleAdd()}>
            {saving ? 'Saving…' : 'Add rule'}
          </Button>
        }
      >
        <div style={{ display: 'grid', gap: tokens.spacingVerticalM }}>
          <Field label="Role" required>
            <AppDropdown
              selectedOptions={[draftRole]}
              onOptionSelect={(_, data) =>
                setDraftRole((data.optionValue as (typeof ASSET_ROLE_CHOICES)[number]) || 'User')
              }
            >
              {ASSET_ROLE_CHOICES.map((role) => (
                <Option key={role} value={role} text={role}>
                  {role}
                </Option>
              ))}
            </AppDropdown>
          </Field>
          <Field label="Resource" required>
            <AppDropdown
              selectedOptions={[draftResource]}
              onOptionSelect={(_, data) =>
                setDraftResource((data.optionValue as PermissionResource) || PERMISSION_RESOURCES[0])
              }
            >
              {PERMISSION_RESOURCES.map((resource) => (
                <Option key={resource} value={resource} text={resource}>
                  {resource}
                </Option>
              ))}
            </AppDropdown>
          </Field>
          <Field label="Action" required>
            <AppDropdown
              selectedOptions={[draftAction]}
              onOptionSelect={(_, data) =>
                setDraftAction((data.optionValue as PermissionAction) || PERMISSION_ACTIONS[0])
              }
            >
              {PERMISSION_ACTIONS.map((action) => (
                <Option key={action} value={action} text={action}>
                  {action}
                </Option>
              ))}
            </AppDropdown>
          </Field>
          <Field label="Allowed">
            <Switch checked={draftAllowed} onChange={(_, data) => setDraftAllowed(data.checked)} />
          </Field>
        </div>
      </RightDetailPanel>
    </>
  );
};
