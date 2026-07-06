export type MailSendApprovalStatus = 'approved' | 'pending' | 'unknown';

export function isMailSendConsentRequired(errorText: string): boolean {
  const normalized = errorText.toLowerCase();
  return (
    normalized.includes('sharepoint admin center') ||
    normalized.includes('api access') ||
    normalized.includes('admin consent') ||
    normalized.includes('administrator') ||
    normalized.includes('webapirequest') ||
    (normalized.includes('permission') && normalized.includes('grant')) ||
    (normalized.includes('consent') && normalized.includes('admin'))
  );
}

/** Interpret a lightweight Graph sendMail probe (empty payload) without sending mail. */
export function interpretMailSendProbeResponse(
  statusCode: number,
  errorText = ''
): MailSendApprovalStatus {
  if (statusCode === 400) {
    return 'approved';
  }
  if (statusCode >= 200 && statusCode < 300) {
    return 'approved';
  }
  if (statusCode === 401 || statusCode === 403) {
    return isMailSendConsentRequired(errorText) ? 'pending' : 'unknown';
  }
  return 'unknown';
}
