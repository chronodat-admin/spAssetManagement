import { IProvisioningStep } from '../models/IAsset';

const STORAGE_KEY = 'asset-management-provisioning-v1';

export interface IProvisioningScope {
  tenantId: string;
  siteUrl: string;
  userId: string;
}

function scopeKey(scope: IProvisioningScope): string {
  return `${STORAGE_KEY}:${scope.tenantId}:${scope.siteUrl}:${scope.userId}`;
}

export function hasCompletedProvisioning(scope: IProvisioningScope): boolean {
  try {
    return localStorage.getItem(scopeKey(scope)) === 'done';
  } catch {
    return false;
  }
}

export function markProvisioningComplete(scope: IProvisioningScope): void {
  try {
    localStorage.setItem(scopeKey(scope), 'done');
  } catch {
    /* ignore */
  }
}

export function resetProvisioning(scope: IProvisioningScope): void {
  try {
    localStorage.removeItem(scopeKey(scope));
  } catch {
    /* ignore */
  }
}

export function createInitialSteps(): IProvisioningStep[] {
  return [
    {
      id: 'check',
      label: 'Verify access & detect existing lists',
      description: 'Confirms you are a site owner and checks which SharePoint lists already exist.',
      status: 'pending'
    },
    {
      id: 'lookup',
      label: 'Create lookup & reference lists',
      description:
        'Categories, sub-categories, asset types, statuses, vendors, models, locations, projects, roles, and audit log.',
      status: 'pending'
    },
    {
      id: 'settings',
      label: 'Create settings & admin lists',
      description: 'App settings, administrators, and license records that drive configuration.',
      status: 'pending'
    },
    {
      id: 'assets',
      label: 'Create the asset register',
      description: 'The main AM_Assets list with all tracking fields, plus the custom asset form.',
      status: 'pending'
    },
    {
      id: 'operations',
      label: 'Create assignment & operations lists',
      description: 'Assignments, software licenses, maintenance, and inventory (linked to assets).',
      status: 'pending'
    },
    {
      id: 'seed',
      label: 'Seed default data & sample assets',
      description: 'Populates starter categories, statuses, and example assets so the app is usable immediately.',
      status: 'pending'
    },
    {
      id: 'ready',
      label: 'Finish & register the asset form',
      description: 'Registers the SPFx form extension and hides system lists from Site Contents.',
      status: 'pending'
    }
  ];
}
