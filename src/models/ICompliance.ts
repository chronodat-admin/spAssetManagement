export type AssessmentStatus = 'Draft' | 'In Progress' | 'Complete';

export type ComplianceItemStatus =
  | 'Not Assessed'
  | 'Compliant'
  | 'Non-Compliant'
  | 'Partially Compliant'
  | 'Not Applicable';

export interface IComplianceFramework {
  id: number;
  name: string;
  code: string;
  version: string;
  description: string;
  isBuiltIn: boolean;
  isActive: boolean;
  controlCount: number;
}

export interface IComplianceControl {
  id: number;
  frameworkId: number;
  controlCode: string;
  title: string;
  description?: string;
  category: string;
  sortOrder: number;
}

export interface IComplianceAssessment {
  id: number;
  name: string;
  status: AssessmentStatus;
  frameworkId: number;
  frameworkName: string;
  frameworkCode: string;
  frameworkVersion?: string;
  dueDate?: string;
  completedDate?: string;
  createdAt?: string;
  totalItems: number;
  compliantItems: number;
  assessedItems: number;
}

export interface IComplianceAssessmentItem {
  id: number;
  assessmentId: number;
  controlId: number;
  controlCode: string;
  title: string;
  description?: string;
  category: string;
  sortOrder: number;
  status: ComplianceItemStatus;
  evidence?: string;
  notes?: string;
  completedDate?: string;
}

export interface IComplianceAssessmentDetail extends IComplianceAssessment {
  items: IComplianceAssessmentItem[];
}

export interface ICustomFrameworkControlInput {
  controlCode: string;
  title: string;
  category?: string;
  description?: string;
}

export interface ICustomFrameworkInput {
  name: string;
  code: string;
  version: string;
  description?: string;
  controls: ICustomFrameworkControlInput[];
}

export const ASSESSMENT_STATUSES: AssessmentStatus[] = ['Draft', 'In Progress', 'Complete'];

export const COMPLIANCE_ITEM_STATUSES: ComplianceItemStatus[] = [
  'Not Assessed',
  'Compliant',
  'Non-Compliant',
  'Partially Compliant',
  'Not Applicable'
];
