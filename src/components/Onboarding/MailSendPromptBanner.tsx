import * as React from 'react';
import { Button } from '@fluentui/react-components';
import { OpenRegular } from '@fluentui/react-icons';
import { HIDDEN_MAIL_SEND_APPROVAL_UI } from '../../constants/graphMailSend';
import type { MailSendApprovalUiStatus } from '../../models/IMailSendApproval';
import { AppMessageBar } from '../Layout/AppMessageBar';
import { useTranslation } from '../../i18n/LocaleContext';

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
  const { t } = useTranslation();

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
      title={t('onboarding', 'approveMailSend')}
      style={{ marginBottom: 16 }}
      className="asset-mgmt-no-print"
      actions={
        isAppAdministrator ? (
          <Button appearance="primary" size="small" icon={<OpenRegular />} onClick={openAdminCenter}>
            {t('onboarding', 'openApiAccess')}
          </Button>
        ) : undefined
      }
    >
      {t('onboarding', 'mailSendPromptBody')}
      {!isAppAdministrator
        ? t('onboarding', 'mailSendPromptNonAdminSuffix')
        : t('onboarding', 'mailSendPromptAdminSuffix')}
    </AppMessageBar>
  );
};
