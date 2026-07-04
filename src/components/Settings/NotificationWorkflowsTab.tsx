import * as React from 'react';
import {
  Field,
  Input,
  Switch,
  Tab,
  TabList,
  Text,
  Textarea,
  tokens
} from '@fluentui/react-components';
import type {
  INotificationWorkflowTemplate,
  IWorkflowSettings,
  NotificationRecipientKey,
  NotificationWorkflowKey
} from '../../models/IWorkflowSettings';
import { DEFAULT_NOTIFICATION_WORKFLOWS, NOTIFICATION_TEMPLATE_VARIABLES } from '../../lib/workflow-settings/defaults';
import { isScheduleDependentNotificationKey } from '../../constants/scheduleDependentFeatures';
import { useWorkflowSettingsStyles } from './workflowSettingsStyles';

const RECIPIENT_OPTIONS: Array<{ key: NotificationRecipientKey; label: string }> = [
  { key: 'creator', label: 'Asset creator' },
  { key: 'assignee', label: 'Assigned user' },
  { key: 'owner', label: 'Asset owner' },
  { key: 'org_admins', label: 'All admins' },
  { key: 'org_email', label: 'Organization email' }
];

const EVENT_DEFS: Array<{
  key: NotificationWorkflowKey;
  label: string;
  description: string;
}> = [
  { key: 'open', label: 'Asset created', description: 'When a new asset is created' },
  { key: 'assignedTo', label: 'Asset assigned', description: 'When an asset is assigned' },
  { key: 'inProgress', label: 'In progress', description: 'When status moves to in progress' },
  { key: 'closed', label: 'Asset retired/closed', description: 'When an asset is closed or retired' },
  { key: 'incomplete', label: 'Incomplete', description: 'When an asset record needs attention' },
  { key: 'onHold', label: 'On hold', description: 'When an asset is placed on hold' },
  { key: 'riskUpdated', label: 'Asset updated', description: 'When any asset field changes' },
  { key: 'riskCommentAdded', label: 'Comment added', description: 'When a comment is added' },
  { key: 'riskOverdue', label: 'Asset overdue', description: 'When an asset passes its due date' },
  {
    key: 'riskPriorityChanged',
    label: 'Priority changed',
    description: 'When priority or severity changes'
  }
];

const VISIBLE_EVENT_DEFS = EVENT_DEFS.filter((item) => !isScheduleDependentNotificationKey(item.key));

export interface INotificationWorkflowsTabProps {
  workflowSettings: IWorkflowSettings;
  onChange: (next: IWorkflowSettings) => void;
}

function getTemplate(
  settings: IWorkflowSettings,
  key: NotificationWorkflowKey
): INotificationWorkflowTemplate {
  return (
    settings.notificationWorkflows?.[key] ||
    DEFAULT_NOTIFICATION_WORKFLOWS[key] || {
      enabled: false,
      subject: '',
      body: '',
      recipients: []
    }
  );
}

export const NotificationWorkflowsTab: React.FC<INotificationWorkflowsTabProps> = ({
  workflowSettings,
  onChange
}) => {
  const styles = useWorkflowSettingsStyles();
  const [activeEvent, setActiveEvent] = React.useState<NotificationWorkflowKey>('open');

  const updateTemplate = (
    key: NotificationWorkflowKey,
    patch: Partial<INotificationWorkflowTemplate>
  ): void => {
    const current = getTemplate(workflowSettings, key);
    onChange({
      ...workflowSettings,
      notificationWorkflows: {
        ...(workflowSettings.notificationWorkflows || DEFAULT_NOTIFICATION_WORKFLOWS),
        [key]: { ...current, ...patch }
      }
    });
  };

  const toggleRecipient = (key: NotificationWorkflowKey, recipient: NotificationRecipientKey): void => {
    const current = getTemplate(workflowSettings, key);
    const recipients = current.recipients.includes(recipient)
      ? current.recipients.filter((item) => item !== recipient)
      : [...current.recipients, recipient];
    updateTemplate(key, { recipients });
  };

  const active = getTemplate(workflowSettings, activeEvent);
  const activeDef =
    VISIBLE_EVENT_DEFS.find((item) => item.key === activeEvent) || VISIBLE_EVENT_DEFS[0];

  React.useEffect(() => {
    if (isScheduleDependentNotificationKey(activeEvent)) {
      setActiveEvent(VISIBLE_EVENT_DEFS[0]?.key || 'open');
    }
  }, [activeEvent]);

  return (
    <div>
      <TabList
        selectedValue={activeEvent}
        onTabSelect={(_, data) => setActiveEvent((data.value as NotificationWorkflowKey) || 'open')}
        style={{ flexWrap: 'wrap' }}
      >
        {VISIBLE_EVENT_DEFS.map((event) => (
          <Tab key={event.key} value={event.key}>
            {event.label}
          </Tab>
        ))}
      </TabList>

      <div className={styles.numberingCard} style={{ marginTop: tokens.spacingVerticalM }}>
        <div className={styles.settingRow}>
          <div className={styles.settingRowCopy}>
            <Text weight="semibold" block>
              {activeDef.label}
            </Text>
            <Text block className={styles.settingRowDescription}>
              {activeDef.description}
            </Text>
          </div>
          <Switch
            checked={active.enabled}
            onChange={(_, data) => updateTemplate(activeEvent, { enabled: data.checked })}
          />
        </div>

        <Field label="Email subject">
          <Input
            value={active.subject}
            disabled={!active.enabled}
            onChange={(_, data) => updateTemplate(activeEvent, { subject: data.value })}
          />
        </Field>
        <Field
          label="Email body"
          hint={`Placeholders: ${NOTIFICATION_TEMPLATE_VARIABLES.map((item) => `{${item}}`).join(', ')}`}
        >
          <Textarea
            rows={6}
            resize="vertical"
            value={active.body}
            disabled={!active.enabled}
            onChange={(_, data) => updateTemplate(activeEvent, { body: data.value })}
          />
        </Field>

        <Text weight="semibold">Recipients</Text>
        <div className={styles.list}>
          {RECIPIENT_OPTIONS.map((recipient) => (
            <div key={recipient.key} className={styles.settingRow}>
              <Text>{recipient.label}</Text>
              <Switch
                checked={active.recipients.includes(recipient.key)}
                disabled={!active.enabled}
                onChange={() => toggleRecipient(activeEvent, recipient.key)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
