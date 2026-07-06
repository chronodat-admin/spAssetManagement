import type { CSSProperties } from 'react';

export const LIST_TITLE_COLUMN_MIN_WIDTH = '220px';
export const LIST_TITLE_COLUMN_WIDTH = '220px';
export const LIST_SELECT_COLUMN_WIDTH = 44;
export const LIST_ACTIONS_COLUMN_WIDTH = 120;
export const DATA_TABLE_CLASS = 'asset-mgmt-data-table';
/** Table cells that stack multiple lines (framework name/code, progress bars). */
export const STACK_TABLE_CELL_CLASS = 'asset-mgmt-table-cell-stack';

type ColumnWidthDef = {
  width: string;
  minWidth: string;
  truncate?: boolean;
  wrap?: boolean;
  badge?: boolean;
};

const COLUMN_WIDTH_BY_KEY: Record<string, ColumnWidthDef> = {
  riskId: { width: '96px', minWidth: '96px', truncate: true },
  title: { width: '220px', minWidth: '220px', wrap: true },
  status: { width: '118px', minWidth: '118px', badge: true },
  profile: { width: '108px', minWidth: '108px', truncate: true },
  category: { width: '128px', minWidth: '128px', truncate: true },
  subCategory: { width: '140px', minWidth: '140px', truncate: true },
  business: { width: '120px', minWidth: '120px', truncate: true },
  project: { width: '130px', minWidth: '130px', truncate: true },
  likelihood: { width: '128px', minWidth: '128px', truncate: true },
  impact: { width: '118px', minWidth: '118px', truncate: true },
  priority: { width: '108px', minWidth: '108px', badge: true },
  owner: { width: '150px', minWidth: '150px', truncate: true },
  dueDate: { width: '116px', minWidth: '116px', truncate: true },
  code: { width: '100px', minWidth: '100px', truncate: true },
  industry: { width: '120px', minWidth: '120px', truncate: true },
  region: { width: '120px', minWidth: '120px', truncate: true },
  criticality: { width: '108px', minWidth: '108px', truncate: true },
  type: { width: '108px', minWidth: '108px', truncate: true },
  manager: { width: '140px', minWidth: '140px', truncate: true },
  rating: { width: '100px', minWidth: '100px', truncate: true },
  assessment: { width: '220px', minWidth: '200px', wrap: true },
  framework: { width: '180px', minWidth: '160px', wrap: true },
  compliance: { width: '140px', minWidth: '140px' },
  progress: { width: '160px', minWidth: '160px' },
  name: { width: '220px', minWidth: '200px', truncate: true },
  slug: { width: '180px', minWidth: '160px', truncate: true },
  trigger: { width: '160px', minWidth: '140px', truncate: true },
  entity: { width: '110px', minWidth: '100px', truncate: true },
  frequency: { width: '110px', minWidth: '100px', truncate: true },
  recipients: { width: '220px', minWidth: '200px', truncate: true },
  nextRun: { width: '130px', minWidth: '120px', truncate: true },
  active: { width: '90px', minWidth: '90px' },
  version: { width: '100px', minWidth: '100px', truncate: true },
  controls: { width: '100px', minWidth: '100px', truncate: true },
  fields: { width: '90px', minWidth: '90px', truncate: true },
  when: { width: '170px', minWidth: '170px', truncate: true },
  user: { width: '180px', minWidth: '160px', truncate: true },
  action: { width: '130px', minWidth: '120px', truncate: true },
  details: { width: '280px', minWidth: '240px', truncate: true },
  id: { width: '90px', minWidth: '90px', truncate: true },
  list: { width: '220px', minWidth: '200px', truncate: true },
  report: { width: '120px', minWidth: '110px', truncate: true },
  actions: { width: '120px', minWidth: '120px' }
};

const DEFAULT_COLUMN: ColumnWidthDef = {
  width: '120px',
  minWidth: '120px',
  truncate: true
};

function getColumnWidthDef(key: string): ColumnWidthDef {
  return COLUMN_WIDTH_BY_KEY[key] ?? DEFAULT_COLUMN;
}

function parsePx(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 120;
}

export function isListTitleColumn(column: { key: string; isPrimary?: boolean }): boolean {
  return column.key.toLowerCase() === 'title' || column.isPrimary === true;
}

export function getListTitleColumnStyle(): CSSProperties {
  return {
    minWidth: LIST_TITLE_COLUMN_MIN_WIDTH,
    width: LIST_TITLE_COLUMN_WIDTH
  };
}

export function getListColumnStyle(key: string): CSSProperties {
  const def = getColumnWidthDef(key);
  return {
    width: def.width,
    minWidth: def.minWidth
  };
}

export function isListBadgeColumn(key: string): boolean {
  return getColumnWidthDef(key).badge === true;
}

export function shouldTruncateListColumn(key: string): boolean {
  return getColumnWidthDef(key).truncate === true;
}

export function shouldWrapListColumn(key: string): boolean {
  return getColumnWidthDef(key).wrap === true;
}

export function getDataListTableMinWidth(
  columnKeys: string[],
  options?: { hasSelection?: boolean; hasActions?: boolean }
): number {
  let total = 0;
  if (options?.hasSelection) {
    total += LIST_SELECT_COLUMN_WIDTH;
  }
  if (options?.hasActions) {
    total += LIST_ACTIONS_COLUMN_WIDTH;
  }
  for (const key of columnKeys) {
    total += parsePx(getColumnWidthDef(key).minWidth);
  }
  return total;
}

export function getDataTableLayoutStyle(minWidth: number): CSSProperties {
  return {
    width: '100%',
    minWidth: `${minWidth}px`,
    tableLayout: 'fixed'
  };
}
