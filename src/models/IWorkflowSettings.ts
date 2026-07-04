export type StatusBucket = 'open' | 'in_progress' | 'mitigation' | 'resolved' | 'closed';

export interface IAssetCustomStatus {
  id: string;
  name: string;
  slug: string;
  color: string;
  sortOrder: number;
  bucket: StatusBucket;
}

export interface IAssetCustomPriority {
  id: string;
  name: string;
  slug: string;
  level: number;
  color: string;
  sortOrder: number;
}

export type NumberingEntityType = 'risk' | 'business' | 'project';
export type NumberingResetFrequency = 'yearly' | 'monthly' | 'daily' | 'never';

export interface INumberingConfig {
  entityType: NumberingEntityType;
  prefix: string;
  separator: string;
  dateFormat: string | null;
  padLength: number;
  enabled: boolean;
  nextValue: number;
  resetFrequency?: NumberingResetFrequency;
  /** Per-period sequence counters when resetFrequency is not never. */
  sequenceCounters?: Record<string, number>;
}

export interface IAssetTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export type NotificationRecipientKey =
  | 'creator'
  | 'assignee'
  | 'owner'
  | 'org_admins'
  | 'org_email';

export interface INotificationWorkflowTemplate {
  enabled: boolean;
  subject: string;
  body: string;
  recipients: NotificationRecipientKey[];
}

export type NotificationWorkflowKey =
  | 'open'
  | 'assignedTo'
  | 'inProgress'
  | 'closed'
  | 'incomplete'
  | 'onHold'
  | 'riskUpdated'
  | 'riskCommentAdded'
  | 'riskOverdue'
  | 'riskPriorityChanged';

export interface IWorkflowCondition {
  field: string;
  operator: string;
  value: string;
}

export interface IWorkflowAction {
  type: string;
  target: string;
  message?: string;
}

export interface IWorkflowRule {
  id: string;
  name: string;
  triggerEvent: string;
  conditions: IWorkflowCondition[];
  actions: IWorkflowAction[];
  isActive: boolean;
}

export interface IEmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  bodyHtml: string;
  description?: string;
  entityType: 'all' | 'risk' | 'business' | 'project';
  variables: string[];
  isActive: boolean;
}

export type ScheduledReportFrequency = 'daily' | 'weekly' | 'monthly';
export type ScheduledReportType = 'risks' | 'business' | 'projects';

/** How workflow notification emails are delivered from the SPFx app. */
export type EmailDeliveryMode = 'graph' | 'powerAutomate' | 'chronodatApi';

export interface IScheduledReport {
  id: string;
  reportType: ScheduledReportType;
  frequency: ScheduledReportFrequency;
  recipients: string[];
  isActive: boolean;
  nextRunAt?: string;
  lastRunAt?: string;
}

export interface IWorkflowSettings {
  customStatuses: IAssetCustomStatus[];
  customPriorities: IAssetCustomPriority[];
  numbering: INumberingConfig[];
  tags: IAssetTag[];
  notificationWorkflows?: Partial<Record<NotificationWorkflowKey, INotificationWorkflowTemplate>>;
  workflowRules?: IWorkflowRule[];
  emailTemplates?: IEmailTemplate[];
  scheduledReports?: IScheduledReport[];
  /** Primary email delivery channel for in-app workflow notifications. */
  emailDeliveryMode?: EmailDeliveryMode;
  /**
   * @deprecated Use emailDeliveryMode. Migrated on read when emailDeliveryMode is unset.
   */
  graphEmailNotificationsEnabled?: boolean;
  /** Shared mailbox reference for Power Automate setup (not used for Graph send). */
  notificationMailbox?: string;
}

export const STATUS_BUCKET_LABELS: Record<StatusBucket, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  mitigation: 'Mitigation',
  resolved: 'Resolved',
  closed: 'Closed'
};

export const STATUS_BUCKETS: StatusBucket[] = [
  'open',
  'in_progress',
  'mitigation',
  'resolved',
  'closed'
];
