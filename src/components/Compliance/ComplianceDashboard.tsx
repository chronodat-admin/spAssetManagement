import * as React from 'react';
import {
  Badge,
  Card,
  ProgressBar,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens
} from '@fluentui/react-components';
import {
  AddRegular,
  ArrowTrendingLinesRegular,
  CheckmarkCircleRegular,
  ClipboardTaskListLtrRegular,
  DataBarVerticalRegular,
  DocumentCheckmarkRegular,
  ShieldCheckmarkRegular,
  ShieldRegular,
  TaskListLtrRegular
} from '@fluentui/react-icons';
import { IComplianceAssessment, IComplianceFramework } from '../../models/ICompliance';
import { ComplianceService } from '../../services/ComplianceService';
import {
  getAssessmentProgressRate,
  getAssessmentStatusAppearance,
  getComplianceRate,
  getComplianceRateColor,
  summarizeAssessments
} from '../../utils/complianceAnalytics';
import { DashboardChartCard } from '../Dashboard/DashboardChartCard';
import { DashboardSectionHeader } from '../Dashboard/DashboardSectionHeader';
import { EmptyState } from '../Layout/EmptyState';
import { getDataTableLayoutStyle, getListColumnStyle, DATA_TABLE_CLASS } from '../../lib/list-view/columnWidths';
import { useContentCardStyles } from '../Layout/ContentCard';
import { ChartSuspense } from '../Charts/ChartSuspense';
import { ComplianceDashboardPrintView } from './ComplianceDashboardPrintView';import { AppMessageBar } from '../Layout/AppMessageBar';


const ComplianceAssessmentStatusChart = React.lazy(() =>
  import('./ComplianceAssessmentStatusChart').then((m) => ({
    default: m.ComplianceAssessmentStatusChart
  }))
);
const ComplianceByAssessmentChart = React.lazy(() =>
  import('./ComplianceByAssessmentChart').then((m) => ({
    default: m.ComplianceByAssessmentChart
  }))
);

const FRAMEWORK_ACCENTS = [
  'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
  'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
  'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
  'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
  'linear-gradient(135deg, #ec4899 0%, #e11d48 100%)',
  'linear-gradient(135deg, #059669 0%, #047857 100%)'
];

function getFrameworkAccent(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i += 1) {
    hash = (hash + code.charCodeAt(i) * (i + 1)) % FRAMEWORK_ACCENTS.length;
  }
  return FRAMEWORK_ACCENTS[hash];
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL
  },
  statCard: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    overflow: 'visible',
    minWidth: 0
  },
  statInner: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: tokens.spacingVerticalM
  },
  statValue: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1.1,
    '@media (max-width: 768px)': {
      fontSize: tokens.fontSizeHero700
    }
  },
  statIcon: {
    fontSize: '28px',
    opacity: 0.85
  },
  statIconIndigo: {
    color: '#6366f1'
  },
  statIconBlue: {
    color: '#2563eb'
  },
  statIconGreen: {
    color: '#16a34a'
  },
  statIconTeal: {
    color: '#0d9488'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalL,
    '@media (max-width: 1100px)': {
      gridTemplateColumns: '1fr'
    }
  },
  frameworkSection: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    overflow: 'hidden',
    minWidth: 0,
    marginBottom: tokens.spacingVerticalL
  },
  frameworkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalL,
    '@media (max-width: 768px)': {
      padding: tokens.spacingHorizontalM,
      paddingBottom: tokens.spacingVerticalM
    }
  },
  frameworkCard: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingHorizontalM,
    cursor: 'pointer',
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    transitionProperty: 'box-shadow, transform, border-color',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
    ':hover': {
      boxShadow: tokens.shadow16,
      transform: 'translateY(-2px)',
      borderTopColor: tokens.colorBrandStroke1
    }
  },
  frameworkHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS
  },
  frameworkIcon: {
    width: '40px',
    height: '40px',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '20px',
    flexShrink: 0
  },
  frameworkMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0
  },
  frameworkCode: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200
  },
  frameworkControls: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200
  },
  tableSection: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    overflow: 'hidden',
    minWidth: 0
  },
  tableScroll: {
    overflowX: 'auto',
    width: '100%',
    WebkitOverflowScrolling: 'touch'
  },
  complianceCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    minWidth: '120px'
  },
  complianceRate: {
    fontWeight: tokens.fontWeightSemibold
  },
  progressCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    minWidth: '140px'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    minHeight: '320px',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3
  },
  titleLink: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    color: tokens.colorBrandForeground1,
    cursor: 'pointer',
    textAlign: 'left',
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    ':hover': {
      textDecoration: 'underline'
    }
  }
});

export interface IComplianceDashboardProps {
  complianceService: ComplianceService;
  refreshKey?: number;
  onOpenFramework: (frameworkId: number) => void;
  onOpenAssessment: (assessmentId: number) => void;
  printTitle?: string;
  printSubtitle?: string;
}

export const ComplianceDashboard: React.FC<IComplianceDashboardProps> = ({
  complianceService,
  refreshKey = 0,
  onOpenFramework,
  onOpenAssessment,
  printTitle,
  printSubtitle
}) => {
  const styles = useStyles();
  const cardStyles = useContentCardStyles();
  const [frameworks, setFrameworks] = React.useState<IComplianceFramework[]>([]);
  const [assessments, setAssessments] = React.useState<IComplianceAssessment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const previousRefreshKeyRef = React.useRef(refreshKey);

  React.useEffect(() => {
    let active = true;
    const forceRefresh = refreshKey !== previousRefreshKeyRef.current;
    previousRefreshKeyRef.current = refreshKey;

    const load = async (refresh: boolean, showSpinner: boolean): Promise<void> => {
      if (showSpinner) {
        setLoading(true);
      }
      setError('');
      try {
        const data = await complianceService.getComplianceDashboardData(refresh);
        if (active) {
          setFrameworks(data.frameworks);
          setAssessments(data.assessments);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load compliance dashboard.');
        }
      } finally {
        if (active && showSpinner) {
          setLoading(false);
        }
      }
    };

    void (async () => {
      await load(forceRefresh, true);
      try {
        await complianceService.waitForComplianceSeed();
        if (active) {
          await load(true, false);
        }
      } catch {
        /* Background seed is best-effort; dashboard already shows current data. */
      }
    })();

    return () => {
      active = false;
    };
  }, [complianceService, refreshKey]);

  if (loading) {
    return (
      <div className={styles.emptyState} role="status" aria-busy="true" aria-label="Loading compliance dashboard">
        <Spinner
          size="large"
          label="Loading compliance dashboard..."
        />
      </div>
    );
  }

  const summary = summarizeAssessments(assessments);
  const stats = [
    {
      label: 'Active Frameworks',
      value: frameworks.length,
      icon: <DocumentCheckmarkRegular className={mergeClasses(styles.statIcon, styles.statIconIndigo)} />
    },
    {
      label: 'Assessments In Progress',
      value: summary.inProgressCount,
      icon: <TaskListLtrRegular className={mergeClasses(styles.statIcon, styles.statIconBlue)} />
    },
    {
      label: 'Overall Compliance',
      value: `${summary.overallComplianceRate}%`,
      valueColor: getComplianceRateColor(summary.overallComplianceRate),
      icon: <ShieldRegular className={mergeClasses(styles.statIcon, styles.statIconGreen)} />
    },
    {
      label: 'Controls Assessed',
      value: `${summary.totalAssessed} / ${summary.totalItems}`,
      icon: <CheckmarkCircleRegular className={mergeClasses(styles.statIcon, styles.statIconTeal)} />
    }
  ];

  return (
    <div className={styles.root}>
      <div className="dashboard-screen">
      {error && (
        <AppMessageBar intent="error">{error}</AppMessageBar>
      )}

      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <Card key={stat.label} className={styles.statCard}>
            <div className={styles.statInner}>
              <div>
                <div className={styles.statValue} style={stat.valueColor ? { color: stat.valueColor } : undefined}>
                  {stat.value}
                </div>
                <Text size={300}>{stat.label}</Text>
              </div>
              {stat.icon}
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.chartsGrid}>
        <DashboardChartCard
          title="Compliance by Assessment"
          description="Compliance rate across each active assessment"
          icon={<DataBarVerticalRegular />}
          iconTone="indigo"
        >
          {assessments.length === 0 ? (
            <EmptyState
              bordered
              icon={<ClipboardTaskListLtrRegular />}
              title="No assessments yet"
              description="Create an assessment from a framework to track control compliance and progress here."
            />
          ) : (
            <ChartSuspense>
              <ComplianceByAssessmentChart
                assessments={assessments}
                onOpenAssessment={onOpenAssessment}
              />
            </ChartSuspense>
          )}
        </DashboardChartCard>

        <DashboardChartCard
          title="Assessment Status"
          description="Draft, in progress, and completed assessments"
          icon={<ArrowTrendingLinesRegular />}
          iconTone="teal"
        >
          <ChartSuspense>
            <ComplianceAssessmentStatusChart statusCounts={summary.statusCounts} />
          </ChartSuspense>
        </DashboardChartCard>
      </div>

      <div className={styles.frameworkSection}>
        <DashboardSectionHeader
          title="Active Frameworks"
          description={`${frameworks.length} framework${frameworks.length === 1 ? '' : 's'} available for assessment`}
          icon={<ShieldCheckmarkRegular />}
          iconTone="pink"
        />
        {frameworks.length === 0 ? (
          <EmptyState
            icon={<ShieldRegular />}
            title="No active frameworks"
            description="Enable frameworks in Compliance Settings to begin tracking controls."
          />
        ) : (
          <div className={styles.frameworkGrid}>
            {frameworks.map((framework) => (
              <div
                key={framework.id}
                className={styles.frameworkCard}
                onClick={() => onOpenFramework(framework.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => event.key === 'Enter' && onOpenFramework(framework.id)}
              >
                <div className={styles.frameworkHeader}>
                  <div
                    className={styles.frameworkIcon}
                    style={{ backgroundImage: getFrameworkAccent(framework.code) }}
                    aria-hidden
                  >
                    <ShieldRegular />
                  </div>
                  {!framework.isBuiltIn ? (
                    <Badge appearance="outline" color="brand" size="small">
                      Custom
                    </Badge>
                  ) : null}
                </div>
                <div className={styles.frameworkMeta}>
                  <Text weight="semibold">{framework.name}</Text>
                  <span className={styles.frameworkCode}>{framework.code}</span>
                  <span className={styles.frameworkControls}>
                    <DocumentCheckmarkRegular fontSize={14} />
                    {framework.controlCount} control{framework.controlCount === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.tableSection}>
        <DashboardSectionHeader
          title="Assessments"
          description="Track progress and compliance across all assessments"
          icon={<TaskListLtrRegular />}
          iconTone="orange"
        />
        <div className={styles.tableScroll}>
          <Table
            aria-label="Compliance assessments"
            className={DATA_TABLE_CLASS}
            style={getDataTableLayoutStyle(900)}
          >
            <TableHeader>
              <TableRow>
                <TableHeaderCell
                  className={cardStyles.tableHeaderCell}
                  style={getListColumnStyle('assessment')}
                >
                  Assessment
                </TableHeaderCell>
                <TableHeaderCell
                  className={cardStyles.tableHeaderCell}
                  style={getListColumnStyle('framework')}
                >
                  Framework
                </TableHeaderCell>
                <TableHeaderCell
                  className={cardStyles.tableHeaderCell}
                  style={getListColumnStyle('status')}
                >
                  Status
                </TableHeaderCell>
                <TableHeaderCell
                  className={cardStyles.tableHeaderCell}
                  style={getListColumnStyle('compliance')}
                >
                  Compliance
                </TableHeaderCell>
                <TableHeaderCell
                  className={cardStyles.tableHeaderCell}
                  style={getListColumnStyle('progress')}
                >
                  Progress
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState
                      icon={<AddRegular />}
                      title="No assessments yet"
                      description="Start an assessment from any active framework to populate this list."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                assessments.map((assessment) => {
                  const complianceRate = getComplianceRate(assessment);
                  const progressRate = getAssessmentProgressRate(assessment);
                  const statusAppearance = getAssessmentStatusAppearance(assessment.status);
                  const rateColor = getComplianceRateColor(complianceRate);

                  return (
                    <TableRow key={assessment.id}>
                      <TableCell
                        className={cardStyles.dataTableCellWrap}
                        style={getListColumnStyle('assessment')}
                      >
                        <button
                          type="button"
                          className={styles.titleLink}
                          onClick={() => onOpenAssessment(assessment.id)}
                        >
                          {assessment.name}
                        </button>
                      </TableCell>
                      <TableCell
                        className={cardStyles.dataTableCellWrap}
                        style={getListColumnStyle('framework')}
                      >
                        <Text block size={300}>
                          {assessment.frameworkName}
                        </Text>
                        <Text block size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          {assessment.frameworkCode}
                        </Text>
                      </TableCell>
                      <TableCell style={getListColumnStyle('status')}>
                        <Badge appearance="filled" color={statusAppearance.color}>
                          {assessment.status}
                        </Badge>
                      </TableCell>
                      <TableCell style={getListColumnStyle('compliance')}>
                        <div className={styles.complianceCell}>
                          <span className={styles.complianceRate} style={{ color: rateColor }}>
                            {complianceRate}%
                          </span>
                          <ProgressBar
                            value={complianceRate / 100}
                            color={complianceRate >= 70 ? 'success' : complianceRate >= 40 ? 'warning' : 'error'}
                            thickness="medium"
                          />
                        </div>
                      </TableCell>
                      <TableCell style={getListColumnStyle('progress')}>
                        <div className={styles.progressCell}>
                          <Text size={200}>
                            {assessment.assessedItems} / {assessment.totalItems} controls
                          </Text>
                          <ProgressBar value={progressRate / 100} thickness="medium" />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      </div>

      <ComplianceDashboardPrintView
        title={printTitle || 'Compliance Dashboard'}
        subtitle={printSubtitle || 'Framework assessments, compliance posture, and audit readiness.'}
        printedAt={new Date().toLocaleString()}
        kpis={stats.map((stat) => ({
          title: stat.label,
          value: stat.value,
          valueColor: stat.valueColor
        }))}
        frameworks={frameworks}
        assessments={assessments}
        statusCounts={summary.statusCounts}
      />
    </div>
  );
};

export const ComplianceDashboardIcon = ShieldCheckmarkRegular;
