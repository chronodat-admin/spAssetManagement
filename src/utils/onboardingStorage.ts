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
      label: 'Access verification',
      description: 'Confirm you can set up the app on this site and check for any existing setup.',
      status: 'pending'
    },
    {
      id: 'lookup',
      label: 'Reference data',
      description: 'Prepare categories, locations, vendors, and other lists the app relies on.',
      status: 'pending'
    },
    {
      id: 'settings',
      label: 'App configuration',
      description: 'Set up settings, administrators, and license tracking for your workspace.',
      status: 'pending'
    },
    {
      id: 'assets',
      label: 'Asset register',
      description: 'Create your main asset list and the form used to add and edit assets.',
      status: 'pending'
    },
    {
      id: 'operations',
      label: 'Operations workspace',
      description: 'Set up assignments, software licenses, maintenance, and inventory tracking.',
      status: 'pending'
    },
    {
      id: 'seed',
      label: 'Starter content',
      description:
        'Add default picklists and form templates. Demo assets and licenses are included only if you choose that option.',
      status: 'pending'
    },
    {
      id: 'ready',
      label: 'Finalizing setup',
      description: 'Complete registration and prepare the app for everyday use.',
      status: 'pending'
    }
  ];
}
