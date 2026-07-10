import * as React from 'react';
import { Tab, TabList, tokens } from '@fluentui/react-components';
import { AssetService } from '../../services/AssetService';
import { RoleService } from '../../services/RoleService';
import { RolePermissionsTab } from './RolePermissionsTab';
import { SettingsPageHeader } from './SettingsPageHeader';
import { UserRolesTab } from './UserRolesTab';

export type RolesPermissionsSubTab = 'userRoles' | 'rolePermissions';

export interface IRolesAndPermissionsTabProps {
  roleService: RoleService;
  assetService: AssetService;
  pageTitle: string;
  pageDescription?: string;
  pageIcon?: React.ElementType;
  initialSubTab?: RolesPermissionsSubTab;
}

export const RolesAndPermissionsTab: React.FC<IRolesAndPermissionsTabProps> = ({
  roleService,
  assetService,
  pageTitle,
  pageDescription,
  pageIcon,
  initialSubTab = 'userRoles'
}) => {
  const [activeSubTab, setActiveSubTab] = React.useState<RolesPermissionsSubTab>(initialSubTab);

  React.useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  return (
    <>
      <SettingsPageHeader title={pageTitle} description={pageDescription} icon={pageIcon} />
      <TabList
        selectedValue={activeSubTab}
        onTabSelect={(_, data) =>
          setActiveSubTab((data.value as RolesPermissionsSubTab) || 'userRoles')
        }
        style={{ marginBottom: tokens.spacingVerticalM }}
      >
        <Tab value="userRoles">User Roles</Tab>
        <Tab value="rolePermissions">Role Permissions</Tab>
      </TabList>
      {activeSubTab === 'userRoles' ? (
        <UserRolesTab roleService={roleService} assetService={assetService} hideHeader />
      ) : (
        <RolePermissionsTab roleService={roleService} hideHeader />
      )}
    </>
  );
};
