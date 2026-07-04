import { SPHttpClient } from '@microsoft/sp-http';

import { PROJECTS_LIST_TITLE } from '../models/IListDefinitions';
import type { IReportColumnDef, ReportDataSource, ReportRow } from '../models/IReportBuilder';
import type { IAsset, ILookupValue, IUserValue } from '../models/IAsset';
import type { AssetFormTemplate } from '../lib/form-templates/types';
import { getAvailableReportColumns } from '../lib/report-builder/columns';
import { parseChoiceScore } from '../utils/priorityCalculator';
import { AssetService } from './AssetService';
import { SharePointRestService } from './SharePointRestService';

function joinUserTitles(users?: Array<{ Title?: string }>): string {
  if (!users?.length) {
    return '';
  }
  return users.map((user) => user.Title || '').filter(Boolean).join('; ');
}

function parseTemplateDataJson(templateData?: string): Record<string, unknown> {
  if (!templateData?.trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(templateData) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* ignore malformed template data */
  }
  return {};
}

function formatCustomFieldValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => formatCustomFieldValue(entry)).join('; ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.Title === 'string') {
      return record.Title;
    }
    if (typeof record.label === 'string') {
      return record.label;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

/** Legacy risk report columns still emitted by report builder (optional on asset rows). */
type IReportAssetRow = IAsset & {
  RiskProfileType?: ILookupValue;
  AssignedTo?: IUserValue | IUserValue[];
  riskBusiness?: ILookupValue;
  RiskProject?: ILookupValue;
  ProjectName?: string;
  RiskCategory?: ILookupValue;
  RiskSubCategory?: ILookupValue;
  Likelihood?: string;
  Consequence?: string;
  RiskResponse?: ILookupValue;
  RiskStrategy?: ILookupValue;
  PotentialLikelihood?: string;
  PotentialConsequence?: string;
  potentialcost?: string | number;
  DateRiskIdentified?: string;
  RiskDueDate?: string;
  Causes?: string;
  RiskConsequences?: string;
  ExistingControls?: string;
  Assesstheeffectivenessofcontrols?: string;
  MitigationPlan?: string;
  RiskComment?: string;
  TemplateData?: string;
};

export class ReportBuilderService {
  private readonly riskService: AssetService;
  private readonly rest: SharePointRestService;

  public constructor(spHttpClient: SPHttpClient, webUrl: string) {
    this.riskService = new AssetService(spHttpClient, webUrl);
    this.rest = new SharePointRestService(spHttpClient, webUrl);
  }

  public async getAvailableColumns(source: ReportDataSource): Promise<IReportColumnDef[]> {
    let templates: AssetFormTemplate[] = [];
    if (source === 'risks') {
      try {
        templates = await this.riskService.getFormTemplates();
      } catch (error) {
        // FormTemplates is created on demand. Report Builder should still expose
        // the standard risk columns when the optional template list is absent.
        console.warn('Report Builder custom form templates could not be loaded.', error);
      }
    }
    return getAvailableReportColumns(source, templates);
  }

  public async fetchReportData(
    source: ReportDataSource,
    selectedColumnKeys: string[]
  ): Promise<ReportRow[]> {
    switch (source) {
      case 'risks':
        return this.fetchRiskRows(selectedColumnKeys);
      case 'business':
        return this.fetchBusinessRows();
      case 'projects':
        return this.fetchProjectRows();
      default:
        return [];
    }
  }

  private mapRiskToRow(risk: IAsset, customColumnKeys: string[]): ReportRow {
    const row = risk as IReportAssetRow;
    const reportRow: ReportRow = {
      RiskCode: row.AM_AssetId ?? '',
      Title: row.Title,
      Status: typeof row.AM_Status === 'object' ? row.AM_Status?.Title ?? '' : row.AM_Status ?? '',
      RiskProfileType: row.RiskProfileType?.Title ?? '',
      Owner: joinUserTitles(Array.isArray(row.AssignedTo) ? row.AssignedTo : row.AssignedTo ? [row.AssignedTo] : row.AM_AssignedTo ? [row.AM_AssignedTo] : undefined),
      AssignedTo: joinUserTitles(Array.isArray(row.AssignedTo) ? row.AssignedTo : row.AssignedTo ? [row.AssignedTo] : row.AM_AssignedTo ? [row.AM_AssignedTo] : undefined),
      BusinessTitle: row.riskBusiness?.Title ?? row.AM_Category?.Title ?? '',
      ProjectTitle: row.RiskProject?.Title ?? row.ProjectName ?? row.AM_Project?.Title ?? '',
      CategoryTitle: row.RiskCategory?.Title ?? row.AM_Category?.Title ?? '',
      SubCategoryTitle: row.RiskSubCategory?.Title ?? row.AM_SubCategory?.Title ?? '',
      LikelihoodTitle: row.Likelihood ?? '',
      LikelihoodRating: parseChoiceScore(row.Likelihood),
      ConsequenceTitle: row.Consequence ?? '',
      ConsequenceRating: parseChoiceScore(row.Consequence),
      ResponseTitle: row.RiskResponse?.Title ?? '',
      StrategyTitle: row.RiskStrategy?.Title ?? '',
      PotentialLikelihoodTitle: row.PotentialLikelihood ?? '',
      PotentialLikelihoodRating: parseChoiceScore(row.PotentialLikelihood),
      PotentialConsequenceTitle: row.PotentialConsequence ?? '',
      PotentialConsequenceRating: parseChoiceScore(row.PotentialConsequence),
      PotentialCost: row.potentialcost ?? '',
      DateRiskIdentified: row.DateRiskIdentified ?? row.AM_PurchaseDate ?? '',
      Dates: row.RiskDueDate ?? '',
      Causes: row.Causes ?? '',
      Consequences: row.RiskConsequences ?? '',
      ExistingControls: row.ExistingControls ?? '',
      ControlEffectiveness: row.Assesstheeffectivenessofcontrols ?? '',
      AM_Notes: row.AM_Notes ?? '',
      MitigationPlan: row.MitigationPlan ?? '',
      RiskComment: row.RiskComment ?? '',
      CreatedByName: row.Author?.Title ?? '',
      CreatedAt: row.Created ?? '',
      ModifiedAt: row.Modified ?? ''
    };

    if (customColumnKeys.length > 0) {
      const templateValues = parseTemplateDataJson(row.AM_CustomJson || row.TemplateData);
      customColumnKeys.forEach((columnKey) => {
        const fieldId = columnKey.replace(/^_custom_/, '');
        reportRow[columnKey] = formatCustomFieldValue(templateValues[fieldId]);
      });
    }

    return reportRow;
  }

  private async fetchRiskRows(selectedColumnKeys: string[]): Promise<ReportRow[]> {
    const customColumnKeys = selectedColumnKeys.filter((key) => key.startsWith('_custom_'));
    const risks = await this.riskService.getRisks();
    return risks.map((risk) => this.mapRiskToRow(risk, customColumnKeys));
  }

  private async fetchBusinessRows(): Promise<ReportRow[]> {
    const listTitle = await this.riskService.getBusinessListTitle();
    const items = await this.rest.getAllItems<{
      Id: number;
      Title: string;
      Created?: string;
      Modified?: string;
    }>(listTitle, 'Id,Title,Created,Modified', undefined, undefined, 'Title asc');

    return items.map((item) => ({
      Title: item.Title,
      CreatedAt: item.Created ?? '',
      ModifiedAt: item.Modified ?? ''
    }));
  }

  private async fetchProjectRows(): Promise<ReportRow[]> {
    const items = await this.rest.getAllItems<{
      Id: number;
      Title: string;
      Code?: string;
      ProjectStatus?: string;
      ProjectType?: string;
      Created?: string;
      Modified?: string;
      Business?: { Title?: string };
    }>(
      PROJECTS_LIST_TITLE,
      'Id,Title,Code,ProjectStatus,ProjectType,Created,Modified,Business/Title',
      'Business',
      undefined,
      'Title asc'
    );

    return items.map((item) => ({
      Title: item.Title,
      Code: item.Code ?? '',
      BusinessTitle: item.Business?.Title ?? '',
      ProjectType: item.ProjectType ?? '',
      ProjectStatus: item.ProjectStatus ?? '',
      CreatedAt: item.Created ?? '',
      ModifiedAt: item.Modified ?? ''
    }));
  }
}
