import type { AadHttpClientFactory } from '@microsoft/sp-http';
import type { IAsset, ISoftwareLicense } from '../models/IAsset';
import type { IWorkflowSettings } from '../models/IWorkflowSettings';
import { sendMailViaMicrosoftGraph } from './GraphEmailService';
import { DEFAULT_APP_TITLE } from '../constants/spfxComponents';

export interface IReminderItem {
  type: 'warranty' | 'license' | 'return';
  title: string;
  detail: string;
  recipientEmail?: string;
  dueDate?: string;
}

export interface IReminderRunResult {
  checked: number;
  sent: number;
  items: IReminderItem[];
}

const WARRANTY_DAYS_AHEAD = 30;
const LICENSE_DAYS_AHEAD = 30;

function daysUntil(dateValue?: string): number | undefined {
  if (!dateValue) return undefined;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return Math.ceil((parsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export class ReminderRunnerService {
  public evaluateReminders(
    assets: IAsset[],
    licenses: ISoftwareLicense[],
    assignments: Array<{
      AM_ExpectedReturnDate?: string;
      AM_AssignedTo?: { Email?: string };
      AM_Asset?: { Title?: string };
    }>
  ): IReminderItem[] {
    const items: IReminderItem[] = [];

    for (const asset of assets) {
      if (asset.AM_IsDeleted) continue;
      const warrantyDays = daysUntil(asset.AM_WarrantyExpiry);
      if (warrantyDays !== undefined && warrantyDays >= 0 && warrantyDays <= WARRANTY_DAYS_AHEAD) {
        items.push({
          type: 'warranty',
          title: asset.Title,
          detail: `Warranty expires in ${warrantyDays} day(s)`,
          dueDate: asset.AM_WarrantyExpiry
        });
      }
    }

    for (const license of licenses) {
      if (license.AM_IsActive === false) continue;
      const expiryDays = daysUntil(license.AM_ExpiryDate);
      if (expiryDays !== undefined && expiryDays >= 0 && expiryDays <= LICENSE_DAYS_AHEAD) {
        items.push({
          type: 'license',
          title: license.AM_ProductName || license.Title,
          detail: `License expires in ${expiryDays} day(s)`,
          dueDate: license.AM_ExpiryDate
        });
      }
    }

    for (const assignment of assignments) {
      const returnDays = daysUntil(assignment.AM_ExpectedReturnDate);
      if (returnDays !== undefined && returnDays < 0) {
        items.push({
          type: 'return',
          title: assignment.AM_Asset?.Title || 'Asset',
          detail: `Return overdue by ${Math.abs(returnDays)} day(s)`,
          recipientEmail: assignment.AM_AssignedTo?.Email,
          dueDate: assignment.AM_ExpectedReturnDate
        });
      }
    }

    return items;
  }

  public async sendReminderDigest(
    aadHttpClientFactory: AadHttpClientFactory,
    recipients: string[],
    items: IReminderItem[],
    workflowSettings?: IWorkflowSettings
  ): Promise<number> {
    if (!workflowSettings?.graphEmailNotificationsEnabled || recipients.length === 0 || items.length === 0) {
      return 0;
    }

    const lines = items.map((item) => `• [${item.type}] ${item.title}: ${item.detail}`);
    const body = `${DEFAULT_APP_TITLE} reminders:\n\n${lines.join('\n')}`;
    await sendMailViaMicrosoftGraph(
      aadHttpClientFactory,
      recipients,
      `${DEFAULT_APP_TITLE} — ${items.length} reminder(s)`,
      body
    );
    return recipients.length;
  }
}
