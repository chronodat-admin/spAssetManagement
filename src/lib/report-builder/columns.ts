import type { IReportColumnDef, ReportDataSource } from '../../models/IReportBuilder';
import type { FormTemplateField } from '../form-templates/types';
import type { AssetFormTemplate } from '../form-templates/types';

export const ASSET_REPORT_COLUMNS: IReportColumnDef[] = [
  { key: 'RiskCode', label: 'Risk Code', type: 'string' },
  { key: 'Title', label: 'Title', type: 'string' },
  { key: 'Status', label: 'Status', type: 'string' },
  { key: 'RiskProfileType', label: 'Risk Profile Type', type: 'string' },
  { key: 'Owner', label: 'Owner', type: 'string' },
  { key: 'AssignedTo', label: 'Assigned To', type: 'string' },
  { key: 'BusinessTitle', label: 'Business', type: 'string' },
  { key: 'ProjectTitle', label: 'Project', type: 'string' },
  { key: 'CategoryTitle', label: 'Category', type: 'string' },
  { key: 'SubCategoryTitle', label: 'Sub Category', type: 'string' },
  { key: 'LikelihoodTitle', label: 'Likelihood', type: 'string' },
  { key: 'LikelihoodRating', label: 'Likelihood Rating', type: 'number' },
  { key: 'ConsequenceTitle', label: 'Consequence', type: 'string' },
  { key: 'ConsequenceRating', label: 'Consequence Rating', type: 'number' },
  { key: 'ResponseTitle', label: 'Response', type: 'string' },
  { key: 'StrategyTitle', label: 'Strategy', type: 'string' },
  { key: 'PotentialLikelihoodTitle', label: 'Residual Likelihood', type: 'string' },
  { key: 'PotentialLikelihoodRating', label: 'Residual Likelihood Rating', type: 'number' },
  { key: 'PotentialConsequenceTitle', label: 'Residual Consequence', type: 'string' },
  { key: 'PotentialConsequenceRating', label: 'Residual Consequence Rating', type: 'number' },
  { key: 'PotentialCost', label: 'Potential Cost', type: 'string' },
  { key: 'DateRiskIdentified', label: 'Date Identified', type: 'date' },
  { key: 'Dates', label: 'Due Date', type: 'date' },
  { key: 'Causes', label: 'Causes', type: 'string' },
  { key: 'Consequences', label: 'Consequences', type: 'string' },
  { key: 'ExistingControls', label: 'Existing Controls', type: 'string' },
  { key: 'ControlEffectiveness', label: 'Control Effectiveness', type: 'string' },
  { key: 'AM_Notes', label: 'Description', type: 'string' },
  { key: 'MitigationPlan', label: 'Mitigation Plan', type: 'string' },
  { key: 'RiskComment', label: 'Risk Comment', type: 'string' },
  { key: 'CreatedByName', label: 'Created By', type: 'string' },
  { key: 'CreatedAt', label: 'Created At', type: 'date' },
  { key: 'ModifiedAt', label: 'Modified At', type: 'date' }
];

export const BUSINESS_REPORT_COLUMNS: IReportColumnDef[] = [
  { key: 'Title', label: 'Title', type: 'string' },
  { key: 'BusinessCode', label: 'Business Code', type: 'string' },
  { key: 'Industry', label: 'Industry', type: 'string' },
  { key: 'GeographicRegion', label: 'Region', type: 'string' },
  { key: 'BusinessCriticality', label: 'Criticality', type: 'string' },
  { key: 'RiskAppetite', label: 'Risk Appetite', type: 'string' },
  { key: 'OwnerTitle', label: 'Owner', type: 'string' },
  { key: 'CreatedAt', label: 'Created At', type: 'date' },
  { key: 'ModifiedAt', label: 'Modified At', type: 'date' }
];

export const PROJECT_REPORT_COLUMNS: IReportColumnDef[] = [
  { key: 'Title', label: 'Title', type: 'string' },
  { key: 'Code', label: 'Project Code', type: 'string' },
  { key: 'BusinessTitle', label: 'Business', type: 'string' },
  { key: 'ProjectType', label: 'Project Type', type: 'string' },
  { key: 'ProjectStatus', label: 'Status', type: 'string' },
  { key: 'Priority', label: 'Priority', type: 'string' },
  { key: 'RiskLevel', label: 'Risk Level', type: 'string' },
  { key: 'StartDate', label: 'Start Date', type: 'date' },
  { key: 'EndDate', label: 'End Date', type: 'date' },
  { key: 'ProjectManagerTitle', label: 'Project Manager', type: 'string' },
  { key: 'CreatedAt', label: 'Created At', type: 'date' },
  { key: 'ModifiedAt', label: 'Modified At', type: 'date' }
];

function fieldTypeToColumnType(fieldType: string): IReportColumnDef['type'] {
  switch (fieldType) {
    case 'number':
    case 'currency':
      return 'number';
    case 'date':
      return 'date';
    case 'checkbox':
      return 'boolean';
    default:
      return 'string';
  }
}

export function getStaticReportColumns(source: ReportDataSource): IReportColumnDef[] {
  if (source === 'risks') {
    return [...ASSET_REPORT_COLUMNS];
  }
  if (source === 'business') {
    return [...BUSINESS_REPORT_COLUMNS];
  }
  return [...PROJECT_REPORT_COLUMNS];
}

export function getCustomColumnsFromTemplates(templates: AssetFormTemplate[]): IReportColumnDef[] {
  const seen = new Set<string>();
  const columns: IReportColumnDef[] = [];

  templates.forEach((template) => {
    if (!template.isActive) {
      return;
    }
    template.fields.forEach((field: FormTemplateField) => {
      if (!field.id || !field.label || seen.has(field.id)) {
        return;
      }
      seen.add(field.id);
      columns.push({
        key: `_custom_${field.id}`,
        label: `${field.label} (Custom)`,
        type: fieldTypeToColumnType(field.type),
        isCustom: true
      });
    });
  });

  return columns;
}

export function getAvailableReportColumns(
  source: ReportDataSource,
  templates: AssetFormTemplate[] = []
): IReportColumnDef[] {
  const base = getStaticReportColumns(source);
  if (source !== 'risks') {
    return base;
  }
  return [...base, ...getCustomColumnsFromTemplates(templates)];
}

export function getDefaultSelectedColumnKeys(columns: IReportColumnDef[]): string[] {
  return columns
    .filter((column) => !column.isCustom)
    .slice(0, 6)
    .map((column) => column.key);
}
