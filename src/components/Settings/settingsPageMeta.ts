import * as React from 'react';
import {
  AlertRegular,
  ArrowReplyRegular,
  ArrowUploadRegular,
  CalendarClockRegular,
  CloudSyncRegular,
  ColorRegular,
  DataHistogramRegular,
  DataTrendingRegular,
  DocumentRegular,
  FlashRegular,
  FlowchartRegular,
  FormRegular,
  GlobeRegular,
  HistoryRegular,
  ListRegular,
  MailRegular,
  NumberSymbolRegular,
  OrganizationRegular,
  PaymentRegular,
  PeopleTeamRegular,
  PersonRegular,
  PlugConnectedRegular,
  SettingsRegular,
  ShieldLockRegular,
  ShieldRegular,
  TagRegular,
  TextBulletListSquareRegular,
  WarningRegular
} from '@fluentui/react-icons';

export type SettingsPageId =
  | 'general'
  | 'appearance'
  | 'dashboard'
  | 'forms'
  | 'formTemplates'
  | 'riskStatusPriority'
  | 'compliance'
  | 'subscription'
  | 'dropdownOptions'
  | 'numbering'
  | 'tags'
  | 'notificationWorkflows'
  | 'emailIntegration'
  | 'workflowRules'
  | 'emailTemplates'
  | 'scheduledReports'
  | 'auditLog'
  | 'appAdministrators'
  | 'userRoles'
  | 'rolePermissions'
  | 'intuneSync'
  | 'bulkImport'
  | 'language'
  | 'reminders'
  | 'lookupCategories'
  | 'lookupSubCategories'
  | 'lookupLikelihood'
  | 'lookupConsequences'
  | 'lookupRiskProfile'
  | 'lookupRiskResponse'
  | 'lookupRiskStrategy';

export interface ISettingsPageMeta {
  id: SettingsPageId;
  label: string;
  description: string;
  icon: React.ElementType;
  section: 'general' | 'preferences' | 'lookups';
}

export const SETTINGS_PAGES: ISettingsPageMeta[] = [
  {
    id: 'general',
    label: 'General',
    description: 'App display name and links shown in the application header.',
    icon: SettingsRegular,
    section: 'general'
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Customize colors, navigation bar, sidebar, buttons, tabs, and layout density.',
    icon: ColorRegular,
    section: 'general'
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Customize dashboard naming, summary cards, and chart behavior.',
    icon: DataHistogramRegular,
    section: 'general'
  },
  {
    id: 'forms',
    label: 'Forms',
    description: 'Configure field visibility for each entity.',
    icon: FormRegular,
    section: 'general'
  },
  {
    id: 'formTemplates',
    label: 'Form Templates',
    description:
      'Create custom form templates for asset categories. Linked templates add fields when creating or editing assets.',
    icon: DocumentRegular,
    section: 'general'
  },
  {
    id: 'riskStatusPriority',
    label: 'Asset Status',
    description: 'Define custom asset statuses and workflow labels used across lists and the dashboard.',
    icon: ListRegular,
    section: 'general'
  },
  {
    id: 'compliance',
    label: 'Compliance',
    description: 'Enable built-in compliance frameworks and manage which appear in assessments.',
    icon: ShieldRegular,
    section: 'general'
  },
  {
    id: 'subscription',
    label: 'Subscription',
    description: 'Manage your 14-day free trial and yearly subscription for this SharePoint site.',
    icon: PaymentRegular,
    section: 'general'
  },
  {
    id: 'appAdministrators',
    label: 'App Administrators',
    description:
      'Manage who can open Settings and update application configuration. The user who runs setup or adds this web part is added automatically.',
    icon: PersonRegular,
    section: 'general'
  },
  {
    id: 'userRoles',
    label: 'User Roles',
    description: 'Assign Admin, Asset Manager, User, or Read Only roles for RBAC across the app.',
    icon: PeopleTeamRegular,
    section: 'general'
  },
  {
    id: 'rolePermissions',
    label: 'Role Permissions',
    description:
      'Control what each application role can see and do in the UI. SharePoint list permissions remain the security boundary for data access.',
    icon: ShieldLockRegular,
    section: 'general'
  },
  {
    id: 'language',
    label: 'Language',
    description: 'Choose the display language for navigation and Tier 1 features.',
    icon: GlobeRegular,
    section: 'general'
  },
  {
    id: 'intuneSync',
    label: 'Intune Sync',
    description: 'Import managed devices from Microsoft Intune into the asset register.',
    icon: CloudSyncRegular,
    section: 'general'
  },
  {
    id: 'bulkImport',
    label: 'Bulk Import',
    description: 'Import assets from CSV into the register.',
    icon: ArrowUploadRegular,
    section: 'general'
  },
  {
    id: 'reminders',
    label: 'Reminders',
    description: 'Run warranty, license, and return-date reminder checks and email digests.',
    icon: AlertRegular,
    section: 'preferences'
  },
  {
    id: 'dropdownOptions',
    label: 'Dropdown Options',
    description:
      'Manage choice dropdown values on asset forms (for example depreciation method). Status choices live under Asset Status; asset type, category, and vendor values come from lookup lists.',
    icon: TextBulletListSquareRegular,
    section: 'preferences'
  },
  {
    id: 'numbering',
    label: 'Numbering',
    description:
      'Configure auto-numbering formats for assets, vendors, and projects. Sequence values increment on each create.',
    icon: NumberSymbolRegular,
    section: 'preferences'
  },
  {
    id: 'tags',
    label: 'Tags',
    description: 'Create and manage tags to categorize and filter assets.',
    icon: TagRegular,
    section: 'preferences'
  },
  {
    id: 'emailIntegration',
    label: 'Email Integration',
    description:
      'Choose Microsoft Graph, Power Automate, or Chronodat API for notification delivery.',
    icon: PlugConnectedRegular,
    section: 'preferences'
  },
  {
    id: 'notificationWorkflows',
    label: 'Notification Workflows',
    description:
      'Configure email templates and recipients for asset lifecycle events. Placeholders: {AM_AssetId}, {Title}, {CreatedBy}, {AM_Notes}, {AM_Status}, {Category}, {LinkTitle}, {AssetUrl}, and more.',
    icon: FlowchartRegular,
    section: 'preferences'
  },
  {
    id: 'workflowRules',
    label: 'Workflow Rules',
    description:
      'Automate actions when assets are created, updated, or become overdue. Execution requires Power Automate or a backend hook.',
    icon: FlashRegular,
    section: 'preferences'
  },
  {
    id: 'emailTemplates',
    label: 'Email Templates',
    description:
      'Reusable HTML templates for notifications. Variables: {AM_AssetId}, {Title}, {CreatedBy}, {AM_Notes}, {AM_Status}, {Category}, {LinkTitle}, {AssetUrl}, {AssignedTo}, {DueDate}, {OrgName}.',
    icon: MailRegular,
    section: 'preferences'
  },
  {
    id: 'scheduledReports',
    label: 'Scheduled Reports',
    description:
      'Configure automatic report delivery. A scheduled job or Power Automate flow must read these settings to send reports.',
    icon: CalendarClockRegular,
    section: 'preferences'
  },
  {
    id: 'auditLog',
    label: 'Audit Log',
    description:
      'Review create, update, and delete activity across assets, lookup lists, settings, and compliance.',
    icon: HistoryRegular,
    section: 'preferences'
  },
  {
    id: 'lookupCategories',
    label: 'Asset Categories',
    description: 'Manage categories used when classifying assets in the register.',
    icon: TagRegular,
    section: 'lookups'
  },
  {
    id: 'lookupSubCategories',
    label: 'Sub-Categories',
    description: 'Manage sub-categories linked to parent asset categories.',
    icon: TagRegular,
    section: 'lookups'
  },
  {
    id: 'lookupLikelihood',
    label: 'Likelihood Scale',
    description: 'Legacy rating scale from the risk-management template. Hidden in asset-only deployments.',
    icon: DataTrendingRegular,
    section: 'lookups'
  },
  {
    id: 'lookupConsequences',
    label: 'Consequence Scale',
    description: 'Legacy rating scale from the risk-management template. Hidden in asset-only deployments.',
    icon: WarningRegular,
    section: 'lookups'
  },
  {
    id: 'lookupRiskProfile',
    label: 'Profile Types',
    description: 'Legacy lookup list from the risk-management template. Hidden in asset-only deployments.',
    icon: DataHistogramRegular,
    section: 'lookups'
  },
  {
    id: 'lookupRiskResponse',
    label: 'Response Strategies',
    description: 'Legacy lookup list from the risk-management template. Hidden in asset-only deployments.',
    icon: ArrowReplyRegular,
    section: 'lookups'
  },
  {
    id: 'lookupRiskStrategy',
    label: 'Treatment Strategies',
    description: 'Legacy lookup list from the risk-management template. Hidden in asset-only deployments.',
    icon: OrganizationRegular,
    section: 'lookups'
  }
];

export const SETTINGS_PAGE_BY_ID: Record<SettingsPageId, ISettingsPageMeta> = SETTINGS_PAGES.reduce(
  (acc, page) => {
    acc[page.id] = page;
    return acc;
  },
  {} as Record<SettingsPageId, ISettingsPageMeta>
);

export const SETTINGS_SELF_SAVE_PAGES: SettingsPageId[] = [
  'formTemplates',
  'compliance',
  'subscription',
  'auditLog',
  'appAdministrators',
  'userRoles',
  'rolePermissions',
  'intuneSync',
  'bulkImport',
  'language',
  'reminders',
  'scheduledReports',
  'workflowRules',
  'lookupCategories',
  'lookupSubCategories',
  'lookupLikelihood',
  'lookupConsequences',
  'lookupRiskProfile',
  'lookupRiskResponse',
  'lookupRiskStrategy'
];

export const SETTINGS_LOOKUP_PAGES: SettingsPageId[] = [
  'lookupCategories',
  'lookupSubCategories',
  'lookupLikelihood',
  'lookupConsequences',
  'lookupRiskProfile',
  'lookupRiskResponse',
  'lookupRiskStrategy'
];

export function isSettingsLookupPage(page: SettingsPageId): boolean {
  return SETTINGS_LOOKUP_PAGES.includes(page);
}
