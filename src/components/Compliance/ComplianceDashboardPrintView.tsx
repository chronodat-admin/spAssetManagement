import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { AssessmentStatus, IComplianceAssessment, IComplianceFramework } from '../../models/ICompliance';
import {
  getAssessmentProgressRate,
  getComplianceRate,
  getComplianceRateColor
} from '../../utils/complianceAnalytics';
import { dashboardPrintTheme } from '../../utils/dashboardPrintTheme';
import { useDashboardPrintStyles } from '../Dashboard/dashboardPrintStyles';

const theme = dashboardPrintTheme;

const STATUS_COLORS: Record<AssessmentStatus, { background: string; color: string }> = {
  Draft: { background: '#64748b', color: '#ffffff' },
  'In Progress': { background: theme.brand, color: '#ffffff' },
  Complete: { background: '#059669', color: '#ffffff' }
};

const useLayoutStyles = makeStyles({
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '10px',
    marginBottom: '16px'
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
    gap: '12px',
    marginBottom: '16px'
  },
  statusItem: {
    ...shorthands.borderRadius(theme.radiusSm),
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 10px',
    marginBottom: '4px',
    fontSize: '8px',
    fontWeight: 600
  }
});

export interface IComplianceDashboardPrintKpi {
  title: string;
  value: string | number;
  valueColor?: string;
}

export interface IComplianceDashboardPrintViewProps {
  title: string;
  subtitle: string;
  printedAt: string;
  kpis: IComplianceDashboardPrintKpi[];
  frameworks: IComplianceFramework[];
  assessments: IComplianceAssessment[];
  statusCounts: Record<AssessmentStatus, number>;
}

export const ComplianceDashboardPrintView: React.FC<IComplianceDashboardPrintViewProps> = ({
  title,
  subtitle,
  printedAt,
  kpis,
  frameworks,
  assessments,
  statusCounts
}) => {
  const styles = useDashboardPrintStyles();
  const layoutStyles = useLayoutStyles();
  const statusTotal =
    (statusCounts.Draft || 0) + (statusCounts['In Progress'] || 0) + (statusCounts.Complete || 0);

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
            <div className={styles.kpiValue} style={kpi.valueColor ? { color: kpi.valueColor } : undefined}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div className={`${layoutStyles.chartsRow} dashboard-print-charts-row`}>
        <div className={`${styles.section} dashboard-print-section`}>
          <div className={styles.sectionTitle}>Compliance by Assessment</div>
          {assessments.length === 0 ? (
            <span className={styles.muted}>No assessments yet.</span>
          ) : (
            <table className={`${styles.table} dashboard-print-table`}>
              <thead>
                <tr>
                  <th className={styles.tableHeaderCell}>Assessment</th>
                  <th className={styles.tableHeaderCell}>Framework</th>
                  <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>
                    Compliance
                  </th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => {
                  const rate = getComplianceRate(assessment);
                  return (
                    <tr key={assessment.id}>
                      <td className={styles.tableCell}>{assessment.name}</td>
                      <td className={styles.tableCell}>
                        {assessment.frameworkName}
                        <div className={styles.muted}>{assessment.frameworkCode}</div>
                      </td>
                      <td className={styles.tableCell} style={{ textAlign: 'right', color: getComplianceRateColor(rate) }}>
                        {rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className={`${styles.section} dashboard-print-section`}>
          <div className={styles.sectionTitle}>Assessment Status</div>
          {(['Draft', 'In Progress', 'Complete'] as const).map((status) => {
            const colors = STATUS_COLORS[status];
            return (
              <div
                key={status}
                className={layoutStyles.statusItem}
                style={{ backgroundColor: colors.background, color: colors.color }}
              >
                <span>{status}</span>
                <span>{statusCounts[status] || 0}</span>
              </div>
            );
          })}
          <div
            className={layoutStyles.statusItem}
            style={{ backgroundColor: theme.brand, color: '#ffffff', fontWeight: 800 }}
          >
            <span>Total</span>
            <span>{statusTotal}</span>
          </div>
        </div>
      </div>

      <div className={`${styles.section} dashboard-print-section`} style={{ marginBottom: '12px' }}>
        <div className={styles.sectionTitle}>Active Frameworks ({frameworks.length})</div>
        {frameworks.length === 0 ? (
          <span className={styles.muted}>No active frameworks.</span>
        ) : (
          <table className={`${styles.table} dashboard-print-table`}>
            <thead>
              <tr>
                <th className={styles.tableHeaderCell}>Framework</th>
                <th className={styles.tableHeaderCell}>Code</th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>
                  Controls
                </th>
                <th className={styles.tableHeaderCell}>Type</th>
              </tr>
            </thead>
            <tbody>
              {frameworks.map((framework) => (
                <tr key={framework.id}>
                  <td className={styles.tableCell}>{framework.name}</td>
                  <td className={styles.tableCell}>{framework.code}</td>
                  <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                    {framework.controlCount}
                  </td>
                  <td className={styles.tableCell}>{framework.isBuiltIn ? 'Built-in' : 'Custom'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={`${styles.section} dashboard-print-section`}>
        <div className={styles.sectionTitle}>Assessments ({assessments.length})</div>
        {assessments.length === 0 ? (
          <span className={styles.muted}>No assessments yet.</span>
        ) : (
          <table className={`${styles.table} dashboard-print-table`}>
            <thead>
              <tr>
                <th className={styles.tableHeaderCell}>Assessment</th>
                <th className={styles.tableHeaderCell}>Framework</th>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>
                  Compliance
                </th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((assessment) => {
                const complianceRate = getComplianceRate(assessment);
                const progressRate = getAssessmentProgressRate(assessment);
                return (
                  <tr key={assessment.id}>
                    <td className={styles.tableCell}>{assessment.name}</td>
                    <td className={styles.tableCell}>
                      {assessment.frameworkName}
                      <div className={styles.muted}>{assessment.frameworkCode}</div>
                    </td>
                    <td className={styles.tableCell}>{assessment.status}</td>
                    <td
                      className={styles.tableCell}
                      style={{ textAlign: 'right', color: getComplianceRateColor(complianceRate) }}
                    >
                      {complianceRate}%
                    </td>
                    <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                      {assessment.assessedItems} / {assessment.totalItems} ({progressRate}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
