import type { MailSendApprovalStatus } from '../lib/graph-mail-send/status';

/** UI-facing Mail.Send status including loading and missing SPFx factory states. */
export type MailSendApprovalUiStatus = MailSendApprovalStatus | 'checking' | 'unavailable';

export interface IMailSendApprovalState {
  status: MailSendApprovalUiStatus;
  adminUrl: string;
}
