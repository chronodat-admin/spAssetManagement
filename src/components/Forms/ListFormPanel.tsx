import * as React from 'react';
import { Button, MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components';
import { EditRegular, SaveRegular } from '@fluentui/react-icons';
import { buildFormConfig } from '../../lib/form-config/build';
import { parseFormSettings } from '../../lib/form-config/storage';
import type { EntityKey, FormMode } from '../../lib/form-config/types';
import { useListPermissions } from '../../hooks/useListPermissions';
import { IAppSettings } from '../../models/IAssetApp';
import { AssetService } from '../../services/AssetService';
import { RightDetailPanel } from '../Layout/RightDetailPanel';
import { SharePointDynamicForm } from './SharePointDynamicForm';

export interface IListFormPanelProps {
  open: boolean;
  listTitle: string;
  entity: EntityKey;
  mode: FormMode;
  itemId?: number;
  title: string;
  subtitle?: string;
  riskService: AssetService;
  settings?: IAppSettings;
  includeFields?: string[];
  excludeFields?: string[];
  lookupOptions?: Record<string, Array<{ id: number; title: string }>>;
  disabledFields?: string[];
  wide?: boolean;
  extraWide?: boolean;
  onClose: () => void;
  onSaved: () => void;
  onEdit?: () => void;
}

export const ListFormPanel: React.FC<IListFormPanelProps> = ({
  open,
  listTitle,
  entity,
  mode,
  itemId,
  title,
  subtitle,
  riskService,
  settings,
  includeFields,
  excludeFields,
  lookupOptions,
  disabledFields,
  wide,
  extraWide,
  onClose,
  onSaved,
  onEdit
}) => {
  const formSettings = React.useMemo(() => parseFormSettings(settings), [settings]);
  const formConfig = React.useMemo(
    () => buildFormConfig(formSettings, entity, mode),
    [formSettings, entity, mode]
  );
  const [saving, setSaving] = React.useState(false);
  const { permissions, loading: permissionsLoading, error: permissionsError } = useListPermissions(
    riskService,
    listTitle,
    mode === 'create' ? undefined : itemId
  );

  React.useEffect(() => {
    setSaving(false);
  }, [mode, open]);

  const handleEditClick = (): void => {
    queueMicrotask(() => onEdit?.());
  };

  const handleSaveClick = (): void => {
    (document.getElementById('sharepoint-dynamic-form') as HTMLFormElement | null)?.requestSubmit();
  };

  const canOpen =
    mode === 'create' ? permissions.canAdd : mode === 'view' ? permissions.canView : permissions.canEdit;

  const footer =
    mode === 'view' ? (
      <>
        <Button appearance="secondary" onClick={onClose}>
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
        <Button appearance="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          appearance="primary"
          type="button"
          disabled={saving || permissionsLoading || !canOpen}
          icon={saving ? <Spinner size="tiny" /> : <SaveRegular />}
          onClick={handleSaveClick}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </>
    );

  return (
    <RightDetailPanel
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={footer}
      wide={wide}
      extraWide={extraWide}
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
            You do not have permission to {mode === 'create' ? 'create items in' : 'view or edit items on'} this
            list.
          </MessageBarBody>
        </MessageBar>
      ) : (
        <SharePointDynamicForm
          listTitle={listTitle}
          itemId={itemId}
          mode={mode}
          riskService={riskService}
          formConfig={formConfig}
          includeFields={includeFields}
          excludeFields={excludeFields}
          lookupOptions={lookupOptions}
          disabledFields={disabledFields}
          onSaved={onSaved}
          onCancel={onClose}
          onSubmittingChange={setSaving}
        />
      )}
    </RightDetailPanel>
  );
};

