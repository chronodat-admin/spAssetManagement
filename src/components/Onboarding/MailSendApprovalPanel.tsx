import * as React from 'react';
import {
  Button,
  Link,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Text,
  tokens
} from '@fluentui/react-components';
import {
  ArrowClockwiseRegular,
  CheckmarkCircleRegular,
  MailRegular,
  OpenRegular,
  WarningRegular
} from '@fluentui/react-icons';
import { GRAPH_MAIL_SEND_SCOPE, HIDDEN_MAIL_SEND_APPROVAL_UI } from '../../constants/graphMailSend';
import type { MailSendApprovalUiStatus } from '../../models/IMailSendApproval';

export interface IMailSendApprovalPanelProps {
  status: MailSendApprovalUiStatus;
  adminUrl: string;
  variant?: 'default' | 'compact';
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const MailSendApprovalPanel: React.FC<IMailSendApprovalPanelProps> = ({
  status,
  adminUrl,
  variant = 'default',
  onRefresh,
  refreshing = false
}) => {
  if (HIDDEN_MAIL_SEND_APPROVAL_UI) {
    return null;
  }

  const openAdminCenter = (): void => {
    window.open(adminUrl, '_blank', 'noopener,noreferrer');
  };

  if (status === 'checking') {
    if (variant === 'compact') {
      return (
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          <Spinner size="tiny" /> Checking Mail.Send…
        </Text>
      );
    }
    return (
      <MessageBar intent="info" layout="multiline">
        <MessageBarBody>
          <Spinner size="tiny" /> Checking Microsoft Graph {GRAPH_MAIL_SEND_SCOPE} approval…
        </MessageBarBody>
      </MessageBar>
    );
  }

  if (status === 'approved') {
    if (variant === 'compact') {
      return (
        <Text
          size={200}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: tokens.colorPaletteGreenForeground2
          }}
        >
          <CheckmarkCircleRegular fontSize={14} />
          Graph {GRAPH_MAIL_SEND_SCOPE} approved — workflow emails can send.
        </Text>
      );
    }

    return (
      <MessageBar intent="success" layout="multiline">
        <MessageBarBody>
          <MessageBarTitle>Email notifications ready</MessageBarTitle>
          Microsoft Graph {GRAPH_MAIL_SEND_SCOPE} is approved for this tenant. Workflow emails send
          from the signed-in user&rsquo;s Exchange mailbox.
        </MessageBarBody>
        {onRefresh ? (
          <MessageBarActions>
            <Button
              appearance="secondary"
              size="small"
              icon={refreshing ? <Spinner size="tiny" /> : <ArrowClockwiseRegular />}
              disabled={refreshing}
              onClick={onRefresh}
            >
              Recheck
            </Button>
          </MessageBarActions>
        ) : null}
      </MessageBar>
    );
  }

  if (variant === 'compact') {
    return (
      <Text
        size={200}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacingVerticalXS,
          color: tokens.colorNeutralForeground3
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MailRegular fontSize={14} />
          {status === 'pending'
            ? `Approve Graph ${GRAPH_MAIL_SEND_SCOPE} in SharePoint Admin Center.`
            : `Graph ${GRAPH_MAIL_SEND_SCOPE} approval may be required for workflow emails.`}
        </span>
        <Link href={adminUrl} target="_blank" rel="noopener noreferrer">
          Open API access
        </Link>
        {onRefresh ? (
          <Button
            appearance="subtle"
            size="small"
            icon={refreshing ? <Spinner size="tiny" /> : <ArrowClockwiseRegular />}
            disabled={refreshing}
            onClick={onRefresh}
          >
            Recheck
          </Button>
        ) : null}
      </Text>
    );
  }

  const intent = status === 'pending' ? 'warning' : 'info';
  const title =
    status === 'pending'
      ? 'Approve Mail.Send for workflow emails'
      : 'Email notifications need tenant admin approval';

  return (
    <MessageBar intent={intent} layout="multiline" icon={<WarningRegular />}>
      <MessageBarBody>
        <MessageBarTitle>{title}</MessageBarTitle>
        Workflow notification emails use Microsoft Graph {GRAPH_MAIL_SEND_SCOPE}. Site setup can finish
        without this step; only email delivery requires tenant admin approval.
        <div>
          <ol style={{ margin: `${tokens.spacingVerticalS} 0 0`, paddingLeft: tokens.spacingHorizontalL }}>
            <li>Deploy the app package (.sppkg) to the tenant App Catalog.</li>
            <li>
              Open SharePoint Admin Center → <strong>Advanced</strong> → <strong>API access</strong>.
            </li>
            <li>
              On <strong>Pending requests</strong>, select <strong>Microsoft Graph</strong> →{' '}
              <strong>{GRAPH_MAIL_SEND_SCOPE}</strong>, then choose <strong>Approve</strong>.
            </li>
            <li>
              If nothing is pending, check <strong>Approved requests</strong> — approval is one-time per
              tenant.
            </li>
          </ol>
        </div>
        <Text size={200} block style={{ marginTop: tokens.spacingVerticalS }}>
          {status === 'unavailable'
            ? 'Graph is unavailable in this host — deploy the app package to a SharePoint or Teams site first.'
            : 'If you are not a Global or SharePoint administrator, ask your tenant admin to approve Mail.Send.'}
        </Text>
      </MessageBarBody>
      <MessageBarActions>
        <Button appearance="primary" size="small" icon={<OpenRegular />} onClick={openAdminCenter}>
          Open API access
        </Button>
        {onRefresh ? (
          <Button
            appearance="secondary"
            size="small"
            icon={refreshing ? <Spinner size="tiny" /> : <ArrowClockwiseRegular />}
            disabled={refreshing}
            onClick={onRefresh}
          >
            Recheck
          </Button>
        ) : null}
      </MessageBarActions>
    </MessageBar>
  );
};
