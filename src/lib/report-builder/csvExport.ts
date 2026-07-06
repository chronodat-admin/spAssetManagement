import type { IReportColumnDef, ReportRow } from '../../models/IReportBuilder';

export function formatReportCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString();
    }
  }
  return text;
}

export function csvEscapeReportValue(value: unknown): string {
  const text = formatReportCellValue(value);
  if (/[,"\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadReportCsv(
  rows: ReportRow[],
  columns: IReportColumnDef[],
  source: string
): void {
  if (rows.length === 0 || columns.length === 0) {
    return;
  }

  const headerLine = columns.map((column) => csvEscapeReportValue(column.label)).join(',');
  const bodyLines = rows.map((row) =>
    columns.map((column) => csvEscapeReportValue(row[column.key])).join(',')
  );
  const csv = [headerLine, ...bodyLines].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const dateTag = `${now.getFullYear()}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
  anchor.download = `${source}-report-${dateTag}.csv`;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function applyReportFilters(
  rows: ReportRow[],
  filters: Array<{ field: string; operator: string; value: string }>
): ReportRow[] {
  if (filters.length === 0) {
    return rows;
  }

  return rows.filter((row) =>
    filters.every((filter) => {
      const value = String(row[filter.field] ?? '').toLowerCase();
      const target = filter.value.toLowerCase();
      switch (filter.operator) {
        case 'equals':
          return value === target;
        case 'not_equals':
          return value !== target;
        case 'contains':
          return value.includes(target);
        default:
          return true;
      }
    })
  );
}
