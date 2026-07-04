import type { IAsset } from '../models/IAsset';
import type { IWorkflowSettings } from '../models/IWorkflowSettings';
import { classifyRiskStatus } from '../lib/workflow-settings/utils';
import {
  calculateMatrixPriority,
  getMatrixIndices,
  MatrixPriority,
  parseChoiceScore
} from './priorityCalculator';

/** Minimal shape for dashboard heatmap analytics. */
export type IRiskMatrixItem = IAsset;

export interface HeatmapCell {
  likelihoodIdx: number;
  consequenceIdx: number;
  count: number;
  priority: MatrixPriority;
  risks: IAsset[];
}

export function isActiveRisk(risk: IAsset, workflowSettings?: IWorkflowSettings): boolean {
  const status =
    risk.Riskstatus ||
    (typeof risk.AM_Status === 'string' ? risk.AM_Status : risk.AM_Status?.Title);
  return classifyRiskStatus(status, workflowSettings) !== 'closed';
}

export function buildHeatmapMatrix(
  risks: IAsset[],
  activeOnly = true,
  getLikelihood: (risk: IAsset) => string | undefined = (risk) => risk.Likelihood,
  getConsequence: (risk: IAsset) => string | undefined = (risk) => risk.Consequence
): HeatmapCell[][] {
  const source = activeOnly ? risks.filter((risk) => isActiveRisk(risk)) : risks;
  const matrix: HeatmapCell[][] = Array.from({ length: 5 }, (_, lIdx) =>
    Array.from({ length: 5 }, (_, cIdx) => ({
      likelihoodIdx: lIdx,
      consequenceIdx: cIdx,
      count: 0,
      priority: calculateMatrixPriority(lIdx, cIdx).level,
      risks: [] as IAsset[]
    }))
  );

  source.forEach((risk) => {
    const indices = getMatrixIndices(getLikelihood(risk), getConsequence(risk));
    if (!indices) {
      return;
    }
    const cell = matrix[indices.likelihoodIdx][indices.consequenceIdx];
    cell.count += 1;
    cell.risks.push(risk);
  });

  return matrix;
}

export function countByMatrixPriority(risks: IAsset[], activeOnly = true): Record<MatrixPriority, number> {
  const counts: Record<MatrixPriority, number> = {
    Critical: 0,
    Major: 0,
    Moderate: 0,
    Low: 0,
    'Not Assessed': 0
  };

  const source = activeOnly ? risks.filter((risk) => isActiveRisk(risk)) : risks;
  source.forEach((risk) => {
    const indices = getMatrixIndices(risk.Likelihood, risk.Consequence);
    if (!indices) {
      counts['Not Assessed'] += 1;
      return;
    }
    const { level } = calculateMatrixPriority(indices.likelihoodIdx, indices.consequenceIdx);
    counts[level] += 1;
  });

  return counts;
}

/** Numeric product rating using lookup Rating values when available (risk-v2 style). */
export function getNumericRiskRating(
  likelihood?: string,
  consequence?: string,
  likelihoodRatings?: Record<string, number>,
  consequenceRatings?: Record<string, number>
): number | undefined {
  if (!likelihood || !consequence) {
    return undefined;
  }

  const lWeight = likelihoodRatings?.[likelihood] ?? parseChoiceScore(likelihood);
  const cWeight = consequenceRatings?.[consequence] ?? parseChoiceScore(consequence);
  if (!lWeight || !cWeight) {
    return undefined;
  }
  return Math.round(lWeight * cWeight * 100) / 100;
}

export function getAverageRiskAgeDays(risks: IAsset[]): number {
  const active = risks.filter((risk) => isActiveRisk(risk));
  if (active.length === 0) {
    return 0;
  }

  const now = Date.now();
  const totalDays = active.reduce((sum, risk) => {
    const dateStr = risk.DateRiskIdentified || risk.Created;
    if (!dateStr) {
      return sum;
    }
    const parsed = Date.parse(dateStr);
    if (Number.isNaN(parsed)) {
      return sum;
    }
    return sum + Math.max(0, Math.floor((now - parsed) / (1000 * 60 * 60 * 24)));
  }, 0);

  return Math.round(totalDays / active.length);
}
