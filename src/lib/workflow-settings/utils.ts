import type { IWorkflowSettings, StatusBucket } from '../../models/IWorkflowSettings';
import { DEFAULT_WORKFLOW_SETTINGS } from './defaults.js';
import { parseWorkflowSettings } from './storage.js';
import type { IAppSettings } from '../../models/IAssetApp';

export function slugifyStatusName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function createStatusId(): string {
  return `status-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createPriorityId(): string {
  return `priority-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTagId(): string {
  return `tag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getWorkflowSettingsFromApp(settings?: IAppSettings): IWorkflowSettings {
  return parseWorkflowSettings(settings);
}

export function getRiskStatusOptionNames(settings?: IWorkflowSettings): string[] {
  const workflow = settings || DEFAULT_WORKFLOW_SETTINGS;
  return [...workflow.customStatuses]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((status) => status.name);
}

export function getStatusBucket(statusName: string | undefined, settings?: IWorkflowSettings): StatusBucket {
  const workflow = settings || DEFAULT_WORKFLOW_SETTINGS;
  const name = (statusName || 'Open').trim();
  const match = workflow.customStatuses.find((item) => item.name === name);
  if (match) {
    return match.bucket;
  }

  const lower = name.toLowerCase();
  if (lower === 'closed' || lower === 'resolved' || lower === 'accepted' || lower === 'transferred') {
    return 'closed';
  }
  if (lower === 'in progress' || lower === 'mitigating' || lower === 'under review' || lower === 'mitigation') {
    return 'in_progress';
  }
  return 'open';
}

export function getStatusColor(statusName: string | undefined, settings?: IWorkflowSettings): string {
  const workflow = settings || DEFAULT_WORKFLOW_SETTINGS;
  const name = (statusName || 'Open').trim();
  const match = workflow.customStatuses.find((item) => item.name === name);
  if (match) {
    return match.color;
  }

  const bucket = getStatusBucket(name, workflow);
  const bucketMatch = workflow.customStatuses.find((item) => item.bucket === bucket);
  return bucketMatch?.color || '#3B82F6';
}

export type RiskNavFilter = 'open' | 'inProgress' | 'closed';

export function classifyRiskStatus(
  status: string | undefined,
  settings?: IWorkflowSettings
): RiskNavFilter {
  const name = (status || 'Open').trim();
  const bucket = getStatusBucket(name, settings);
  const lower = name.toLowerCase();

  if (bucket === 'closed' || bucket === 'resolved') {
    return 'closed';
  }
  if (
    bucket === 'in_progress' ||
    bucket === 'mitigation' ||
    lower === 'in progress' ||
    lower === 'mitigating' ||
    lower === 'under review' ||
    lower === 'mitigation'
  ) {
    return 'inProgress';
  }
  if (lower === 'closed' || lower === 'resolved' || lower === 'accepted' || lower === 'transferred') {
    return 'closed';
  }
  if (lower === 'open') {
    return 'open';
  }
  return bucket === 'open' ? 'open' : 'inProgress';
}

export function matchesRiskNavFilter(
  status: string | undefined,
  filter: RiskNavFilter,
  settings?: IWorkflowSettings
): boolean {
  return classifyRiskStatus(status, settings) === filter;
}

export { buildNumberPreview } from './numberingEngine.js';
