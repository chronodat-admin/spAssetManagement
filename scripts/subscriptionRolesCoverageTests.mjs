import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SUBSCRIPTION_API_URL } from '../lib/constants/spfxComponents.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readSource(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('subscription and roles coverage contracts', () => {
  it('enables Chronodat subscription API and paywall wiring', () => {
    assert.equal(DEFAULT_SUBSCRIPTION_API_URL, 'https://subscription.chronodat.com');

    const context = readSource('src/contexts/SubscriptionContext.tsx');
    const shell = readSource('src/webparts/assetManagement/components/AssetManagement.tsx');

    assert.match(context, /DEFAULT_SUBSCRIPTION_API_URL/);
    assert.match(context, /aadHttpClientFactory/);
    assert.match(shell, /SubscriptionPaywall/);
    assert.match(shell, /SubscriptionTrialBanner/);
    assert.match(shell, /handleOpenSubscriptionSettings/);
  });

  it('combines user roles and role permissions into one settings page', () => {
    const settings = readSource('src/components/Settings/Settings.tsx');
    const meta = readSource('src/components/Settings/settingsPageMeta.ts');
    const rolesTab = readSource('src/components/Settings/RolesAndPermissionsTab.tsx');

    assert.match(meta, /rolesAndPermissions/);
    assert.match(meta, /Roles & Permissions/);
    assert.doesNotMatch(meta, /id: 'userRoles'/);
    assert.doesNotMatch(meta, /id: 'rolePermissions'/);
    assert.match(settings, /RolesAndPermissionsTab/);
    assert.match(rolesTab, /User Roles/);
    assert.match(rolesTab, /Role Permissions/);
  });

  it('keeps role service CRUD and permission matrix paths', () => {
    const roleService = readSource('src/services/RoleService.ts');
    const permissions = readSource('src/constants/rolePermissionsSeedData.ts');

    for (const method of [
      'getUserRoleAssignments',
      'addUserRole',
      'removeUserRole',
      'getRolePermissions',
      'createRolePermission',
      'updateRolePermission',
      'deleteRolePermission'
    ]) {
      assert.match(roleService, new RegExp(`public async ${method}\\(`));
    }

    assert.match(permissions, /ROLE_PERMISSIONS_SEED_DATA/);
    assert.match(permissions, /PERMISSION_RESOURCES/);
  });

  it('keeps asset activity tab wired for version history', () => {
    const form = readSource('src/components/Forms/SharePointDynamicForm.tsx');
    const activity = readSource('src/components/Assets/AssetActivityTab.tsx');
    assert.match(form, /AssetActivityTab/);
    assert.match(activity, /version history|Version/i);
  });
});
