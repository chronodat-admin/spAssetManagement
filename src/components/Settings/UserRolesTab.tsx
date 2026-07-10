import * as React from 'react';
import {
  Button,
  Field,
  Option,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow
} from '@fluentui/react-components';
import { AddRegular, DeleteRegular } from '@fluentui/react-icons';
import { PeoplePickerField } from '../PeoplePicker/PeoplePickerField';
import { UserCell } from '../PeoplePicker/UserAvatar';
import { IPersonPickerItem } from '../../models/IPersonPickerItem';
import { AssetService } from '../../services/AssetService';
import { RoleService } from '../../services/RoleService';
import { SettingsPageHeader } from './SettingsPageHeader';
import { useTranslation } from '../../i18n/LocaleContext';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { PageNotifications } from '../Layout/PageNotifications';


export interface IUserRolesTabProps {
  roleService: RoleService;
  assetService: AssetService;
  pageTitle?: string;
  pageDescription?: string;
  pageIcon?: React.ElementType;
  hideHeader?: boolean;
}

export const UserRolesTab: React.FC<IUserRolesTabProps> = ({
  roleService,
  assetService,
  pageTitle,
  pageDescription,
  pageIcon,
  hideHeader = false
}) => {
  const { t } = useTranslation();
  const [assignments, setAssignments] = React.useState<
    Awaited<ReturnType<RoleService['getUserRoleAssignments']>>
  >([]);
  const [roles, setRoles] = React.useState<Awaited<ReturnType<RoleService['getRoles']>>>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [selectedUser, setSelectedUser] = React.useState<IPersonPickerItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = React.useState('');

  const load = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [nextAssignments, nextRoles] = await Promise.all([
        roleService.getUserRoleAssignments(),
        roleService.getRoles()
      ]);
      setAssignments(nextAssignments);
      setRoles(nextRoles);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles.');
    } finally {
      setLoading(false);
    }
  }, [roleService]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (): Promise<void> => {
    const user = selectedUser[0];
    if (!user || !selectedRoleId) return;
    setSaving(true);
    try {
      await roleService.addUserRole(user.id, Number(selectedRoleId));
      setSelectedUser([]);
      setSelectedRoleId('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add role.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await roleService.removeUserRole(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove role.');
    }
  };

  return (
    <>
      {!hideHeader ? (
        <SettingsPageHeader title={pageTitle || 'User Roles'} description={pageDescription} icon={pageIcon} />
      ) : null}
      <PageNotifications error={error || undefined} />
      <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <Field label="User">
          <PeoplePickerField
            multi={false}
            value={selectedUser}
            onChange={setSelectedUser}
            onSearch={(query) => assetService.searchPeople(query)}
            onResolve={(key) => assetService.resolvePerson(key)}
          />
        </Field>
        <Field label={t('settings', 'userRoles', 'User Roles')}>
          <AppDropdown
            selectedOptions={selectedRoleId ? [selectedRoleId] : []}
            onOptionSelect={(_, data) => setSelectedRoleId(data.optionValue || '')}
            placeholder="Select role"
          >
            {roles.map((role) => (
              <Option key={role.Id} value={String(role.Id)} text={role.Title}>
                {role.Title}
              </Option>
            ))}
          </AppDropdown>
        </Field>
        <Button appearance="primary" icon={<AddRegular />} disabled={saving} onClick={() => void handleAdd()}>
          {t('common', 'add', 'Add')}
        </Button>
      </div>
      {loading ? (
        <Spinner label={t('common', 'loading', 'Loading…')} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell />
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((row) => (
              <TableRow key={row.Id}>
                <TableCell>
                  <UserCell
                    name={row.AM_User?.Title}
                    email={row.AM_User?.EMail}
                  />
                </TableCell>
                <TableCell>{row.AM_Role?.Title || '—'}</TableCell>
                <TableCell>
                  <Button appearance="subtle" icon={<DeleteRegular />} onClick={() => void handleDelete(row.Id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
};
