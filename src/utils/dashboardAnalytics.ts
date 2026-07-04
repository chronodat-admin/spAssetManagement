import { CONSEQUENCE_CHOICES, LIKELIHOOD_CHOICES } from '../constants/assetChoices.js';
import type { IAsset, ILookupItem } from '../models/IAsset';
import type { IWorkflowSettings } from '../models/IWorkflowSettings';
import { classifyRiskStatus, getStatusColor } from '../lib/workflow-settings/utils';
import { getMatrixPriority, parseChoiceScore } from './priorityCalculator';
import { getNumericRiskRating, isActiveRisk } from './riskMatrix';
import { calculateRiskRating, type RiskRatingResult } from './riskRatingCalculator';
import {
  countByStatus,
  getAssetDashboardStats,
  getTotalAssetValue,
  resolveAssetStatusTitle,
  type IAssetDashboardStats
} from './assetDashboardStats';

export {
  countByStatus,
  getAssetDashboardStats,
  getTotalAssetValue,
  resolveAssetStatusTitle,
  type IAssetDashboardStats
};

export interface IDashboardFilters {
  businessId: string;
  projectId: string;
}

export interface IStatusChartItem {
  name: string;
  value: number;
  color: string;
}

export interface ICategoryChartItem {
  category: string;
  count?: number;
  open: number;
  inProgress: number;
  closed: number;
}

export interface IPriorityChartItem {
  label: string;
  critical: number;
  major: number;
  moderate: number;
  low: number;
}

export interface IFinancialExposure {
  totalExposure: number;
  riskCount: number;
  topRisks: Array<{ title: string; exposure: number; riskId: string }>;
}

export function filterDashboardAssets(assets: IAsset[], filters: IDashboardFilters): IAsset[] {
  return assets.filter((asset) => {
    if (filters.businessId !== 'all') {
      const businessId = (asset.riskBusiness?.Id ?? asset.AM_Category?.Id)?.toString();
      if (businessId !== filters.businessId) {
        return false;
      }
    }
    if (filters.projectId !== 'all') {
      const projectId = (asset.RiskProject?.Id ?? asset.AM_Project?.Id)?.toString();
      if (projectId !== filters.projectId) {
        return false;
      }
    }
    return !asset.AM_IsDeleted;
  });
}

/** @deprecated Use filterDashboardAssets */
export const filterDashboardRisks = filterDashboardAssets;

export function getProjectOptions(projects: ILookupItem[], businessId = 'all'): ILookupItem[] {
  let options = projects;
  if (businessId !== 'all') {
    options = options.filter((item) => String(item.BusinessId || '') === businessId);
  }
  return [...options].sort((a, b) => a.Title.localeCompare(b.Title));
}

export function getCategoryOptions(categories: ILookupItem[]): { value: string; label: string }[] {
  return [
    { value: 'all', label: 'All categories' },
    ...categories.map((c) => ({ value: String(c.Id), label: c.Title }))
  ];
}

function shiftChoice(choice: string, delta: number, choices: readonly string[]): string {
  const score = parseChoiceScore(choice);
  if (!score) {
    return choice;
  }
  const newScore = Math.max(1, Math.min(5, score - delta));
  return choices.find((item) => parseChoiceScore(item) === newScore) || choice;
}

export function getResidualRatings(asset: IAsset): { likelihood?: string; consequence?: string } {
  if (asset.PotentialLikelihood && asset.PotentialConsequence) {
    return {
      likelihood: asset.PotentialLikelihood,
      consequence: asset.PotentialConsequence
    };
  }

  const likelihood = asset.Likelihood;
  const consequence = asset.Consequence;
  if (!likelihood || !consequence) {
    return {};
  }

  const controls = asset.Assesstheeffectivenessofcontrols || 'Good';
  if (controls === 'Poor') {
    return { likelihood, consequence };
  }
  if (controls === 'Fair') {
    return {
      likelihood: shiftChoice(likelihood, 1, LIKELIHOOD_CHOICES),
      consequence: shiftChoice(consequence, 1, CONSEQUENCE_CHOICES)
    };
  }

  return {
    likelihood: shiftChoice(likelihood, 2, LIKELIHOOD_CHOICES),
    consequence: shiftChoice(consequence, 1, CONSEQUENCE_CHOICES)
  };
}

function normalizeStatus(
  status?: string,
  workflowSettings?: IWorkflowSettings
): 'Open' | 'In Progress' | 'Closed' {
  const navClass = classifyRiskStatus(status, workflowSettings);
  if (navClass === 'closed') return 'Closed';
  if (navClass === 'inProgress') return 'In Progress';
  return 'Open';
}

function priorityBucket(level: string): 'critical' | 'major' | 'moderate' | 'low' {
  if (level === 'Critical') return 'critical';
  if (level === 'Major') return 'major';
  if (level === 'Moderate') return 'moderate';
  return 'low';
}

export function getStatusChartData(
  assets: IAsset[],
  workflowSettings?: IWorkflowSettings
): IStatusChartItem[] {
  const counts: Record<string, number> = {};
  assets.forEach((asset) => {
    const status = resolveAssetStatusTitle(asset).trim();
    counts[status] = (counts[status] || 0) + 1;
  });

  const items: IStatusChartItem[] = [];
  const colorFallback = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6366f1'];
  let index = 0;
  Object.keys(counts).forEach((name) => {
    items.push({
      name,
      value: counts[name],
      color: getStatusColor(name, workflowSettings) || colorFallback[index % colorFallback.length]
    });
    index += 1;
  });
  return items;
}

export function getAssetCategoryChartData(assets: IAsset[]): ICategoryChartItem[] {
  const buckets: Record<string, ICategoryChartItem> = {};

  assets.forEach((asset) => {
    if (asset.AM_IsDeleted) {
      return;
    }
    const category = asset.AM_Category?.Title || 'Unassigned';
    if (!buckets[category]) {
      buckets[category] = { category, open: 0, inProgress: 0, closed: 0 };
    }
    const status = resolveAssetStatusTitle(asset);
    if (status === 'Available') {
      buckets[category].open += 1;
    } else if (status === 'Assigned' || status === 'In Repair') {
      buckets[category].inProgress += 1;
    } else {
      buckets[category].closed += 1;
    }
  });

  return Object.keys(buckets)
    .map((key) => buckets[key])
    .sort((a, b) => a.category.localeCompare(b.category));
}

export function getCategoryChartData(
  assets: IAsset[],
  workflowSettings?: IWorkflowSettings
): ICategoryChartItem[] {
  const buckets: Record<string, ICategoryChartItem> = {};

  assets.forEach((asset) => {
    const category = asset.riskBusiness?.Title || asset.AM_Category?.Title || 'Unassigned';
    if (!buckets[category]) {
      buckets[category] = { category, open: 0, inProgress: 0, closed: 0 };
    }
    const status = normalizeStatus(resolveAssetStatusTitle(asset), workflowSettings);
    if (status === 'Closed') buckets[category].closed += 1;
    else if (status === 'In Progress') buckets[category].inProgress += 1;
    else buckets[category].open += 1;
  });

  return Object.keys(buckets)
    .map((key) => buckets[key])
    .sort((a, b) => a.category.localeCompare(b.category));
}

export function getPriorityChartData(
  assets: IAsset[],
  workflowSettings?: IWorkflowSettings
): IPriorityChartItem[] {
  const statusBuckets: Record<'Open' | 'In Progress' | 'Closed', IPriorityChartItem> = {
    Open: { label: 'Open', critical: 0, major: 0, moderate: 0, low: 0 },
    'In Progress': { label: 'In Progress', critical: 0, major: 0, moderate: 0, low: 0 },
    Closed: { label: 'Closed', critical: 0, major: 0, moderate: 0, low: 0 }
  };

  assets.forEach((asset) => {
    const status = normalizeStatus(resolveAssetStatusTitle(asset), workflowSettings);
    const priority = getMatrixPriority(asset.Likelihood, asset.Consequence);
    const bucket = priorityBucket(priority.level);
    statusBuckets[status][bucket] += 1;
  });

  return ['Open', 'In Progress', 'Closed'].map((label) => statusBuckets[label as keyof typeof statusBuckets]);
}

export function getFinancialExposure(assets: IAsset[]): IFinancialExposure {
  const assessed = assets
    .map((asset) => {
      const raw = (asset.potentialcost || '').replace(/[^0-9.-]/g, '');
      const exposure = parseFloat(raw);
      if (!exposure || Number.isNaN(exposure) || !isActiveRisk(asset)) {
        return undefined;
      }
      return {
        title: asset.Title,
        exposure,
        riskId: asset.RiskID || asset.AM_AssetId || String(asset.Id)
      };
    })
    .filter((item): item is { title: string; exposure: number; riskId: string } => Boolean(item));

  const totalExposure = assessed.reduce((sum, item) => sum + item.exposure, 0);
  const topRisks = [...assessed].sort((a, b) => b.exposure - a.exposure).slice(0, 3);

  return {
    totalExposure: Math.round(totalExposure * 100) / 100,
    riskCount: assessed.length,
    topRisks
  };
}

export function getRiskNumericRating(
  asset: IAsset,
  likelihoodRatings: Record<string, number>,
  consequenceRatings: Record<string, number>
): RiskRatingResult | undefined {
  const numericValue = getNumericRiskRating(
    asset.Likelihood,
    asset.Consequence,
    likelihoodRatings,
    consequenceRatings
  );
  if (!numericValue) {
    return undefined;
  }
  const lWeight = likelihoodRatings[asset.Likelihood || ''] ?? parseChoiceScore(asset.Likelihood);
  const cWeight = consequenceRatings[asset.Consequence || ''] ?? parseChoiceScore(asset.Consequence);
  return calculateRiskRating(lWeight, cWeight);
}

export function getLocationValueChartData(assets: IAsset[]): { location: string; value: number }[] {
  const totals = new Map<string, number>();
  assets.forEach((asset) => {
    const location = asset.AM_Location?.Title || 'Unassigned';
    totals.set(location, (totals.get(location) || 0) + (asset.AM_Cost || 0));
  });
  return Array.from(totals.entries()).map(([location, value]) => ({ location, value }));
}

export function getWarrantyExpiringChartData(assets: IAsset[]): { bucket: string; count: number }[] {
  const now = Date.now();
  const day = 86400000;
  const buckets = [
    { bucket: '0–30 days', count: 0 },
    { bucket: '31–60 days', count: 0 },
    { bucket: '61–90 days', count: 0 }
  ];
  assets.forEach((asset) => {
    if (!asset.AM_WarrantyExpiry) return;
    const expiry = new Date(asset.AM_WarrantyExpiry).getTime();
    const days = Math.floor((expiry - now) / day);
    if (days < 0 || days > 90) return;
    if (days <= 30) buckets[0].count += 1;
    else if (days <= 60) buckets[1].count += 1;
    else buckets[2].count += 1;
  });
  return buckets;
}
