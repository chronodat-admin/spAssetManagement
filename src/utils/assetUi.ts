import type { BadgeProps } from '@fluentui/react-components';

export type AssetStatusName =
  | 'Available'
  | 'Assigned'
  | 'In Repair'
  | 'Retired'
  | 'Disposed'
  | string;

export interface IBadgeColorStyle {
  backgroundColor: string;
  color: string;
}

/** Status badge colors per spec section 5.6. */
const ASSET_STATUS_BADGE_STYLES: Record<string, IBadgeColorStyle> = {
  Available: { backgroundColor: '#16a34a', color: '#ffffff' },
  Assigned: { backgroundColor: '#0284c7', color: '#ffffff' },
  'In Repair': { backgroundColor: '#f59e0b', color: '#1f2937' },
  Retired: { backgroundColor: '#64748b', color: '#ffffff' },
  Disposed: { backgroundColor: '#dc2626', color: '#ffffff' }
};

const DEFAULT_STATUS_STYLE: IBadgeColorStyle = {
  backgroundColor: '#64748b',
  color: '#ffffff'
};

function getContrastTextColor(backgroundColor: string): string {
  const normalized = backgroundColor.trim().replace('#', '');
  if (normalized.length !== 6) {
    return '#ffffff';
  }
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.62 ? '#1f2937' : '#ffffff';
}

export function getAssetStatusBadgeStyle(
  status?: string,
  colorHex?: string
): IBadgeColorStyle {
  const statusName = (status || 'Available').trim();
  if (colorHex?.trim()) {
    return {
      backgroundColor: colorHex.trim(),
      color: getContrastTextColor(colorHex.trim())
    };
  }
  return ASSET_STATUS_BADGE_STYLES[statusName] || DEFAULT_STATUS_STYLE;
}

export function getAssetStatusAppearance(status?: string): BadgeProps['color'] {
  const statusName = (status || '').trim();
  if (statusName === 'Available' || statusName === 'Retired') return 'success';
  if (statusName === 'In Repair') return 'warning';
  if (statusName === 'Disposed') return 'danger';
  return 'brand';
}

export function getAssetStatusInlineColor(status?: string, colorHex?: string): string {
  return getAssetStatusBadgeStyle(status, colorHex).backgroundColor;
}

export const ASSET_STATUS_COLORS = ASSET_STATUS_BADGE_STYLES;

/** Re-export priority badge helper for list/dashboard components during migration. */
export function getMatrixPriorityBadgeStyle(priority: string): IBadgeColorStyle {
  const styles: Record<string, IBadgeColorStyle> = {
    Critical: { backgroundColor: '#dc2626', color: '#ffffff' },
    Major: { backgroundColor: '#ea580c', color: '#ffffff' },
    Moderate: { backgroundColor: '#eab308', color: '#1f2937' },
    Low: { backgroundColor: '#16a34a', color: '#ffffff' },
    'Not Assessed': { backgroundColor: '#64748b', color: '#ffffff' }
  };
  return styles[priority] || styles['Not Assessed'];
}

import type { MatrixPriority } from './priorityCalculator';

export type HeatmapCellTone = 'critical' | 'major' | 'moderate' | 'low';

export function getHeatmapCellTone(priority: MatrixPriority): HeatmapCellTone {
  switch (priority) {
    case 'Critical':
      return 'critical';
    case 'Major':
      return 'major';
    case 'Moderate':
      return 'moderate';
    default:
      return 'low';
  }
}
