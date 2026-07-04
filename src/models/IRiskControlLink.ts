import { RISK_CONTROL_LINK_TYPE_CHOICES } from './IListDefinitions';

/** How a risk relates to a compliance control. */
export type RiskControlLinkType = 'Mitigates' | 'Tests' | 'Detects' | 'Caused By' | 'Monitors';

export const RISK_CONTROL_LINK_TYPES = RISK_CONTROL_LINK_TYPE_CHOICES as RiskControlLinkType[];

export const DEFAULT_RISK_CONTROL_LINK_TYPE: RiskControlLinkType = 'Mitigates';

/** A persisted risk ↔ control relationship row (junction list item). */
export interface IRiskControlLink {
  id: number;
  riskId: number;
  riskRef: string;
  riskTitle: string;
  controlId: number;
  controlCode: string;
  controlTitle: string;
  frameworkCode: string;
  frameworkName?: string;
  linkType: RiskControlLinkType;
  rationale?: string;
}

/** Input for creating a new risk ↔ control link. */
export interface IRiskControlLinkInput {
  riskId: number;
  controlId: number;
  linkType: RiskControlLinkType;
  rationale?: string;
}

/** Lightweight risk option used by link pickers. */
export interface IRiskLinkOption {
  id: number;
  riskRef: string;
  title: string;
  status?: string;
}

/** Coverage for a single control (how many risks reference it). */
export interface IControlRiskCoverage {
  controlId: number;
  controlCode: string;
  controlTitle: string;
  category: string;
  linkedRiskCount: number;
  links: IRiskControlLink[];
}

/** Aggregate risk-control coverage across a set of controls. */
export interface IRiskControlCoverageSummary {
  totalControls: number;
  coveredControls: number;
  uncoveredControls: number;
  coveragePercent: number;
  totalLinks: number;
  controls: IControlRiskCoverage[];
}
