import * as React from 'react';
import {
  Button,
  tokens
} from '@fluentui/react-components';
import { AppMessageBar } from '../Layout/AppMessageBar';
import { ArrowClockwiseRegular, DeleteRegular } from '@fluentui/react-icons';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import type { IClearSeedDataResult } from '../../models/IAssetApp';

export interface ISampleDataSettingsSectionProps {
  isSiteOwner: boolean;
  onClearSeedData: () => Promise<IClearSeedDataResult>;
  onRestoreSampleData?: () => Promise<number>;
  onCleared?: () => void;
  settingRowClassName?: string;
  settingCopyClassName?: string;
}

export const SampleDataSettingsSection: React.FC<ISampleDataSettingsSectionProps> = ({
  isSiteOwner,
  onClearSeedData,
  onRestoreSampleData,
  onCleared,
  settingRowClassName,
  settingCopyClassName
}) => {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [clearing, setClearing] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [messageIntent, setMessageIntent] = React.useState<'success' | 'error' | 'warning'>(
    'success'
  );

  const handleClear = async (): Promise<void> => {
    const confirmed = await confirm({
      title: 'Clear sample data',
      message:
        `Remove sample data seeded by ${DEFAULT_APP_TITLE}? Only onboarding/demo rows are deleted — ` +
        'your own assets, lookup values, and settings are kept. You can re-add sample data using Restore sample data.',
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

  const handleRestore = async (): Promise<void> => {
    if (!onRestoreSampleData) {
      return;
    }

    setRestoring(true);
    setMessage('');
    try {
      const added = await onRestoreSampleData();
      onCleared?.();
      setMessageIntent('success');
      setMessage(
        added > 0
          ? `Added ${added} sample item(s) from the built-in catalog.`
          : 'Sample data is already present or could not be added.'
      );
    } catch (error) {
      setMessageIntent('error');
      setMessage(error instanceof Error ? error.message : 'Failed to restore sample data.');
    } finally {
      setRestoring(false);
    }
  };

  if (!isSiteOwner) {
    return null;
  }

  return (
    <>
      {message && (
        <AppMessageBar intent={messageIntent}>{message}</AppMessageBar>
      )}

      <div className={settingRowClassName}>
        <div className={settingCopyClassName}>
          <strong>Sample data</strong>
          <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
            Manage demo assets, software licenses, tags, and lookup rows that were seeded during setup.
            Your own records are not deleted when clearing sample data.
          </div>
        </div>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, flexWrap: 'wrap' }}>
          {onRestoreSampleData ? (
            <Button
              appearance="secondary"
              icon={<ArrowClockwiseRegular />}
              disabled={restoring || clearing}
              onClick={() => void handleRestore()}
            >
              {restoring ? 'Restoring...' : 'Restore sample data'}
            </Button>
          ) : null}
          <Button
            appearance="secondary"
            icon={<DeleteRegular />}
            disabled={clearing || restoring}
            onClick={() => void handleClear()}
          >
            {clearing ? 'Clearing...' : 'Clear sample data'}
          </Button>
        </div>
      </div>
      {confirmDialog}
    </>
  );
};
