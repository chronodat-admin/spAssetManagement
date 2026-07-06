import type { IAsset } from '../../models/IAssetApp';
import type {
  INotificationWorkflowTemplate,
  NotificationRecipientKey,
  NotificationWorkflowKey,
  StatusBucket
} from '../../models/IWorkflowSettings';

export interface IAssetNotificationUpdateInput {
  Title: string;
  AM_Status: string;
  AssignedToUserIds?: number[];
  Likelihood: string;
  Consequence: string;
  AM_Notes?: string;
  MitigationPlan?: string;
  Causes?: string;
  RiskConsequences?: string;
  ExistingControls?: string;
  potentialcost?: string;
  RiskDueDate?: string;
  DateRiskIdentified?: string;
  Implementationreviewdate?: string;
  RiskCategoryId: number;
  RiskSubCategoryId?: number | null;
  riskBusinessId: number;
  RiskProjectId?: number | null;
  RiskProfileTypeId: number;
  RiskResponseId?: number | null;
  RiskStrategyId?: number | null;
}

export interface IRecipientResolveContext {
  adminEmails?: string[];
  currentUserEmail?: string;
  supportGroup?: string;
}

export type NotificationSkipReason = 'workflow_disabled' | 'no_recipients' | 'missing_template';

export interface INotificationDispatchPlan {
  eventKey: NotificationWorkflowKey;
  subject: string;
  body: string;
  recipients: string[];
  skipped?: NotificationSkipReason;
}

export function filterValidEmailRecipients(addresses: string[]): string[] {
  return Array.from(
    new Set(
      addresses
        .map((address) => address.trim())
        .filter((address) => address.length > 0 && address.includes('@'))
    )
  );
}

export function resolveLegacyWorkflowEnabled(
  legacyNote: string | undefined,
  defaultEnabled: boolean
): boolean {
  return legacyNote ? legacyNote === 'Yes' : defaultEnabled;
}

function normalizeAssigneeIds(ids?: number[]): string {
  return [...(ids || [])].sort((a, b) => a - b).join(',');
}

function assigneeIdsEqual(left?: number[], right?: number[]): boolean {
  return normalizeAssigneeIds(left) === normalizeAssigneeIds(right);
}

function getNotificationStatusBucket(statusName: string | undefined): StatusBucket {
  const name = (statusName || 'Open').trim();
  const lower = name.toLowerCase();

  if (lower === 'closed' || lower === 'resolved' || lower === 'accepted' || lower === 'transferred') {
    return 'closed';
  }
  if (
    lower === 'in progress' ||
    lower === 'mitigating' ||
    lower === 'under review' ||
    lower === 'mitigation'
  ) {
    return 'in_progress';
  }
  return 'open';
}

export function resolveStatusNotificationKey(status: string): NotificationWorkflowKey | undefined {
  const normalized = status.trim().toLowerCase();
  if (normalized.includes('incomplete')) {
    return 'incomplete';
  }
  if (normalized.includes('hold')) {
    return 'onHold';
  }

  const bucket = getNotificationStatusBucket(status);
  if (bucket === 'closed' || bucket === 'resolved') {
    return 'closed';
  }
  if (bucket === 'in_progress' || bucket === 'mitigation') {
    return 'inProgress';
  }
  return undefined;
}

export function hasRiskGeneralFieldChanges(
  previous: IAsset,
  input: IAssetNotificationUpdateInput
): boolean {
  const compare = (left?: string | null, right?: string | null | undefined): boolean =>
    (left || '').trim() !== (right || '').trim();

  return (
    compare(previous.Title, input.Title) ||
    compare(previous.AM_Notes, input.AM_Notes) ||
    compare(previous.MitigationPlan, input.MitigationPlan) ||
    compare(previous.Causes, input.Causes) ||
    compare(previous.RiskConsequences, input.RiskConsequences) ||
    compare(previous.ExistingControls, input.ExistingControls) ||
    compare(previous.potentialcost, input.potentialcost) ||
    compare(previous.RiskDueDate, input.RiskDueDate) ||
    compare(previous.DateRiskIdentified, input.DateRiskIdentified) ||
    compare(previous.Implementationreviewdate, input.Implementationreviewdate) ||
    previous.RiskCategory?.Id !== input.RiskCategoryId ||
    (previous.RiskSubCategory?.Id ?? null) !== (input.RiskSubCategoryId ?? null) ||
    previous.riskBusiness?.Id !== input.riskBusinessId ||
    (previous.RiskProject?.Id ?? null) !== (input.RiskProjectId ?? null) ||
    previous.RiskProfileType?.Id !== input.RiskProfileTypeId ||
    (previous.RiskResponse?.Id ?? null) !== (input.RiskResponseId ?? null) ||
    (previous.RiskStrategy?.Id ?? null) !== (input.RiskStrategyId ?? null)
  );
}

export function selectRiskUpdateNotificationEvents(
  previous: IAsset | undefined,
  input: IAssetNotificationUpdateInput,
  riskUpdatedEnabled: boolean
): NotificationWorkflowKey[] {
  if (!previous) {
    return [];
  }

  const events: NotificationWorkflowKey[] = [];

  if (!assigneeIdsEqual(
    (previous.AssignedTo || []).map((user) => user.Id),
    input.AssignedToUserIds
  )) {
    events.push('assignedTo');
  }

  if (previous.AM_Status !== input.AM_Status) {
    const statusEvent = resolveStatusNotificationKey(input.AM_Status);
    if (statusEvent) {
      events.push(statusEvent);
    }
  }

  if (previous.Likelihood !== input.Likelihood || previous.Consequence !== input.Consequence) {
    events.push('riskPriorityChanged');
  }

  if (hasRiskGeneralFieldChanges(previous, input) && events.length === 0) {
    events.push('riskUpdated');
  } else if (
    hasRiskGeneralFieldChanges(previous, input) &&
    !events.includes('riskUpdated') &&
    riskUpdatedEnabled
  ) {
    events.push('riskUpdated');
  }

  return events;
}

export function resolveNotificationRecipientEmails(
  keys: NotificationRecipientKey[],
  risk: IAsset,
  context: IRecipientResolveContext = {}
): string[] {
  const emails = new Set<string>();
  const adminEmails = context.adminEmails || [];
  const currentUserEmail = context.currentUserEmail?.trim();
  const supportGroup = context.supportGroup?.trim();

  for (const key of keys) {
    switch (key) {
      case 'creator': {
        const creatorEmail = risk.Author?.Email?.trim();
        if (creatorEmail && creatorEmail.includes('@')) {
          emails.add(creatorEmail);
        } else if (currentUserEmail && currentUserEmail.includes('@')) {
          emails.add(currentUserEmail);
        }
        break;
      }
      case 'assignee':
      case 'owner': {
        (risk.AssignedTo || []).forEach((user) => {
          const email = user.Email?.trim();
          if (email && email.includes('@')) {
            emails.add(email);
          }
        });
        break;
      }
      case 'org_admins': {
        adminEmails.forEach((email) => {
          const trimmed = email.trim();
          if (trimmed.includes('@')) {
            emails.add(trimmed);
          }
        });
        break;
      }
      case 'org_email': {
        if (supportGroup && supportGroup.includes('@')) {
          emails.add(supportGroup);
        }
        break;
      }
      default:
        break;
    }
  }

  return filterValidEmailRecipients(Array.from(emails));
}

export function planNotificationDispatch(
  eventKey: NotificationWorkflowKey,
  template: INotificationWorkflowTemplate | undefined,
  subject: string,
  body: string,
  recipients: string[]
): INotificationDispatchPlan {
  if (!template) {
    return {
      eventKey,
      subject,
      body,
      recipients: [],
      skipped: 'missing_template'
    };
  }

  if (!template.enabled) {
    return {
      eventKey,
      subject,
      body,
      recipients: [],
      skipped: 'workflow_disabled'
    };
  }

  const validRecipients = filterValidEmailRecipients(recipients);
  if (validRecipients.length === 0) {
    return {
      eventKey,
      subject,
      body,
      recipients: [],
      skipped: 'no_recipients'
    };
  }

  return {
    eventKey,
    subject,
    body,
    recipients: validRecipients
  };
}
