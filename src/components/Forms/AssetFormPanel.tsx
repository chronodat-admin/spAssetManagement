import * as React from 'react';
import { Button, Spinner } from '@fluentui/react-components';
import { AppMessageBar } from '../Layout/AppMessageBar';
import { EditRegular, SaveRegular } from '@fluentui/react-icons';
import { buildFormConfig } from '../../lib/form-config/build';
import { parseFormSettings } from '../../lib/form-config/storage';
import type { FormMode } from '../../lib/form-config/types';
import { useListPermissions } from '../../hooks/useListPermissions';
import { IAppSettings, ILookupItem } from '../../models/IAssetApp';
import { ASSET_STATUSES_LIST_TITLE, SUB_CATEGORIES_LIST_TITLE } from '../../models/IListDefinitions';
import { AssetService } from '../../services/AssetService';
import { RightDetailPanel } from '../Layout/RightDetailPanel';
import { SharePointDynamicForm } from './SharePointDynamicForm';

const ASSET_FORM_ID = 'dynamic-asset-form';

export interface IAssetFormPanelProps {
  open: boolean;
  mode: FormMode;
  risk?: import('../../models/IAssetApp').IAsset;
  riskService: AssetService;
  /** Bumped after setup completes so permission checks refetch against newly created lists. */
  provisioningComplete?: boolean;
  settings?: IAppSettings;
  categories: ILookupItem[];
  subCategories: ILookupItem[];
  businesses: ILookupItem[];
  projects: ILookupItem[];
  profiles: ILookupItem[];
  responses: ILookupItem[];
  strategies: ILookupItem[];
  onSave: () => void;
  onCancel: () => void;
  onEdit?: () => void;
  source?: 'email';
}

type LookupOption = { id: number; title: string };

function toLookupOptions(items: ILookupItem[]): LookupOption[] {
  return items.map((item) => ({ id: item.Id, title: item.Title }));
}

export const AssetFormPanel: React.FC<IAssetFormPanelProps> = ({
  open,
  mode,
  risk,
  riskService,
  provisioningComplete = false,
  settings,
  categories,
  subCategories,
  businesses: _businesses,
  projects,
  profiles,
  responses,
  strategies,
  onSave,
  onCancel,
  onEdit,
  source
}) => {
  const [saving, setSaving] = React.useState(false);
  const [statuses, setStatuses] = React.useState<ILookupItem[]>([]);
  const [loadedSubCategories, setLoadedSubCategories] = React.useState<ILookupItem[]>([]);
  const { permissions, loading: permissionsLoading, error: permissionsError } = useListPermissions(
    riskService,
    'AM_Assets',
    mode === 'create' ? undefined : risk?.Id,
    provisioningComplete,
    { enabled: open }
  );

  const formSettings = React.useMemo(() => parseFormSettings(settings), [settings]);
  const formConfig = React.useMemo(
    () => buildFormConfig(formSettings, 'risks', mode),
    [formSettings, mode]
  );

  React.useEffect(() => {
    setSaving(false);
  }, [mode, open]);

  // AM_Status (lookup) and AM_SubCategory options are not supplied by the parent, so
  // load them here to populate their dropdowns on the asset form.
  React.useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    void riskService
      .getLookupItems(ASSET_STATUSES_LIST_TITLE)
      .then((items) => {
        if (!cancelled) {
          setStatuses(items);
        }
      })
      .catch(() => undefined);
    if (subCategories.length === 0) {
      void riskService
        .getLookupItems(SUB_CATEGORIES_LIST_TITLE)
        .then((items) => {
          if (!cancelled) {
            setLoadedSubCategories(items);
          }
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [open, riskService, subCategories.length]);

  const lookupOptions = React.useMemo<Record<string, LookupOption[]>>(
    () => ({
      AM_Category: toLookupOptions(categories),
      AM_SubCategory: toLookupOptions(subCategories.length > 0 ? subCategories : loadedSubCategories),
      AM_AssetType: toLookupOptions(profiles),
      AM_Vendor: toLookupOptions(responses),
      AM_Location: toLookupOptions(strategies),
      AM_Project: toLookupOptions(projects),
      AM_Status: toLookupOptions(statuses)
    }),
    [categories, subCategories, loadedSubCategories, profiles, responses, strategies, projects, statuses]
  );

  const handleEditClick = (): void => {
    // Defer so the view-mode Edit click cannot land on the edit-mode Save control.
    queueMicrotask(() => onEdit?.());
  };

  const handleSaveClick = (): void => {
    (document.getElementById(ASSET_FORM_ID) as HTMLFormElement | null)?.requestSubmit();
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
        <AppMessageBar intent="error">{permissionsError}</AppMessageBar>
      ) : !canOpen ? (
        <AppMessageBar intent="warning">
          You do not have permission to {mode === 'create' ? 'create assets in' : 'view or edit items on'} the
          AM_Assets list.
        </AppMessageBar>
      ) : (
        <SharePointDynamicForm
          listTitle="AM_Assets"
          itemId={mode === 'create' ? undefined : risk?.Id}
          mode={mode}
          riskService={riskService}
          formConfig={formConfig}
          excludeFields={['AM_ImageUrl']}
          lookupOptions={lookupOptions}
          formId={ASSET_FORM_ID}
          onSaved={onSave}
          onCancel={onCancel}
          onSubmittingChange={setSaving}
        />
      )}
    </RightDetailPanel>
  );
};
