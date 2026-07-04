import * as React from 'react';
import { Button, MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components';
import { EditRegular, SaveRegular } from '@fluentui/react-icons';
import type { FormMode } from '../../lib/form-config/types';
import { useListPermissions } from '../../hooks/useListPermissions';
import { IAppSettings } from '../../models/IAssetApp';
import { AssetService } from '../../services/AssetService';
import { RightDetailPanel } from '../Layout/RightDetailPanel';
import { DynamicAssetForm } from './DynamicAssetForm';

export interface IAssetFormPanelProps {
  open: boolean;
  mode: FormMode;
  risk?: import('../../models/IAssetApp').IAsset;
  riskService: AssetService;
  settings?: IAppSettings;
  categories: import('../../models/IAssetApp').ILookupItem[];
  subCategories: import('../../models/IAssetApp').ILookupItem[];
  businesses: import('../../models/IAssetApp').ILookupItem[];
  projects: import('../../models/IAssetApp').ILookupItem[];
  profiles: import('../../models/IAssetApp').ILookupItem[];
  responses: import('../../models/IAssetApp').ILookupItem[];
  strategies: import('../../models/IAssetApp').ILookupItem[];
  onSave: () => void;
  onCancel: () => void;
  onEdit?: () => void;
  source?: 'email';
}

export const AssetFormPanel: React.FC<IAssetFormPanelProps> = ({
  open,
  mode,
  risk,
  riskService,
  settings,
  categories,
  subCategories: _subCategories,
  businesses: _businesses,
  projects: _projects,
  profiles: _profiles,
  responses: _responses,
  strategies: _strategies,
  onSave,
  onCancel,
  onEdit,
  source
}) => {
  const [saving, setSaving] = React.useState(false);
  const { permissions, loading: permissionsLoading, error: permissionsError } = useListPermissions(
    riskService,
    'AM_Assets',
    mode === 'create' ? undefined : risk?.Id
  );

  React.useEffect(() => {
    setSaving(false);
  }, [mode, open]);

  const handleEditClick = (): void => {
    // Defer so the view-mode Edit click cannot land on the edit-mode Save control.
    queueMicrotask(() => onEdit?.());
  };

  const handleSaveClick = (): void => {
    (document.getElementById('dynamic-asset-form') as HTMLFormElement | null)?.requestSubmit();
  };

  const canOpen =
    mode === 'create' ? permissions.canAdd : mode === 'view' ? permissions.canView : permissions.canEdit;

  const panelTitle =
    mode === 'create'
      ? 'Create new asset'
      : mode === 'view'
        ? source === 'email'
          ? `View asset from email${risk?.AM_AssetId ? ` — ${risk.AM_AssetId}` : ''}`
          : `View asset${risk?.AM_AssetId ? ` — ${risk.AM_AssetId}` : ''}`
        : `Edit asset${risk?.AM_AssetId ? ` — ${risk.AM_AssetId}` : ''}`;

  const footer =
    mode === 'view' ? (
      <>
        <Button appearance="secondary" onClick={onCancel}>
          Close
        </Button>
        {permissions.canEdit && onEdit && (
          <Button appearance="primary" type="button" icon={<EditRegular />} onClick={handleEditClick}>
            Edit
          </Button>
        )}
      </>
    ) : (
      <>
        <Button appearance="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          appearance="primary"
          type="button"
          disabled={saving || permissionsLoading || !canOpen}
          icon={saving ? <Spinner size="tiny" /> : <SaveRegular />}
          onClick={handleSaveClick}
        >
          {saving ? 'Saving...' : 'Save asset'}
        </Button>
      </>
    );

  return (
    <RightDetailPanel
      open={open}
      extraWide={source !== 'email'}
      fullPage={source === 'email'}
      title={panelTitle}
      subtitle={risk?.Title}
      onClose={onCancel}
      footer={footer}
    >
      {permissionsLoading ? (
        <Spinner label="Checking permissions..." />
      ) : permissionsError ? (
        <MessageBar intent="error">
          <MessageBarBody>{permissionsError}</MessageBarBody>
        </MessageBar>
      ) : !canOpen ? (
        <MessageBar intent="warning">
          <MessageBarBody>
            You do not have permission to {mode === 'create' ? 'create assets in' : 'view or edit items on'} the
            AM_Assets list.
          </MessageBarBody>
        </MessageBar>
      ) : (
        <DynamicAssetForm
          mode={mode}
          risk={risk}
          riskService={riskService}
          settings={settings}
          categories={categories}
          onSave={onSave}
          onCancel={onCancel}
        />
      )}
    </RightDetailPanel>
  );
};

