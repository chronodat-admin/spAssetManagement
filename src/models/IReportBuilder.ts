export type ReportDataSource = 'risks' | 'business' | 'projects';

export type ReportColumnType = 'string' | 'number' | 'date' | 'boolean';

export interface IReportColumnDef {
  key: string;
  label: string;
  type: ReportColumnType;
  isCustom?: boolean;
}

export interface IReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains';
  value: string;
}

export type ReportRow = Record<string, unknown>;
