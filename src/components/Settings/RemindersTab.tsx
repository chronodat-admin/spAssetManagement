import * as React from 'react';
import {
  Button,
  Spinner,
  Text
} from '@fluentui/react-components';
import { PlayRegular } from '@fluentui/react-icons';
import type { AadHttpClientFactory } from '@microsoft/sp-http';
import type { IAsset, ISoftwareLicense } from '../../models/IAsset';
import type { IWorkflowSettings } from '../../models/IWorkflowSettings';
import { AssignmentService } from '../../services/AssignmentService';
import { ReminderRunnerService } from '../../services/ReminderRunnerService';
import { SoftwareLicenseService } from '../../services/SoftwareLicenseService';
import { SettingsPageHeader } from './SettingsPageHeader';
import { useTranslation } from '../../i18n/LocaleContext';
import { PageNotifications } from '../Layout/PageNotifications';


export interface IRemindersTabProps {
  aadHttpClientFactory: AadHttpClientFactory;
  assets: IAsset[];
  assignmentService: AssignmentService;
  softwareService: SoftwareLicenseService;
  workflowSettings: IWorkflowSettings;
  adminEmails: string[];
  pageTitle: string;
  pageDescription?: string;
  pageIcon?: React.ElementType;
}

export const RemindersTab: React.FC<IRemindersTabProps> = ({
  aadHttpClientFactory,
  assets,
  assignmentService,
  softwareService,
  workflowSettings,
  adminEmails,
  pageTitle,
  pageDescription,
  pageIcon
}) => {
  const { t } = useTranslation();
  const runner = React.useMemo(() => new ReminderRunnerService(), []);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState('');
  const [preview, setPreview] = React.useState<string[]>([]);

  const handleRun = async (): Promise<void> => {
    setRunning(true);
    setError('');
    setResult('');
    try {
      const [licenses, assignments] = await Promise.all([
        softwareService.getLicenses(),
        assignmentService.getAssignments("AM_Action eq 'Book'")
      ]);
      const items = runner.evaluateReminders(
        assets,
        licenses as ISoftwareLicense[],
        assignments as Array<{
          AM_ExpectedReturnDate?: string;
          AM_AssignedTo?: { Email?: string };
          AM_Asset?: { Title?: string };
        }>
      );
      setPreview(items.map((item) => `${item.title}: ${item.detail}`));
      const sent = await runner.sendReminderDigest(
        aadHttpClientFactory,
        adminEmails,
        items,
        workflowSettings
      );
      setResult(`${items.length} reminder(s) evaluated; ${sent} digest recipient(s) notified.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reminder run failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <SettingsPageHeader title={pageTitle} description={pageDescription} icon={pageIcon} />
      <Text>
        Checks warranty expiry, license renewal, and overdue bookings. Sends a digest email to app administrators when Graph mail is enabled.
      </Text>
      <PageNotifications error={error || undefined} success={result || undefined} />
      <Button
        appearance="primary"
        icon={running ? undefined : <PlayRegular />}
        disabled={running}
        onClick={() => void handleRun()}
        style={{ marginTop: 12 }}
      >
        {running ? <Spinner size="tiny" /> : t('reminders', 'runReminders', 'Run reminders now')}
      </Button>
      {preview.length > 0 ? (
        <ul style={{ marginTop: 16 }}>
          {preview.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
};
