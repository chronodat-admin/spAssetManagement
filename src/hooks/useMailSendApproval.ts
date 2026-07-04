import * as React from 'react';
import type { AadHttpClientFactory } from '@microsoft/sp-http';
import { getSharePointApiAccessAdminUrl } from '../constants/graphMailSend';
import { checkMailSendApproval } from '../services/GraphEmailService';
import type { MailSendApprovalUiStatus } from '../models/IMailSendApproval';

export interface IUseMailSendApprovalOptions {
  webUrl: string;
  aadHttpClientFactory?: AadHttpClientFactory;
  /** Delay the Graph probe until a surface actually needs Mail.Send status. */
  enabled?: boolean;
}

export interface IUseMailSendApprovalResult {
  status: MailSendApprovalUiStatus;
  adminUrl: string;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

export function useMailSendApproval({
  webUrl,
  aadHttpClientFactory,
  enabled = true
}: IUseMailSendApprovalOptions): IUseMailSendApprovalResult {
  const adminUrl = React.useMemo(() => getSharePointApiAccessAdminUrl(webUrl), [webUrl]);
  // The probe always runs so the Email Integration settings tab can report the real
  // Mail.Send approval state. Onboarding banners stay hidden via HIDDEN_MAIL_SEND_APPROVAL_UI,
  // which is enforced inside MailSendApprovalPanel / MailSendPromptBanner, not here.
  const [status, setStatus] = React.useState<MailSendApprovalUiStatus>('checking');
  const [refreshing, setRefreshing] = React.useState(false);

  const refresh = React.useCallback(async (): Promise<void> => {
    if (!aadHttpClientFactory) {
      setStatus('unavailable');
      return;
    }

    setRefreshing(true);
    setStatus((current) => (current === 'approved' ? current : 'checking'));
    try {
      const result = await checkMailSendApproval(aadHttpClientFactory);
      setStatus(result);
    } catch {
      setStatus('unknown');
    } finally {
      setRefreshing(false);
    }
  }, [aadHttpClientFactory]);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  return { status, adminUrl, refreshing, refresh };
}
