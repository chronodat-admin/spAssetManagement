import type { EmailDeliveryMode, IWorkflowSettings } from '../../models/IWorkflowSettings';

export type { EmailDeliveryMode };

/** @deprecated Use resolveEmailDeliveryMode — kept for callers migrating from the boolean toggle. */
export function isGraphEmailDeliveryEnabled(workflowSettings?: IWorkflowSettings): boolean {
  return resolveEmailDeliveryMode(workflowSettings) === 'graph';
}

/**
 * Resolves delivery mode from settings, including legacy `graphEmailNotificationsEnabled`.
 */
export function resolveEmailDeliveryMode(workflowSettings?: IWorkflowSettings): EmailDeliveryMode {
  if (workflowSettings?.emailDeliveryMode) {
    return workflowSettings.emailDeliveryMode;
  }
  if (workflowSettings?.graphEmailNotificationsEnabled === false) {
    return 'powerAutomate';
  }
  return 'graph';
}

/** True when the SPFx app should build and send notification email (Graph or Chronodat API). */
export function shouldAppDeliverEmail(workflowSettings?: IWorkflowSettings): boolean {
  const mode = resolveEmailDeliveryMode(workflowSettings);
  return mode === 'graph' || mode === 'chronodatApi';
}

export const EMAIL_DELIVERY_MODE_LABELS: Record<EmailDeliveryMode, string> = {
  graph: 'Microsoft Graph',
  powerAutomate: 'Power Automate',
  chronodatApi: 'Chronodat Mail API'
};

/** Recommended display order for the delivery-mode picker. */
export const EMAIL_DELIVERY_MODE_ORDER: EmailDeliveryMode[] = ['chronodatApi', 'graph', 'powerAutomate'];

export const EMAIL_DELIVERY_MODE_DESCRIPTIONS: Record<EmailDeliveryMode, string> = {
  graph:
    'Send from the signed-in user\u2019s Exchange mailbox via Microsoft Graph Mail.Send. Requires a one-time tenant admin approval of the Mail.Send permission.',
  powerAutomate:
    'Not shipped with the product. You build and configure your own flows (or contact Chronodat support). The app itself does not send email in this mode.',
  chronodatApi:
    'Recommended. Chronodat\u2019s hosted mail service sends notification email for you \u2014 no Exchange mailbox, admin consent, or flow setup. Requires an active Chronodat subscription for this tenant.'
};
