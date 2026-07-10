import * as React from 'react';
import { Button } from '@fluentui/react-components';
import { OpenRegular } from '@fluentui/react-icons';
import { HIDDEN_MAIL_SEND_APPROVAL_UI } from '../../constants/graphMailSend';
import type { MailSendApprovalUiStatus } from '../../models/IMailSendApproval';
import { AppMessageBar } from '../Layout/AppMessageBar';

export interface IMailSendPromptBannerProps {
  status: MailSendApprovalUiStatus;
  adminUrl: string;
  isAppAdministrator?: boolean;
}

export const MailSendPromptBanner: React.FC<IMailSendPromptBannerProps> = ({
  status,
  adminUrl,
  isAppAdministrator = false
}) => {
  if (HIDDEN_MAIL_SEND_APPROVAL_UI) {
    return null;
  }

  if (status !== 'pending' && status !== 'unknown') {
    return null;
  }

  const openAdminCenter = (): void => {
    window.open(adminUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AppMessageBar
      intent="warning"
      title="Approve Mail.Send for email notifications"
      style={{ marginBottom: 16 }}
      className="asset-mgmt-no-print"
      actions={
        isAppAdministrator ? (
          <Button appearance="primary" size="small" icon={<OpenRegular />} onClick={openAdminCenter}>
            Open API access
          </Button>
        ) : undefined
      }
    >
      SharePoint list setup is complete, but workflow emails need a one-time tenant approval for
      Microsoft Graph Mail.Send in SharePoint Admin Center → Advanced → API access.
      {!isAppAdministrator
        ? ' Ask a Global or SharePoint administrator to approve this permission.'
        : ' You can approve it now if you have tenant admin rights.'}
    </AppMessageBar>
  );
};
