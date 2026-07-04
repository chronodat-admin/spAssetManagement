/** Dashboard filter shape — full analytics in Dashboard component (task 16). */
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
  count: number;
}

export function getProjectOptions(_projects: unknown[]): { value: string; label: string }[] {
  return [{ value: 'all', label: 'All projects' }];
}

export function filterDashboardAssets<T>(_assets: T[], _filters: IDashboardFilters): T[] {
  return _assets;
}
