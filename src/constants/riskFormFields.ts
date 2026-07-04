import { DEFAULT_FORM_SETTINGS } from '../lib/form-config/defaults';

/** SharePoint internal names handled by the main risk form (not "Additional list fields"). */
export const KNOWN_RISK_FORM_FIELDS = new Set([
  ...Object.keys(DEFAULT_FORM_SETTINGS.risks.fields),
  'RiskID',
  'ProjectName',
  'RiskComment',
  'OldAssigneeId',
  'RiskCategory',
  'RiskSubCategory',
  'RiskProject',
  'RiskProfileType',
  'RiskResponse',
  'RiskStrategy',
  'riskBusiness'
]);
