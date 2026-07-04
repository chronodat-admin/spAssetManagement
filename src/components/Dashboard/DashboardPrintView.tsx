import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import {
  ICategoryChartItem,
  IFinancialExposure,
  IPriorityChartItem,
  IStatusChartItem
} from '../../utils/dashboardAnalytics';
import { HeatmapCell } from '../../utils/riskMatrix';
import { MATRIX_CONSEQUENCE_LABELS, MATRIX_LIKELIHOOD_LABELS, MatrixPriority } from '../../utils/priorityCalculator';
import { IAsset } from '../../models/IAssetApp';
import { resolveAssetStatusTitle } from '../../utils/dashboardAnalytics';
import { dashboardPrintTheme } from '../../utils/dashboardPrintTheme';
import { useDashboardPrintStyles } from './dashboardPrintStyles';

const theme = dashboardPrintTheme;

const HEATMAP_CELL_COLORS: Record<MatrixPriority, { background: string; color: string }> = {
  Critical: { background: '#dc2626', color: '#ffffff' },
  Major: { background: '#f97316', color: '#ffffff' },
  Moderate: { background: '#facc15', color: '#1f2937' },
  Low: { background: '#22c55e', color: '#ffffff' },
  'Not Assessed': { background: '#e5e7eb', color: '#374151' }
};

const SEVERITY_COLORS: Record<string, { background: string; color: string }> = {
  Critical: { background: '#dc2626', color: '#ffffff' },
  Major: { background: '#f97316', color: '#ffffff' },
  Moderate: { background: '#facc15', color: '#1f2937' },
  Low: { background: '#22c55e', color: '#ffffff' },
  Total: { background: theme.brand, color: '#ffffff' }
};

const useLayoutStyles = makeStyles({
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: '10px',
    marginBottom: '16px'
  },
  matrixRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 120px',
    gap: '12px',
    marginBottom: '16px'
  },
  heatmapGrid: {
    display: 'grid',
    gridTemplateColumns: '60px repeat(5, minmax(0, 1fr))',
    fontSize: '7px'
  },
  heatmapHeader: {
    textAlign: 'center',
    fontWeight: 700,
    letterSpacing: '0.02em',
    color: theme.muted,
    padding: '2px'
  },
  heatmapRowLabel: {
    fontWeight: 700,
    color: theme.textSecondary,
    padding: '2px 0'
  },
  heatmapCell: {
    ...shorthands.border('1px', 'solid', theme.borderStrong),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '28px',
    padding: '2px',
    fontWeight: 700,
    letterSpacing: '-0.01em'
  },
  severityItem: {
    ...shorthands.borderRadius(theme.radiusSm),
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 10px',
    marginBottom: '4px',
    fontSize: '8px',
    fontWeight: 600
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
    marginBottom: '16px'
  }
});

export interface IDashboardPrintKpi {
  title: string;
  value: string | number;
  description?: string;
}

export interface IDashboardPrintViewProps {
  title: string;
  subtitle: string;
  printedAt: string;
  kpis: IDashboardPrintKpi[];
  heatmapMatrix: HeatmapCell[][];
  severityCounts: Record<MatrixPriority, number>;
  recentRisks: IAsset[];
  statusChartData: IStatusChartItem[];
  categoryChartData: ICategoryChartItem[];
  priorityChartData: IPriorityChartItem[];
  financialExposure?: IFinancialExposure;
  getPriorityLabel: (risk: IAsset) => string;
  getStatusLabel: (status?: string) => string;
  formatDueDate: (risk: IAsset) => string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

export const DashboardPrintView: React.FC<IDashboardPrintViewProps> = ({
  title,
  subtitle,
  printedAt,
  kpis,
  heatmapMatrix,
  severityCounts,
  recentRisks,
  statusChartData,
  categoryChartData,
  priorityChartData,
  financialExposure,
  getPriorityLabel,
  getStatusLabel,
  formatDueDate
}) => {
  const styles = useDashboardPrintStyles();
  const layoutStyles = useLayoutStyles();
  const severityTotal =
    (severityCounts.Critical || 0) +
    (severityCounts.Major || 0) +
    (severityCounts.Moderate || 0) +
    (severityCounts.Low || 0);

  return (
    <div id="dashboard-print-root" className={`dashboard-print ${styles.root}`}>
      <div className={`${styles.header} dashboard-print-keep`}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        <p className={styles.printedAt}>Printed: {printedAt}</p>
      </div>

      <div className={`${layoutStyles.kpiGrid} dashboard-print-keep`}>
        {kpis.map((kpi) => (
          <div key={kpi.title} className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{kpi.title}</div>
            <div className={styles.kpiValue}>{kpi.value}</div>
            {kpi.description ? <div className={styles.kpiDescription}>{kpi.description}</div> : null}
          </div>
        ))}
      </div>

      {financialExposure && financialExposure.riskCount > 0 ? (
        <div className={`${styles.section} dashboard-print-section`} style={{ marginBottom: '12px' }}>
          <div className={styles.sectionTitle}>Financial Exposure</div>
          <div className={styles.exposureTotal}>{formatCurrency(financialExposure.totalExposure)}</div>
          <div className={styles.kpiDescription}>
            Based on {financialExposure.riskCount} active risk{financialExposure.riskCount === 1 ? '' : 's'} with
            potential cost
          </div>
          {financialExposure.topRisks.map((item) => (
            <div key={item.riskId} className={styles.exposureRow}>
              <span>
                {item.riskId} — {item.title}
              </span>
              <span>{formatCurrency(item.exposure)}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className={`${layoutStyles.matrixRow} dashboard-print-keep`}>
        <div className={`${styles.section} dashboard-print-section`}>
          <div className={styles.sectionTitle}>Risk Matrix</div>
          <div className={layoutStyles.heatmapGrid}>
            <div />
            {MATRIX_CONSEQUENCE_LABELS.map((label) => (
              <div key={label} className={layoutStyles.heatmapHeader}>
                {label}
              </div>
            ))}
            {heatmapMatrix.map((row, rowIdx) => (
              <React.Fragment key={`row-${rowIdx}`}>
                <div className={layoutStyles.heatmapRowLabel}>{MATRIX_LIKELIHOOD_LABELS[rowIdx]}</div>
                {row.map((cell) => {
                  const colors = HEATMAP_CELL_COLORS[cell.priority];
                  return (
                    <div
                      key={`${rowIdx}-${cell.consequenceIdx}`}
                      className={layoutStyles.heatmapCell}
                      style={{ backgroundColor: colors.background, color: colors.color }}
                    >
                      <span>{cell.priority}</span>
                      <span>({cell.count})</span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className={`${styles.section} dashboard-print-section`}>
          <div className={styles.sectionTitle}>Severity Summary</div>
          {(['Critical', 'Major', 'Moderate', 'Low'] as const).map((level) => {
            const colors = SEVERITY_COLORS[level];
            return (
              <div
                key={level}
                className={layoutStyles.severityItem}
                style={{ backgroundColor: colors.background, color: colors.color }}
              >
                <span>{level}</span>
                <span>{severityCounts[level] || 0}</span>
              </div>
            );
          })}
          <div
            className={layoutStyles.severityItem}
            style={{
              backgroundColor: SEVERITY_COLORS.Total.background,
              color: SEVERITY_COLORS.Total.color,
              fontWeight: 800
            }}
          >
            <span>Total Active</span>
            <span>{severityTotal}</span>
          </div>
        </div>
      </div>

      <div className={`${styles.section} dashboard-print-section`} style={{ marginBottom: '12px' }}>
        <div className={styles.sectionTitle}>Risks ({recentRisks.length})</div>
        <table className={`${styles.table} dashboard-print-table`}>
          <thead>
            <tr>
              <th className={styles.tableHeaderCell}>Risk ID</th>
              <th className={styles.tableHeaderCell}>Title</th>
              <th className={styles.tableHeaderCell}>Priority</th>
              <th className={styles.tableHeaderCell}>Status</th>
              <th className={styles.tableHeaderCell}>Due Date</th>
              <th className={styles.tableHeaderCell}>Category</th>
            </tr>
          </thead>
          <tbody>
            {recentRisks.map((risk) => (
              <tr key={risk.Id}>
                <td className={styles.tableCell}>{risk.AM_AssetId || risk.Id}</td>
                <td className={styles.tableCell}>{risk.Title || '—'}</td>
                <td className={styles.tableCell}>{getPriorityLabel(risk)}</td>
                <td className={styles.tableCell}>{getStatusLabel(resolveAssetStatusTitle(risk))}</td>
                <td className={styles.tableCell}>{formatDueDate(risk)}</td>
                <td className={styles.tableCell}>{risk.RiskCategory?.Title || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`${layoutStyles.chartsRow} dashboard-print-charts-row`}>
        <div className={`${styles.section} dashboard-print-section`}>
          <div className={styles.sectionTitle}>Status Distribution</div>
          {statusChartData.map((item) => (
            <div key={item.name} className={styles.listRow}>
              <span>{item.name}</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>

        <div className={`${styles.section} dashboard-print-section`}>
          <div className={styles.sectionTitle}>Risk Status by Business</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeaderCell}>Category</th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>
                  Open
                </th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>
                  In Prog
                </th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>
                  Closed
                </th>
              </tr>
            </thead>
            <tbody>
              {categoryChartData.map((row) => (
                <tr key={row.category}>
                  <td className={styles.tableCell}>{row.category}</td>
                  <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                    {row.open}
                  </td>
                  <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                    {row.inProgress}
                  </td>
                  <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                    {row.closed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`${styles.section} dashboard-print-section`}>
          <div className={styles.sectionTitle}>Status by Priority</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>
                  C
                </th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>
                  M
                </th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>
                  Mod
                </th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>
                  L
                </th>
              </tr>
            </thead>
            <tbody>
              {priorityChartData.map((row) => (
                <tr key={row.label}>
                  <td className={styles.tableCell}>{row.label}</td>
                  <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                    {row.critical}
                  </td>
                  <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                    {row.major}
                  </td>
                  <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                    {row.moderate}
                  </td>
                  <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                    {row.low}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
