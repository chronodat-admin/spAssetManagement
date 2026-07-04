import {
  AssessmentStatus,
  ComplianceItemStatus,
  IComplianceAssessment,
  IComplianceAssessmentItem,
  IComplianceControl
} from '../models/ICompliance';

export function getComplianceRate(assessment: Pick<IComplianceAssessment, 'compliantItems' | 'totalItems'>): number {
  if (!assessment.totalItems) {
    return 0;
  }
  return Math.round((assessment.compliantItems / assessment.totalItems) * 100);
}

export function getAssessmentProgressRate(
  assessment: Pick<IComplianceAssessment, 'assessedItems' | 'totalItems'>
): number {
  if (!assessment.totalItems) {
    return 0;
  }
  return Math.round((assessment.assessedItems / assessment.totalItems) * 100);
}

export function summarizeAssessments(assessments: IComplianceAssessment[]): {
  inProgressCount: number;
  totalAssessed: number;
  totalItems: number;
  totalCompliant: number;
  overallComplianceRate: number;
  statusCounts: Record<AssessmentStatus, number>;
} {
  const statusCounts: Record<AssessmentStatus, number> = {
    Draft: 0,
    'In Progress': 0,
    Complete: 0
  };

  let inProgressCount = 0;
  let totalAssessed = 0;
  let totalItems = 0;
  let totalCompliant = 0;

  assessments.forEach((assessment) => {
    statusCounts[assessment.status] = (statusCounts[assessment.status] || 0) + 1;
    if (assessment.status === 'In Progress') {
      inProgressCount += 1;
    }
    totalAssessed += assessment.assessedItems;
    totalItems += assessment.totalItems;
    totalCompliant += assessment.compliantItems;
  });

  return {
    inProgressCount,
    totalAssessed,
    totalItems,
    totalCompliant,
    overallComplianceRate: totalItems > 0 ? Math.round((totalCompliant / totalItems) * 100) : 0,
    statusCounts
  };
}

export function summarizeAssessmentItems(items: IComplianceAssessmentItem[]): {
  compliant: number;
  nonCompliant: number;
  partial: number;
  notAssessed: number;
  notApplicable: number;
  assessed: number;
  complianceRate: number;
  assessmentProgress: number;
} {
  const counts: Record<ComplianceItemStatus, number> = {
    'Not Assessed': 0,
    Compliant: 0,
    'Non-Compliant': 0,
    'Partially Compliant': 0,
    'Not Applicable': 0
  };

  items.forEach((item) => {
    counts[item.status] = (counts[item.status] || 0) + 1;
  });

  const total = items.length;
  const assessed = total - counts['Not Assessed'];
  const complianceDenominator = total - counts['Not Applicable'];

  return {
    compliant: counts.Compliant,
    nonCompliant: counts['Non-Compliant'],
    partial: counts['Partially Compliant'],
    notAssessed: counts['Not Assessed'],
    notApplicable: counts['Not Applicable'],
    assessed,
    complianceRate:
      complianceDenominator > 0 ? Math.round((counts.Compliant / complianceDenominator) * 100) : 0,
    assessmentProgress: total > 0 ? Math.round((assessed / total) * 100) : 0
  };
}

export function groupControlsByCategory(controls: IComplianceControl[]): Array<{
  category: string | null;
  items: IComplianceControl[];
}> {
  const categories = Array.from(new Set(controls.map((control) => control.category).filter(Boolean))).sort();
  if (categories.length <= 1) {
    return [{ category: categories[0] || null, items: controls }];
  }
  return categories.map((category) => ({
    category,
    items: controls.filter((control) => control.category === category)
  }));
}

export function formatComplianceDate(value?: string): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getAssessmentStatusAppearance(status: AssessmentStatus): {
  color: 'informative' | 'success' | 'subtle' | 'warning' | 'danger';
} {
  switch (status) {
    case 'Complete':
      return { color: 'success' };
    case 'In Progress':
      return { color: 'informative' };
    default:
      return { color: 'subtle' };
  }
}

export function getItemStatusAppearance(status: ComplianceItemStatus): {
  color: 'informative' | 'success' | 'subtle' | 'warning' | 'danger';
} {
  switch (status) {
    case 'Compliant':
      return { color: 'success' };
    case 'Non-Compliant':
      return { color: 'danger' };
    case 'Partially Compliant':
      return { color: 'warning' };
    case 'Not Applicable':
      return { color: 'subtle' };
    default:
      return { color: 'informative' };
  }
}

export function getComplianceRateColor(rate: number): string {
  if (rate >= 70) {
    return '#16a34a';
  }
  if (rate >= 40) {
    return '#d97706';
  }
  return '#dc2626';
}
