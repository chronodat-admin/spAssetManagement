import type { IListFieldDefinition } from '../models/IListDefinitions.js';
import { CATEGORIES_LIST_TITLE } from '../models/IListDefinitions.js';

export const BUSINESS_CRITICALITY_CHOICES = ['High', 'Medium', 'Low'] as const;
export const RISK_APPETITE_CHOICES = ['Conservative', 'Moderate', 'Aggressive'] as const;
export const PROJECT_TYPE_CHOICES = [
  'Strategic',
  'Operational',
  'Compliance',
  'Risk Mitigation',
  'Infrastructure',
  'Research',
  'Other'
] as const;
export const PROJECT_STATUS_CHOICES = [
  'Planning',
  'Active',
  'On Hold',
  'Completed',
  'Cancelled'
] as const;
export const PROJECT_PRIORITY_CHOICES = ['Low', 'Medium', 'High', 'Critical'] as const;
export const PROJECT_RISK_LEVEL_CHOICES = ['Low', 'Medium', 'High', 'Critical'] as const;

export const BUSINESS_LIST_FIELDS: IListFieldDefinition[] = [
  { internalName: 'BusinessCode', displayName: 'Business Code', type: 'Text', optional: true },
  { internalName: 'Description', displayName: 'Description', type: 'Note', optional: true },
  { internalName: 'Industry', displayName: 'Industry', type: 'Text', optional: true },
  { internalName: 'GeographicRegion', displayName: 'Geographic Region', type: 'Text', optional: true },
  {
    internalName: 'Owner',
    displayName: 'Owner',
    type: 'User',
    optional: true,
    userSelectionMode: 'PeopleAndGroups'
  },
  {
    internalName: 'RegulatoryEnvironment',
    displayName: 'Regulatory Environment',
    type: 'Text',
    optional: true
  },
  {
    internalName: 'BusinessCriticality',
    displayName: 'Business Criticality',
    type: 'Choice',
    choices: [...BUSINESS_CRITICALITY_CHOICES],
    optional: true
  },
  {
    internalName: 'RiskAppetite',
    displayName: 'Risk Appetite',
    type: 'Choice',
    choices: [...RISK_APPETITE_CHOICES],
    optional: true
  },
  { internalName: 'BudgetRange', displayName: 'Budget Range', type: 'Text', optional: true },
  { internalName: 'KeyStakeholders', displayName: 'Key Stakeholders', type: 'Note', optional: true },
  {
    internalName: 'StrategicObjectives',
    displayName: 'Strategic Objectives',
    type: 'Note',
    optional: true
  },
  {
    internalName: 'ComplianceRequirements',
    displayName: 'Compliance Requirements',
    type: 'Note',
    optional: true
  }
];

export const PROJECT_LIST_FIELDS: IListFieldDefinition[] = [
  {
    internalName: 'Business',
    displayName: 'Business',
    type: 'Lookup',
    lookupListTitle: CATEGORIES_LIST_TITLE,
    lookupField: 'Title',
    optional: true
  },
  { internalName: 'Code', displayName: 'Project Code', type: 'Text', optional: true },
  { internalName: 'Description', displayName: 'Description', type: 'Note', optional: true },
  {
    internalName: 'ProjectStatus',
    displayName: 'Project Status',
    type: 'Choice',
    choices: [...PROJECT_STATUS_CHOICES],
    defaultValue: 'Active',
    optional: true
  },
  {
    internalName: 'ProjectType',
    displayName: 'Project Type',
    type: 'Choice',
    choices: [...PROJECT_TYPE_CHOICES],
    optional: true
  },
  {
    internalName: 'Priority',
    displayName: 'Priority',
    type: 'Choice',
    choices: [...PROJECT_PRIORITY_CHOICES],
    optional: true
  },
  {
    internalName: 'RiskLevel',
    displayName: 'Risk Level',
    type: 'Choice',
    choices: [...PROJECT_RISK_LEVEL_CHOICES],
    optional: true
  },
  {
    internalName: 'StartDate',
    displayName: 'Start Date',
    type: 'DateTime',
    format: 'DateOnly',
    optional: true
  },
  {
    internalName: 'EndDate',
    displayName: 'End Date',
    type: 'DateTime',
    format: 'DateOnly',
    optional: true
  },
  { internalName: 'Budget', displayName: 'Budget', type: 'Number', optional: true },
  { internalName: 'ActualCost', displayName: 'Actual Cost', type: 'Number', optional: true },
  {
    internalName: 'Owner',
    displayName: 'Owner',
    type: 'User',
    optional: true,
    userSelectionMode: 'PeopleAndGroups'
  },
  {
    internalName: 'ProjectManager',
    displayName: 'Project Manager',
    type: 'User',
    optional: true,
    userSelectionMode: 'PeopleAndGroups'
  },
  {
    internalName: 'Sponsor',
    displayName: 'Sponsor',
    type: 'User',
    optional: true,
    userSelectionMode: 'PeopleAndGroups'
  },
  { internalName: 'Stakeholders', displayName: 'Stakeholders', type: 'Note', optional: true },
  { internalName: 'Objectives', displayName: 'Objectives', type: 'Note', optional: true },
  { internalName: 'Deliverables', displayName: 'Deliverables', type: 'Note', optional: true },
  { internalName: 'SuccessCriteria', displayName: 'Success Criteria', type: 'Note', optional: true },
  { internalName: 'RiskAssessment', displayName: 'Risk Assessment', type: 'Note', optional: true },
  {
    internalName: 'MitigationStrategies',
    displayName: 'Mitigation Strategies',
    type: 'Note',
    optional: true
  },
  {
    internalName: 'ComplianceRequirements',
    displayName: 'Compliance Requirements',
    type: 'Note',
    optional: true
  },
  {
    internalName: 'RegulatoryEnvironment',
    displayName: 'Regulatory Environment',
    type: 'Text',
    optional: true
  },
  { internalName: 'GeographicScope', displayName: 'Geographic Scope', type: 'Text', optional: true },
  { internalName: 'TechnologyStack', displayName: 'Technology Stack', type: 'Text', optional: true },
  { internalName: 'Dependencies', displayName: 'Dependencies', type: 'Note', optional: true },
  { internalName: 'Assumptions', displayName: 'Assumptions', type: 'Note', optional: true },
  { internalName: 'Constraints', displayName: 'Constraints', type: 'Note', optional: true },
  { internalName: 'LessonsLearned', displayName: 'Lessons Learned', type: 'Note', optional: true }
];
