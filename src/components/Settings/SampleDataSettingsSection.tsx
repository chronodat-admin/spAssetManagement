import * as React from 'react';
import {
  Button,
  MessageBar,
  MessageBarBody,
  tokens
} from '@fluentui/react-components';
import { DeleteRegular } from '@fluentui/react-icons';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import type { IClearSeedDataResult } from '../../models/IAssetApp';

export interface ISampleDataSettingsSectionProps {
  isSiteOwner: boolean;
  onClearSeedData: () => Promise<IClearSeedDataResult>;
  onCleared?: () => void;
  settingRowClassName?: string;
  settingCopyClassName?: string;
}

export const SampleDataSettingsSection: React.FC<ISampleDataSettingsSectionProps> = ({
  isSiteOwner,
  onClearSeedData,
  onCleared,
  settingRowClassName,
  settingCopyClassName
}) => {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [clearing, setClearing] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [messageIntent, setMessageIntent] = React.useState<'success' | 'error' | 'warning'>(
    'success'
  );

  const handleClear = async (): Promise<void> => {
    const confirmed = await confirm({
      title: 'Clear sample data',
      message:
        `Remove sample data seeded by ${DEFAULT_APP_TITLE}? Only onboarding/demo rows are deleted — ` +
        'your own risks, lookup values, and settings are kept. You can re-seed sample data from Setup status.',
      confirmLabel: 'Clear sample data'
    });
    if (!confirmed) {
      return;
    }

    setClearing(true);
    setMessage('');
    try {
      const result = await onClearSeedData();
      onCleared?.();

      if (result.totalDeleted === 0 && result.failed.length === 0) {
        setMessageIntent('success');
        setMessage('No sample data rows were found to remove.');
        return;
      }

      const parts: string[] = [];
      if (result.totalDeleted > 0) {
        parts.push(`Removed ${result.totalDeleted} sample item(s).`);
      }
      if (result.failed.length > 0) {
        parts.push(
          `${result.failed.length} item(s) could not be removed because they are still referenced elsewhere.`
        );
      }

      setMessageIntent(result.failed.length > 0 ? 'warning' : 'success');
      setMessage(parts.join(' '));
    } catch (error) {
      setMessageIntent('error');
      setMessage(error instanceof Error ? error.message : 'Failed to clear sample data.');
    } finally {
      setClearing(false);
    }
  };

  if (!isSiteOwner) {
    return null;
  }

  return (
    <>
      {message && (
        <MessageBar intent={messageIntent}>
          <MessageBarBody>{message}</MessageBarBody>
        </MessageBar>
      )}

      <div className={settingRowClassName}>
        <div className={settingCopyClassName}>
          <strong>Sample data</strong>
          <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
            Remove demo risks, lookup values, form templates, and compliance samples that were
            seeded during setup. Your own records are not deleted.
          </div>
        </div>
        <Button
          appearance="secondary"
          icon={<DeleteRegular />}
          disabled={clearing}
          onClick={() => void handleClear()}
        >
          {clearing ? 'Clearing...' : 'Clear sample data'}
        </Button>
      </div>
      {confirmDialog}
    </>
  );
};
