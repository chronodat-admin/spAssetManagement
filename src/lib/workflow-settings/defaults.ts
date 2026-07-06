import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents.js';
import type {
  IEmailTemplate,
  INumberingConfig,
  INotificationWorkflowTemplate,
  IAssetCustomPriority,
  IAssetCustomStatus,
  IWorkflowRule,
  IWorkflowSettings,
  NotificationWorkflowKey
} from '../../models/IWorkflowSettings';

export const DEFAULT_CUSTOM_STATUSES: IAssetCustomStatus[] = [
  { id: 'status-open', name: 'Open', slug: 'open', color: '#3B82F6', sortOrder: 0, bucket: 'open' },
  {
    id: 'status-in-progress',
    name: 'In Progress',
    slug: 'in_progress',
    color: '#F59E0B',
    sortOrder: 1,
    bucket: 'open'
  },
  {
    id: 'status-under-review',
    name: 'Under Review',
    slug: 'under_review',
    color: '#8B5CF6',
    sortOrder: 2,
    bucket: 'open'
  },
  {
    id: 'status-mitigating',
    name: 'Mitigating',
    slug: 'mitigating',
    color: '#6366F1',
    sortOrder: 3,
    bucket: 'open'
  },
  {
    id: 'status-resolved',
    name: 'Resolved',
    slug: 'resolved',
    color: '#10B981',
    sortOrder: 4,
    bucket: 'closed'
  },
  {
    id: 'status-closed',
    name: 'Closed',
    slug: 'closed',
    color: '#6B7280',
    sortOrder: 5,
    bucket: 'closed'
  },
  {
    id: 'status-accepted',
    name: 'Accepted',
    slug: 'accepted',
    color: '#14B8A6',
    sortOrder: 6,
    bucket: 'closed'
  },
  {
    id: 'status-transferred',
    name: 'Transferred',
    slug: 'transferred',
    color: '#0EA5E9',
    sortOrder: 7,
    bucket: 'closed'
  }
];

export const DEFAULT_CUSTOM_PRIORITIES: IAssetCustomPriority[] = [
  { id: 'priority-critical', name: 'Critical', slug: 'critical', level: 1, color: '#EF4444', sortOrder: 0 },
  { id: 'priority-high', name: 'High', slug: 'high', level: 2, color: '#F97316', sortOrder: 1 },
  { id: 'priority-medium', name: 'Medium', slug: 'medium', level: 5, color: '#EAB308', sortOrder: 2 },
  { id: 'priority-low', name: 'Low', slug: 'low', level: 7, color: '#3B82F6', sortOrder: 3 },
  {
    id: 'priority-informational',
    name: 'Informational',
    slug: 'informational',
    level: 9,
    color: '#6B7280',
    sortOrder: 4
  }
];

export const DEFAULT_NUMBERING: INumberingConfig[] = [
  {
    entityType: 'risk',
    prefix: 'RISK',
    separator: '-',
    dateFormat: 'YYYY',
    padLength: 4,
    enabled: true,
    nextValue: 1,
    resetFrequency: 'yearly',
    sequenceCounters: {}
  },
  {
    entityType: 'business',
    prefix: 'BIZ',
    separator: '-',
    dateFormat: 'YYYY',
    padLength: 4,
    enabled: false,
    nextValue: 1,
    resetFrequency: 'yearly',
    sequenceCounters: {}
  },
  {
    entityType: 'project',
    prefix: 'PROJ',
    separator: '-',
    dateFormat: 'YYYY',
    padLength: 4,
    enabled: true,
    nextValue: 1,
    resetFrequency: 'yearly',
    sequenceCounters: {}
  }
];

const ASSET_LINK_FOOTER_PLAIN =
  '\n\nTo view the risk details:\n{LinkTitle}\n{AssetUrl}';

const ASSET_LINK_FOOTER_HTML =
  '<p>To view the risk details:<br/><a href="{AssetUrl}">{LinkTitle}</a></p>';

const ASSET_CREATED_BODY_PLAIN = `Asset {AM_AssetId} has been created

Asset name: {Title}
Created By: {CreatedBy}
Summary: {AM_Notes}

Status: {AM_Status}
Category: {RiskCategory}${ASSET_LINK_FOOTER_PLAIN}`;

const ASSET_ASSIGNED_BODY_PLAIN = `Asset {AM_AssetId} has been assigned to you

Asset name: {Title}
Assigned To: {AssignedTo}
Created By: {CreatedBy}

Status: {AM_Status}
Category: {RiskCategory}
Due Date: {DueDate}${ASSET_LINK_FOOTER_PLAIN}`;

const ASSET_UPDATED_BODY_PLAIN = `Asset {AM_AssetId} has been updated

Asset name: {Title}
Updated By: {ModifiedByName}
Summary: {AM_Notes}

Status: {AM_Status}
Category: {RiskCategory}
Priority: {Priority}${ASSET_LINK_FOOTER_PLAIN}`;

const ASSET_CLOSED_BODY_PLAIN = `Asset {AM_AssetId} has been closed

Asset name: {Title}
Closed By: {ModifiedByName}

Status: {AM_Status}
Category: {RiskCategory}${ASSET_LINK_FOOTER_PLAIN}`;

const ASSET_INCOMPLETE_BODY_PLAIN = `Asset {AM_AssetId} requires attention

Asset name: {Title}
Assigned To: {AssignedTo}

Status: {AM_Status}
Category: {RiskCategory}${ASSET_LINK_FOOTER_PLAIN}`;

const ASSET_ON_HOLD_BODY_PLAIN = `Asset {AM_AssetId} is on hold

Asset name: {Title}
Assigned To: {AssignedTo}

Status: {AM_Status}
Category: {RiskCategory}${ASSET_LINK_FOOTER_PLAIN}`;

const ASSET_COMMENT_BODY_PLAIN = `New comment on asset {AM_AssetId}

Asset name: {Title}
Comment By: {ModifiedByName}

Status: {AM_Status}
Category: {RiskCategory}${ASSET_LINK_FOOTER_PLAIN}`;

const ASSET_OVERDUE_BODY_PLAIN = `Asset {AM_AssetId} is OVERDUE

Asset name: {Title}
Assigned To: {AssignedTo}
Due Date: {DueDate}

Status: {AM_Status}
Category: {RiskCategory}${ASSET_LINK_FOOTER_PLAIN}`;

const ASSET_PRIORITY_BODY_PLAIN = `Asset {AM_AssetId} priority has changed

Asset name: {Title}
Priority: {Priority}

Status: {AM_Status}
Category: {RiskCategory}${ASSET_LINK_FOOTER_PLAIN}`;

const ASSET_CREATED_BODY_HTML = `<p><strong>Asset {AM_AssetId} has been created</strong></p>
<p>Asset name: {Title}<br/>Created By: {CreatedBy}<br/>Summary: {AM_Notes}</p>
<p>Status: {AM_Status}<br/>Category: {RiskCategory}</p>${ASSET_LINK_FOOTER_HTML}`;

const ASSET_ASSIGNED_BODY_HTML = `<p><strong>Asset {AM_AssetId} has been assigned to you</strong></p>
<p>Asset name: {Title}<br/>Assigned To: {AssignedTo}<br/>Created By: {CreatedBy}</p>
<p>Status: {AM_Status}<br/>Category: {RiskCategory}<br/>Due Date: {DueDate}</p>${ASSET_LINK_FOOTER_HTML}`;

const ASSET_UPDATED_BODY_HTML = `<p><strong>Asset {AM_AssetId} has been updated</strong></p>
<p>Asset name: {Title}<br/>Updated By: {ModifiedByName}<br/>Summary: {AM_Notes}</p>
<p>Status: {AM_Status}<br/>Category: {RiskCategory}<br/>Priority: {Priority}</p>${ASSET_LINK_FOOTER_HTML}`;

const ASSET_CLOSED_BODY_HTML = `<p><strong>Asset {AM_AssetId} has been closed</strong></p>
<p>Asset name: {Title}<br/>Closed By: {ModifiedByName}</p>
<p>Status: {AM_Status}<br/>Category: {RiskCategory}</p>${ASSET_LINK_FOOTER_HTML}`;

const ASSET_IN_PROGRESS_BODY_HTML = `<p><strong>Asset {AM_AssetId} is now In Progress</strong></p>
<p>Asset name: {Title}<br/>Updated By: {ModifiedByName}<br/>Summary: {AM_Notes}</p>
<p>Status: {AM_Status}<br/>Category: {RiskCategory}<br/>Priority: {Priority}</p>${ASSET_LINK_FOOTER_HTML}`;

const ASSET_INCOMPLETE_BODY_HTML = `<p><strong>Asset {AM_AssetId} requires attention</strong></p>
<p>Asset name: {Title}<br/>Assigned To: {AssignedTo}</p>
<p>Status: {AM_Status}<br/>Category: {RiskCategory}</p>${ASSET_LINK_FOOTER_HTML}`;

const ASSET_ON_HOLD_BODY_HTML = `<p><strong>Asset {AM_AssetId} is on hold</strong></p>
<p>Asset name: {Title}<br/>Assigned To: {AssignedTo}</p>
<p>Status: {AM_Status}<br/>Category: {RiskCategory}</p>${ASSET_LINK_FOOTER_HTML}`;

const ASSET_OVERDUE_BODY_HTML = `<p><strong>Asset {AM_AssetId} is OVERDUE</strong></p>
<p>Asset name: {Title}<br/>Assigned To: {AssignedTo}<br/>Due Date: {DueDate}</p>
<p>Status: {AM_Status}<br/>Category: {RiskCategory}</p>${ASSET_LINK_FOOTER_HTML}`;

const ASSET_COMMENT_BODY_HTML = `<p><strong>New comment on Asset {AM_AssetId}</strong></p>
<p>Asset name: {Title}<br/>Comment By: {ModifiedByName}</p>
<p>Status: {AM_Status}<br/>Category: {RiskCategory}</p>${ASSET_LINK_FOOTER_HTML}`;

const ASSET_PRIORITY_BODY_HTML = `<p><strong>Asset {AM_AssetId} priority has changed</strong></p>
<p>Asset name: {Title}<br/>Priority: {Priority}</p>
<p>Status: {AM_Status}<br/>Category: {RiskCategory}</p>${ASSET_LINK_FOOTER_HTML}`;

export const NOTIFICATION_TEMPLATE_VARIABLES = [
  'AM_AssetId',
  'Title',
  'CreatedBy',
  'CreatedByName',
  'ModifiedByName',
  'AM_Notes',
  'AM_Status',
  'Status',
  'RiskCategory',
  'Category',
  'Priority',
  'AssignedTo',
  'DueDate',
  'LinkTitle',
  'AssetUrl',
  'OrgName'
] as const;

const ASSET_TEMPLATE_VARIABLES = [...NOTIFICATION_TEMPLATE_VARIABLES];

export const DEFAULT_NOTIFICATION_WORKFLOWS: Record<
  NotificationWorkflowKey,
  INotificationWorkflowTemplate
> = {
  open: {
    enabled: true,
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} has been created',
    body: ASSET_CREATED_BODY_PLAIN,
    recipients: ['creator', 'org_email']
  },
  assignedTo: {
    enabled: true,
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} has been assigned to you',
    body: ASSET_ASSIGNED_BODY_PLAIN,
    recipients: ['assignee']
  },
  inProgress: {
    enabled: false,
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} is now In Progress',
    body: `Asset {AM_AssetId} is now In Progress

Asset name: {Title}
Updated By: {ModifiedByName}
Summary: {AM_Notes}

Status: {AM_Status}
Category: {RiskCategory}
Priority: {Priority}${ASSET_LINK_FOOTER_PLAIN}`,
    recipients: ['creator', 'assignee']
  },
  closed: {
    enabled: true,
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} has been closed',
    body: ASSET_CLOSED_BODY_PLAIN,
    recipients: ['creator', 'assignee']
  },
  incomplete: {
    enabled: false,
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} requires attention',
    body: ASSET_INCOMPLETE_BODY_PLAIN,
    recipients: ['assignee']
  },
  onHold: {
    enabled: false,
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} is on hold',
    body: ASSET_ON_HOLD_BODY_PLAIN,
    recipients: ['assignee']
  },
  riskUpdated: {
    enabled: false,
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} has been updated',
    body: ASSET_UPDATED_BODY_PLAIN,
    recipients: ['creator', 'assignee']
  },
  riskCommentAdded: {
    enabled: false,
    subject: DEFAULT_APP_TITLE + ' - New comment on Asset {AM_AssetId}',
    body: ASSET_COMMENT_BODY_PLAIN,
    recipients: ['creator', 'assignee']
  },
  riskOverdue: {
    enabled: true,
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} is OVERDUE',
    body: ASSET_OVERDUE_BODY_PLAIN,
    recipients: ['assignee', 'org_admins']
  },
  riskPriorityChanged: {
    enabled: false,
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} priority has changed',
    body: ASSET_PRIORITY_BODY_PLAIN,
    recipients: ['assignee', 'org_admins']
  }
};

export const DEFAULT_EMAIL_TEMPLATES: IEmailTemplate[] = [
  {
    id: 'email-risk-created',
    name: 'Asset created',
    slug: 'risk_created',
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} has been created',
    bodyHtml: ASSET_CREATED_BODY_HTML,
    description: 'Sent when a new risk is created',
    entityType: 'risk',
    variables: ASSET_TEMPLATE_VARIABLES,
    isActive: true
  },
  {
    id: 'email-risk-updated',
    name: 'Asset updated',
    slug: 'risk_updated',
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} has been updated',
    bodyHtml: ASSET_UPDATED_BODY_HTML,
    description: 'Sent when risk details change',
    entityType: 'risk',
    variables: ASSET_TEMPLATE_VARIABLES,
    isActive: true
  },
  {
    id: 'email-risk-assigned',
    name: 'Asset assigned',
    slug: 'risk_assigned',
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} has been assigned to you',
    bodyHtml: ASSET_ASSIGNED_BODY_HTML,
    description: 'Sent when a risk owner is assigned',
    entityType: 'risk',
    variables: ASSET_TEMPLATE_VARIABLES,
    isActive: true
  },
  {
    id: 'email-risk-in-progress',
    name: 'Asset in progress',
    slug: 'risk_in_progress',
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} is now In Progress',
    bodyHtml: ASSET_IN_PROGRESS_BODY_HTML,
    description: 'Sent when a risk moves to in progress',
    entityType: 'risk',
    variables: ASSET_TEMPLATE_VARIABLES,
    isActive: true
  },
  {
    id: 'email-risk-incomplete',
    name: 'Asset incomplete',
    slug: 'risk_incomplete',
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} requires attention',
    bodyHtml: ASSET_INCOMPLETE_BODY_HTML,
    description: 'Sent when a risk is marked incomplete',
    entityType: 'risk',
    variables: ASSET_TEMPLATE_VARIABLES,
    isActive: true
  },
  {
    id: 'email-risk-on-hold',
    name: 'Asset on hold',
    slug: 'risk_on_hold',
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} is on hold',
    bodyHtml: ASSET_ON_HOLD_BODY_HTML,
    description: 'Sent when a risk is placed on hold',
    entityType: 'risk',
    variables: ASSET_TEMPLATE_VARIABLES,
    isActive: true
  },
  {
    id: 'email-risk-overdue',
    name: 'Asset overdue',
    slug: 'risk_overdue',
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} is OVERDUE',
    bodyHtml: ASSET_OVERDUE_BODY_HTML,
    description: 'Sent when a risk passes its due date',
    entityType: 'risk',
    variables: ASSET_TEMPLATE_VARIABLES,
    isActive: true
  },
  {
    id: 'email-risk-resolved',
    name: 'Asset closed',
    slug: 'risk_resolved',
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} has been closed',
    bodyHtml: ASSET_CLOSED_BODY_HTML,
    description: 'Sent when a risk is closed or resolved',
    entityType: 'risk',
    variables: ASSET_TEMPLATE_VARIABLES,
    isActive: true
  },
  {
    id: 'email-risk-comment',
    name: 'Asset comment',
    slug: 'risk_comment',
    subject: DEFAULT_APP_TITLE + ' - New comment on Asset {AM_AssetId}',
    bodyHtml: ASSET_COMMENT_BODY_HTML,
    description: 'Sent when a comment is added to a risk',
    entityType: 'risk',
    variables: ASSET_TEMPLATE_VARIABLES,
    isActive: true
  },
  {
    id: 'email-risk-priority',
    name: 'Priority changed',
    slug: 'risk_priority_changed',
    subject: DEFAULT_APP_TITLE + ' - Asset {AM_AssetId} priority has changed',
    bodyHtml: ASSET_PRIORITY_BODY_HTML,
    description: 'Sent when likelihood or impact changes the risk priority',
    entityType: 'risk',
    variables: ASSET_TEMPLATE_VARIABLES,
    isActive: true
  }
];

export const DEFAULT_WORKFLOW_RULES: IWorkflowRule[] = [
  {
    id: 'rule-escalate-overdue',
    name: 'Auto-escalate overdue high-impact risks',
    triggerEvent: 'risk_overdue',
    conditions: [{ field: 'consequence', operator: '>=', value: '4' }],
    actions: [
      { type: 'set_field', target: 'priority', message: 'critical' },
      { type: 'notify', target: 'owner', message: 'Risk is overdue with high impact' }
    ],
    isActive: false
  },
  {
    id: 'rule-status-change',
    name: 'Notify owner on status change',
    triggerEvent: 'risk_status_changed',
    conditions: [],
    actions: [{ type: 'notify', target: 'owner', message: 'Risk status changed to {Status}' }],
    isActive: false
  },
  {
    id: 'rule-assignment',
    name: 'Notify assignee on assignment',
    triggerEvent: 'risk_assigned',
    conditions: [],
    actions: [{ type: 'notify', target: 'assignee', message: 'You have been assigned: {Title}' }],
    isActive: false
  }
];

export const DEFAULT_WORKFLOW_SETTINGS: IWorkflowSettings = {
  customStatuses: DEFAULT_CUSTOM_STATUSES,
  customPriorities: DEFAULT_CUSTOM_PRIORITIES,
  numbering: DEFAULT_NUMBERING,
  tags: [],
  notificationWorkflows: DEFAULT_NOTIFICATION_WORKFLOWS,
  workflowRules: DEFAULT_WORKFLOW_RULES,
  emailTemplates: DEFAULT_EMAIL_TEMPLATES.map((item) => ({ ...item })),
  scheduledReports: [],
  emailDeliveryMode: 'graph',
  notificationMailbox: ''
};

export function cloneDefaultWorkflowSettings(): IWorkflowSettings {
  return {
    customStatuses: DEFAULT_CUSTOM_STATUSES.map((item) => ({ ...item })),
    customPriorities: DEFAULT_CUSTOM_PRIORITIES.map((item) => ({ ...item })),
    numbering: DEFAULT_NUMBERING.map((item) => ({
      ...item,
      sequenceCounters: { ...(item.sequenceCounters || {}) }
    })),
    tags: [],
    notificationWorkflows: { ...DEFAULT_NOTIFICATION_WORKFLOWS },
    workflowRules: DEFAULT_WORKFLOW_RULES.map((item) => ({
      ...item,
      conditions: item.conditions.map((c) => ({ ...c })),
      actions: item.actions.map((a) => ({ ...a }))
    })),
    emailTemplates: DEFAULT_EMAIL_TEMPLATES.map((item) => ({ ...item })),
    scheduledReports: [],
    emailDeliveryMode: 'graph',
    notificationMailbox: ''
  };
}
