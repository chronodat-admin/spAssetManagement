import * as React from 'react';
import {
  Button,
  Field,
  Input,
  Link,
  Radio,
  RadioGroup,
  Spinner,
  Text,
  tokens
} from '@fluentui/react-components';
import { AppMessageBar } from '../Layout/AppMessageBar';
import {
  ArrowClockwiseRegular,
  CheckmarkCircleRegular,
  CloudRegular,
  MailRegular,
  OpenRegular,
  PlugConnectedRegular,
  WarningRegular
} from '@fluentui/react-icons';
import type { EmailDeliveryMode, IWorkflowSettings } from '../../models/IWorkflowSettings';
import {
  EMAIL_DELIVERY_MODE_DESCRIPTIONS,
  EMAIL_DELIVERY_MODE_LABELS,
  EMAIL_DELIVERY_MODE_ORDER,
  resolveEmailDeliveryMode
} from '../../lib/workflow-settings/emailIntegration';
import { GRAPH_MAIL_SEND_SCOPE } from '../../constants/graphMailSend';
import type { MailSendApprovalUiStatus } from '../../models/IMailSendApproval';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { useWorkflowSettingsStyles } from './workflowSettingsStyles';

const POWER_AUTOMATE_DOCS_PATH = 'docs/power-automate/README.md';
const CHRONODAT_SUPPORT_URL = 'https://www.chronodat.com/Contact';

const DELIVERY_MODES: EmailDeliveryMode[] = EMAIL_DELIVERY_MODE_ORDER;

export interface IEmailIntegrationTabProps {
  workflowSettings: IWorkflowSettings;
  onChange: (next: IWorkflowSettings) => void;
  siteUrl?: string;
  subscriptionApiConfigured?: boolean;
  onNavigateToSubscription?: () => void;
  mailSendStatus?: MailSendApprovalUiStatus;
  mailSendAdminUrl?: string;
  onRefreshMailSendStatus?: () => void;
  refreshingMailSendStatus?: boolean;
}

export const EmailIntegrationTab: React.FC<IEmailIntegrationTabProps> = ({
  workflowSettings,
  onChange,
  siteUrl,
  subscriptionApiConfigured = false,
  onNavigateToSubscription,
  mailSendStatus,
  mailSendAdminUrl,
  onRefreshMailSendStatus,
  refreshingMailSendStatus = false
}) => {
  const styles = useWorkflowSettingsStyles();
  const deliveryMode = resolveEmailDeliveryMode(workflowSettings);

  const update = (patch: Partial<IWorkflowSettings>): void => {
    onChange({ ...workflowSettings, ...patch });
  };

  const setDeliveryMode = (mode: EmailDeliveryMode): void => {
    update({
      emailDeliveryMode: mode,
      graphEmailNotificationsEnabled: mode === 'powerAutomate' ? false : true
    });
  };

  const messageBarIntent =
    deliveryMode === 'graph' ? 'info' : deliveryMode === 'chronodatApi' ? 'success' : 'warning';

  const renderGraphStatus = (): React.ReactElement => {
    const recheckButton = onRefreshMailSendStatus ? (
      <Button
        appearance="secondary"
        size="small"
        icon={refreshingMailSendStatus ? <Spinner size="tiny" /> : <ArrowClockwiseRegular />}
        disabled={refreshingMailSendStatus}
        onClick={onRefreshMailSendStatus}
      >
        Recheck
      </Button>
    ) : null;

    if (!mailSendStatus || mailSendStatus === 'checking') {
      return (
        <AppMessageBar intent="info">
          <Spinner size="tiny" /> Checking Microsoft Graph {GRAPH_MAIL_SEND_SCOPE} approval&hellip;
        </AppMessageBar>
      );
    }

    if (mailSendStatus === 'approved') {
      return (
        <AppMessageBar
          intent="success"
          icon={<CheckmarkCircleRegular />}
          title="This option is good to go"
          actions={recheckButton || undefined}
        >
          Microsoft Graph {GRAPH_MAIL_SEND_SCOPE} is approved for this tenant. Workflow notification emails
          will send from the signed-in user&rsquo;s Exchange mailbox &mdash; no further setup needed.
        </AppMessageBar>
      );
    }

    const intent = mailSendStatus === 'pending' ? 'warning' : 'info';
    const title =
      mailSendStatus === 'pending'
        ? `Approve ${GRAPH_MAIL_SEND_SCOPE} to finish enabling Graph`
        : mailSendStatus === 'unavailable'
          ? 'Graph is unavailable in this host'
          : `${GRAPH_MAIL_SEND_SCOPE} approval may be required`;

    return (
      <AppMessageBar
        intent={intent}
        icon={<WarningRegular />}
        title={title}
        actions={
          mailSendAdminUrl || recheckButton ? (
            <>
              {mailSendAdminUrl ? (
                <Button
                  appearance="primary"
                  size="small"
                  icon={<OpenRegular />}
                  onClick={() => window.open(mailSendAdminUrl, '_blank', 'noopener,noreferrer')}
                >
                  Open API access
                </Button>
              ) : null}
              {recheckButton}
            </>
          ) : undefined
        }
      >
        {mailSendStatus === 'unavailable'
          ? 'Deploy the app package to a SharePoint or Teams site, then return here to approve Mail.Send.'
          : `Graph email delivery needs a one-time tenant admin approval of the ${GRAPH_MAIL_SEND_SCOPE} permission.`}
        <ol style={{ margin: `${tokens.spacingVerticalS} 0 0`, paddingLeft: tokens.spacingHorizontalL }}>
          <li>Deploy the app package (.sppkg) to the tenant App Catalog.</li>
          <li>
            Open SharePoint Admin Center &rarr; <strong>Advanced</strong> &rarr; <strong>API access</strong>.
          </li>
          <li>
            Under <strong>Pending requests</strong>, approve <strong>Microsoft Graph</strong> &rarr;{' '}
            <strong>{GRAPH_MAIL_SEND_SCOPE}</strong> (one-time per tenant).
          </li>
        </ol>
      </AppMessageBar>
    );
  };

  return (
    <div className={styles.list}>
      <AppMessageBar intent={messageBarIntent} title="Email delivery mode">
        {EMAIL_DELIVERY_MODE_DESCRIPTIONS[deliveryMode]}
      </AppMessageBar>

      <div className={styles.numberingCard}>
        <Text weight="semibold" block style={{ marginBottom: tokens.spacingVerticalS }}>
          Default notification delivery
        </Text>
        <Text block className={styles.settingRowDescription} style={{ marginBottom: tokens.spacingVerticalM }}>
          Choose how the app sends workflow notification email. Only the selected channel is used — there is
          no automatic fallback to another provider.
        </Text>
        <RadioGroup
          value={deliveryMode}
          onChange={(_, data) => setDeliveryMode(data.value as EmailDeliveryMode)}
        >
          {DELIVERY_MODES.map((mode) => (
            <Radio
              key={mode}
              value={mode}
              label={
                <span>
                  <Text weight="semibold" block>
                    {EMAIL_DELIVERY_MODE_LABELS[mode]}
                  </Text>
                  <Text block size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    {EMAIL_DELIVERY_MODE_DESCRIPTIONS[mode]}
                  </Text>
                </span>
              }
            />
          ))}
        </RadioGroup>
      </div>

      {deliveryMode === 'chronodatApi' ? (
        <div className={styles.numberingCard}>
          <Text weight="semibold" block style={{ marginBottom: tokens.spacingVerticalS }}>
            <CloudRegular style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Chronodat Mail API (recommended)
          </Text>
          <Text block className={styles.settingRowDescription} style={{ marginBottom: tokens.spacingVerticalM }}>
            Chronodat&rsquo;s hosted mail service sends your workflow notification emails for you. It is the
            simplest option &mdash; the endpoint is built into the app, so there is nothing to deploy,
            approve, or maintain in your tenant.
          </Text>
          <Text weight="semibold" size={200} block style={{ marginBottom: tokens.spacingVerticalXS }}>
            Why choose this
          </Text>
          <ul style={{ margin: 0, paddingLeft: tokens.spacingHorizontalL, color: tokens.colorNeutralForeground2 }}>
            <li>Zero configuration &mdash; no Exchange mailbox, admin consent, or flows.</li>
            <li>Works immediately for every recipient, including external addresses.</li>
            <li>Uses the subject, body, and recipients from your Notification Workflows and Email Templates.</li>
          </ul>
          <Text weight="semibold" size={200} block style={{ margin: `${tokens.spacingVerticalM} 0 ${tokens.spacingVerticalXS}` }}>
            Requirements
          </Text>
          <ul style={{ margin: 0, paddingLeft: tokens.spacingHorizontalL, color: tokens.colorNeutralForeground2 }}>
            <li>An active Chronodat subscription for this tenant.</li>
            <li>Outbound HTTPS access to the Chronodat notification service.</li>
          </ul>
          {!subscriptionApiConfigured ? (
            <AppMessageBar
              intent="warning"
              title="Chronodat Mail API unavailable"
              style={{ marginTop: tokens.spacingVerticalM }}
              actions={
                onNavigateToSubscription ? (
                  <Button appearance="secondary" size="small" onClick={onNavigateToSubscription}>
                    Open Subscription settings
                  </Button>
                ) : undefined
              }
            >
              The Chronodat mail service could not be reached. Verify this tenant has an active subscription,
              then recheck.
            </AppMessageBar>
          ) : (
            <AppMessageBar
              intent="success"
              icon={<CheckmarkCircleRegular />}
              title="This option is good to go"
              style={{ marginTop: tokens.spacingVerticalM }}
            >
              The Chronodat mail service is reachable for this tenant. Workflow emails will send with no
              further setup.
            </AppMessageBar>
          )}
        </div>
      ) : null}

      {deliveryMode === 'graph' ? (
        <div className={styles.numberingCard}>
          <Text weight="semibold" block style={{ marginBottom: tokens.spacingVerticalS }}>
            <MailRegular style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Microsoft Graph {GRAPH_MAIL_SEND_SCOPE} status
          </Text>
          {renderGraphStatus()}
          <Text weight="semibold" size={200} block style={{ margin: `${tokens.spacingVerticalM} 0 ${tokens.spacingVerticalXS}` }}>
            How it works
          </Text>
          <Text block className={styles.settingRowDescription}>
            The app calls Microsoft Graph {GRAPH_MAIL_SEND_SCOPE} to send each email from the signed-in
            user&rsquo;s Exchange Online mailbox. Emails therefore appear in that user&rsquo;s Sent Items and
            send under their identity.
          </Text>
          <Text weight="semibold" size={200} block style={{ margin: `${tokens.spacingVerticalM} 0 ${tokens.spacingVerticalXS}` }}>
            Requirements
          </Text>
          <ul style={{ margin: 0, paddingLeft: tokens.spacingHorizontalL, color: tokens.colorNeutralForeground2 }}>
            <li>The app package deployed to the tenant App Catalog.</li>
            <li>One-time tenant admin approval of the {GRAPH_MAIL_SEND_SCOPE} permission (SharePoint Admin Center &rarr; API access).</li>
            <li>Each sender needs an Exchange Online mailbox license.</li>
          </ul>
        </div>
      ) : null}

      {deliveryMode === 'powerAutomate' ? (
        <div className={styles.numberingCard}>
          <AppMessageBar intent="warning" icon={<WarningRegular />} title="Custom setup required — not shipped with the product">
            Power Automate flows are <strong>not included</strong> with {DEFAULT_APP_TITLE}. To use this
            mode you must build and configure the flows yourself in your own tenant, or{' '}
            <Link href={CHRONODAT_SUPPORT_URL} target="_blank" rel="noopener noreferrer">
              contact Chronodat support
            </Link>{' '}
            for a paid setup engagement. In this mode the app itself does not send any email.
          </AppMessageBar>

          <Field
            label="Notification mailbox (Power Automate)"
            hint="Reference address for your flows. Grant flows Send As on this mailbox."
            style={{ marginTop: tokens.spacingVerticalM }}
          >
            <Input
              value={workflowSettings.notificationMailbox || ''}
              onChange={(_, data) => update({ notificationMailbox: data.value })}
              placeholder="noreply@yourcompany.com"
              type="email"
            />
          </Field>

          {siteUrl ? (
            <Field label="SharePoint site URL (for flow setup)">
              <Input value={siteUrl} readOnly />
            </Field>
          ) : null}
        </div>
      ) : null}

      {deliveryMode === 'powerAutomate' ? (
        <div className={styles.numberingCard}>
          <Text weight="semibold" block style={{ marginBottom: tokens.spacingVerticalS }}>
            <PlugConnectedRegular style={{ verticalAlign: 'middle', marginRight: 6 }} />
            What you would need to build
          </Text>
          <Text block className={styles.settingRowDescription} style={{ marginBottom: tokens.spacingVerticalM }}>
            Reference blueprints are provided under <strong>docs/power-automate/</strong> as a starting
            point only. You are responsible for importing, connecting, testing, and maintaining the
            following flows in your own environment:
          </Text>
          <ul style={{ margin: 0, paddingLeft: tokens.spacingHorizontalL, color: tokens.colorNeutralForeground2 }}>
            <li>Asset lifecycle notifications (create, assign, status, update, comment)</li>
            <li>Overdue asset checker (scheduled recurrence)</li>
            <li>Scheduled reports (reads AppSettings WorkflowSettings JSON)</li>
            <li>Workflow rules engine (notify / assign actions from stored rules)</li>
          </ul>
          <Text block size={200} style={{ marginTop: tokens.spacingVerticalM, color: tokens.colorNeutralForeground3 }}>
            See {POWER_AUTOMATE_DOCS_PATH} in the repo for reference. These guides are unsupported samples,
            not a turnkey feature.
          </Text>
        </div>
      ) : null}

      {deliveryMode === 'powerAutomate' ? (
        <div className={styles.numberingCard}>
          <Text weight="semibold" block style={{ marginBottom: tokens.spacingVerticalS }}>
            <MailRegular style={{ verticalAlign: 'middle', marginRight: 6 }} />
            High-level setup outline
          </Text>
          <ol style={{ margin: 0, paddingLeft: tokens.spacingHorizontalL, color: tokens.colorNeutralForeground2 }}>
            <li>Create a shared mailbox (for example noreply@yourcompany.com).</li>
            <li>Build/import flows and set the site URL to this site.</li>
            <li>Configure each flow to send from the shared mailbox connector.</li>
            <li>Select <strong>Power Automate</strong> as the delivery mode above.</li>
            <li>
              Keep notification workflows enabled &mdash; templates still define subjects, bodies, and
              recipients that your flows read from AppSettings.
            </li>
          </ol>
          <div style={{ display: 'flex', gap: tokens.spacingHorizontalM, flexWrap: 'wrap', marginTop: tokens.spacingVerticalM }}>
            <Link
              href="https://make.powerautomate.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Open Power Automate <OpenRegular fontSize={14} />
            </Link>
            <Link
              href={CHRONODAT_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Contact Chronodat support <OpenRegular fontSize={14} />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
};
