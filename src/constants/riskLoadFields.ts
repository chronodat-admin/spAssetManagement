/** Scalar SharePoint columns loaded for risk list queries (excluding user/lookup expands). */
export const RISK_SCALAR_LOAD_FIELDS = [
  'RiskDescription',
  'Riskstatus',
  'RiskID',
  'RiskComment',
  'OldAssigneeId',
  'RiskDueDate',
  'MitigationPlan',
  'Likelihood',
  'Consequence',
  'PotentialLikelihood',
  'PotentialConsequence',
  'potentialcost',
  'Assesstheeffectivenessofcontrols',
  'Implementationreviewdate',
  'DateRiskIdentified',
  'ProjectName',
  'Causes',
  'RiskConsequences',
  'ExistingControls',
  'TemplateData'
] as const;

/** Lookup columns loaded for risk list queries (values resolved via *Id columns). */
export const RISK_LOOKUP_LOAD_FIELDS = [
  'RiskCategory',
  'RiskSubCategory',
  'riskBusiness',
  'RiskProject',
  'RiskProfileType',
  'RiskResponse',
  'RiskStrategy',
  'RelatedRisks'
] as const;

/** User/person columns loaded via their *Id columns (no $expand). */
export const RISK_USER_LOAD_FIELDS = ['AssignedTo'] as const;

/** System user columns loaded via *Id on single-item reads. */
export const RISK_SYSTEM_USER_LOAD_FIELDS = ['Author'] as const;
