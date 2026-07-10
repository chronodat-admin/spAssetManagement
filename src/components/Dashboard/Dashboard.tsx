import * as React from 'react';
import {
  Card,
  CardHeader,
  Link,
  makeStyles,
  mergeClasses,
  shorthands,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title3,
  tokens
} from '@fluentui/react-components';
import { AppMessageBar } from '../Layout/AppMessageBar';
import {
  BoxRegular,
  ArrowSyncRegular,
  BuildingRegular,
  CalendarLtrRegular,
  ChartMultipleRegular,
  CheckmarkCircleRegular,
  ClipboardTaskListLtrRegular,
  DataBarVerticalRegular,
  FolderOpenRegular,
  LocationRegular,
  PersonRegular,
  ShieldRegular,
  TargetRegular,
  WarningRegular
} from '@fluentui/react-icons';
import { IAppSettings, IHeatmapDrillDownFilter, ILookupItem, IAsset } from '../../models/IAssetApp';
import {
  filterDashboardRisks,
  getAssetCategoryChartData,
  getAssetDashboardStats,
  getAssetTypeChartData,
  getCategoryChartData,
  getFinancialExposure,
  getLocationValueChartData,
  getPriorityChartData,
  getPurchaseTrendChartData,
  getRiskNumericRating,
  getStatusChartData,
  getVendorChartData,
  getWarrantyExpiringChartData,
  IDashboardFilters
} from '../../utils/dashboardAnalytics';
import { parseWorkflowSettings } from '../../lib/workflow-settings/storage';
import { classifyRiskStatus } from '../../lib/workflow-settings/utils';
import { resolveAssetStatusTitle } from '../../utils/dashboardAnalytics';
import { buildConsequenceRatingMap, buildLikelihoodRatingMap } from '../../utils/ratingLookup';
import { isDashboardHoverEnabled, isDashboardFinancialExposureEnabled, isFinancialExposureDismissed, dismissFinancialExposure } from '../../utils/dashboardSettings';
import { buildHeatmapMatrix, countByMatrixPriority, getAverageRiskAgeDays, HeatmapCell, isActiveRisk } from '../../utils/riskMatrix';
import { isDueThisWeekRisk, isDueTodayRisk, isOverdueRisk } from '../../utils/assetDateFilters';
import { getMatrixPriority } from '../../utils/priorityCalculator';
import { formatAssetValueSummary } from '../../utils/riskRatingCalculator';
import { FullColorBadge, RiskPriorityBadge, RiskStatusBadge } from '../Assets/AssetColoredBadges';
import { FinancialExposureCard } from './FinancialExposureCard';
import { DashboardChartCard } from './DashboardChartCard';
import { DashboardSectionHeader } from './DashboardSectionHeader';
import { AssetHeatmap } from './AssetHeatmap';
import { ChartSuspense } from '../Charts/ChartSuspense';
import { DashboardPrintView } from './DashboardPrintView';

const AssetCategoryChart = React.lazy(() =>
  import('./AssetCategoryChart').then((m) => ({ default: m.AssetCategoryChart }))
);
const AssetPriorityChart = React.lazy(() =>
  import('./AssetPriorityChart').then((m) => ({ default: m.AssetPriorityChart }))
);
const AssetStatusChart = React.lazy(() =>
  import('./AssetStatusChart').then((m) => ({ default: m.AssetStatusChart }))
);
const SeveritySummaryChart = React.lazy(() =>
  import('./SeveritySummaryChart').then((m) => ({ default: m.SeveritySummaryChart }))
);
const DashboardDonutChart = React.lazy(() =>
  import('./DashboardDonutChart').then((m) => ({ default: m.DashboardDonutChart }))
);
const DashboardTrendChart = React.lazy(() =>
  import('./DashboardTrendChart').then((m) => ({ default: m.DashboardTrendChart }))
);
import { useAppTabStyles } from '../Layout/appTabStyles';
import { getDataTableLayoutStyle, getListColumnStyle, DATA_TABLE_CLASS } from '../../lib/list-view/columnWidths';
import { useContentCardStyles } from '../Layout/ContentCard';
import { UserCell } from '../PeoplePicker/UserAvatar';
import { isAssignedToUser } from '../../utils/assignmentUtils';

const useStyles = makeStyles({
  root: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr'
    }
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
    color: tokens.colorBrandForeground1,
    opacity: 0.85
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalL,
    '@media (max-width: 1100px)': {
      gridTemplateColumns: '1fr'
    }
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalL,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr'
    }
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
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalL,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr'
    }
  },
  card: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    overflow: 'visible',
    minWidth: 0
  },
  emptyCell: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalXL
  },
  tableScroll: {
    overflowX: 'auto',
    width: '100%',
    WebkitOverflowScrolling: 'touch'
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
  },
  titleColumn: {
    minWidth: '220px',
    width: '220px',
    verticalAlign: 'middle'
  },
  titleCellButton: {
    display: 'block',
    width: '100%',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    lineHeight: tokens.lineHeightBase300
  }
});

export interface IDashboardProps {
  risks: IAsset[];
  businesses: ILookupItem[];
  projects: ILookupItem[];
  likelihoodItems: ILookupItem[];
  consequenceItems: ILookupItem[];
  settings?: IAppSettings;
  userId?: number;
  userEmail?: string;
  userDisplayName?: string;
  filters?: IDashboardFilters;
  printTitle?: string;
  printSubtitle?: string;
  onEditRisk?: (risk: IAsset) => void;
  onViewHeatmapRisks?: (risks: IAsset[], filter: IHeatmapDrillDownFilter) => void;
  onNavigateToAssetValueSummary?: () => void;
}

type LatestTab = 'recent' | 'assigned' | 'overdue' | 'dueToday' | 'dueWeek' | 'available' | 'inRepair';

function formatAssetCost(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '—';
  }
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export const Dashboard: React.FC<IDashboardProps> = ({
  risks,
  likelihoodItems,
  consequenceItems,
  settings,
  userId,
  userEmail,
  userDisplayName,
  filters: filtersProp,
  printTitle,
  printSubtitle,
  onEditRisk,
  onViewHeatmapRisks,
  onNavigateToAssetValueSummary
}) => {
  const styles = useStyles();
  const tabStyles = useAppTabStyles();
  const cardStyles = useContentCardStyles();
  const filters = React.useMemo<IDashboardFilters>(
    () => filtersProp ?? { businessId: 'all', projectId: 'all' },
    [filtersProp]
  );
  const workflowSettings = React.useMemo(() => parseWorkflowSettings(settings), [settings]);
  const [latestTab, setLatestTab] = React.useState<LatestTab>('recent');
  const [financialExposureDismissed, setFinancialExposureDismissed] = React.useState(
    () => isFinancialExposureDismissed()
  );

  const likelihoodRatings = React.useMemo(
    () => buildLikelihoodRatingMap(likelihoodItems),
    [likelihoodItems]
  );
  const consequenceRatings = React.useMemo(
    () => buildConsequenceRatingMap(consequenceItems),
    [consequenceItems]
  );

  const filteredRisks = React.useMemo(
    () => filterDashboardRisks(risks, filters),
    [risks, filters]
  );

  const assetStats = React.useMemo(() => getAssetDashboardStats(filteredRisks), [filteredRisks]);
  const useAssetKpis = likelihoodItems.length === 0 && consequenceItems.length === 0;

  const openCount = filteredRisks.filter(
    (r) => classifyRiskStatus(resolveAssetStatusTitle(r), workflowSettings) === 'open'
  ).length;
  const inProgressCount = filteredRisks.filter(
    (r) => classifyRiskStatus(resolveAssetStatusTitle(r), workflowSettings) === 'inProgress'
  ).length;
  const closedCount = filteredRisks.filter(
    (r) => classifyRiskStatus(resolveAssetStatusTitle(r), workflowSettings) === 'closed'
  ).length;
  const activeRisks = filteredRisks.filter((risk) => isActiveRisk(risk, workflowSettings));
  const criticalCount = activeRisks.filter(
    (r) => getMatrixPriority(r.Likelihood, r.Consequence).level === 'Critical'
  ).length;
  const avgAgeDays = getAverageRiskAgeDays(filteredRisks);
  const severityCounts = countByMatrixPriority(filteredRisks, true);
  const financialExposure = getFinancialExposure(filteredRisks);
  const showFinancialExposure =
    !useAssetKpis &&
    isDashboardFinancialExposureEnabled(settings) &&
    !financialExposureDismissed &&
    financialExposure.riskCount > 0;
  const statusChartData = getStatusChartData(filteredRisks, workflowSettings);
  const categoryChartData = useAssetKpis
    ? getAssetCategoryChartData(filteredRisks)
    : getCategoryChartData(filteredRisks, workflowSettings);
  const priorityChartData = getPriorityChartData(filteredRisks, workflowSettings);

  const locationValueChartData = React.useMemo(
    () =>
      getLocationValueChartData(filteredRisks)
        .slice(0, 8)
        .map((item) => ({ label: item.location, value: item.value })),
    [filteredRisks]
  );
  const warrantyChartData = React.useMemo(
    () =>
      getWarrantyExpiringChartData(filteredRisks).map((item) => ({
        label: item.bucket,
        value: item.count
      })),
    [filteredRisks]
  );
  const assetTypeChartData = React.useMemo(
    () =>
      getAssetTypeChartData(filteredRisks)
        .slice(0, 8)
        .map((item) => ({ label: item.type, value: item.count })),
    [filteredRisks]
  );
  const vendorChartData = React.useMemo(
    () => getVendorChartData(filteredRisks).map((item) => ({ label: item.vendor, value: item.count })),
    [filteredRisks]
  );
  const purchaseTrendChartData = React.useMemo(
    () =>
      getPurchaseTrendChartData(filteredRisks).map((item) => ({
        label: item.month,
        value: item.count
      })),
    [filteredRisks]
  );

  const latestTabs: Array<{ id: LatestTab; label: string }> = useAssetKpis
    ? [
        { id: 'recent', label: 'Latest' },
        { id: 'assigned', label: 'Assigned to me' },
        { id: 'available', label: 'Available' },
        { id: 'inRepair', label: 'In repair' }
      ]
    : [
        { id: 'recent', label: 'Latest' },
        { id: 'assigned', label: 'Assigned to me' },
        { id: 'overdue', label: 'Overdue' },
        { id: 'dueToday', label: 'Due today' },
        { id: 'dueWeek', label: 'Due this week' }
      ];

  const recentRisks = React.useMemo(() => {
    let source = [...filteredRisks];
    switch (latestTab) {
      case 'assigned':
        source = source.filter((risk) =>
          isAssignedToUser(risk, { id: userId, email: userEmail, displayName: userDisplayName })
        );
        break;
      case 'available':
        source = source.filter((risk) => resolveAssetStatusTitle(risk) === 'Available');
        break;
      case 'inRepair':
        source = source.filter((risk) => resolveAssetStatusTitle(risk) === 'In Repair');
        break;
      case 'overdue':
        source = source.filter((risk) => isOverdueRisk(risk));
        break;
      case 'dueToday':
        source = source.filter((risk) => isDueTodayRisk(risk));
        break;
      case 'dueWeek':
        source = source.filter((risk) => isDueThisWeekRisk(risk));
        break;
      default:
        break;
    }

    return source
      .sort((a, b) => (b.Modified || '').localeCompare(a.Modified || ''))
      .slice(0, 10);
  }, [filteredRisks, latestTab, userId, userEmail, userDisplayName]);

  const handleHeatmapViewAll = (cell: HeatmapCell, variant: 'inherent' | 'residual'): void => {
    if (!onViewHeatmapRisks) {
      return;
    }
    onViewHeatmapRisks(cell.risks, {
      variant,
      likelihoodIdx: cell.likelihoodIdx,
      consequenceIdx: cell.consequenceIdx,
      priority: cell.priority
    });
  };

  const hoverEnabled = isDashboardHoverEnabled(settings);

  const stats = useAssetKpis
    ? [
        { label: 'Total Assets', value: assetStats.total, icon: <BoxRegular className={styles.statIcon} /> },
        { label: 'Available', value: assetStats.available, icon: <CheckmarkCircleRegular className={styles.statIcon} /> },
        { label: 'Assigned', value: assetStats.assigned, icon: <PersonRegular className={styles.statIcon} /> },
        { label: 'In Repair', value: assetStats.inRepair, icon: <ArrowSyncRegular className={styles.statIcon} /> },
        {
          label: 'Warranty (90d)',
          value: assetStats.warrantyExpiring,
          icon: <WarningRegular className={styles.statIcon} />
        }
      ]
    : [
        { label: 'Open Items', value: openCount, icon: <FolderOpenRegular className={styles.statIcon} /> },
        {
          label: 'In Progress',
          value: inProgressCount,
          icon: <ArrowSyncRegular className={styles.statIcon} />
        },
        {
          label: 'Closed',
          value: closedCount,
          icon: <CheckmarkCircleRegular className={styles.statIcon} />
        },
        {
          label: 'Critical (Active)',
          value: criticalCount,
          icon: <WarningRegular className={styles.statIcon} />
        },
        {
          label: 'Avg Item Age (days)',
          value: avgAgeDays,
          icon: <CalendarLtrRegular className={styles.statIcon} />
        }
      ];

  const printHeatmapMatrix = React.useMemo(
    () => buildHeatmapMatrix(filteredRisks, true),
    [filteredRisks]
  );

  const printRecentRisks = React.useMemo(
    () => [...filteredRisks].sort((a, b) => (b.Modified || '').localeCompare(a.Modified || '')),
    [filteredRisks]
  );

  const formatPrintDueDate = React.useCallback((risk: IAsset): string => {
    if (!risk.RiskDueDate) {
      return '—';
    }
    const parsed = new Date(risk.RiskDueDate);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
  }, []);

  const getPrintPriorityLabel = React.useCallback(
    (risk: IAsset): string => getMatrixPriority(risk.Likelihood, risk.Consequence).level,
    []
  );

  const getPrintStatusLabel = React.useCallback((status?: string): string => (status || 'Open').trim(), []);

  const printFinancialExposure =
    isDashboardFinancialExposureEnabled(settings) && financialExposure.riskCount > 0
      ? financialExposure
      : undefined;

  return (
    <div className={styles.root}>
      <div className="dashboard-screen">
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <Card key={stat.label} className={styles.statCard}>
            <div className={styles.statInner}>
              <div>
                <div className={styles.statValue}>{stat.value}</div>
                <Text size={300}>{stat.label}</Text>
              </div>
              {stat.icon}
            </div>
          </Card>
        ))}
      </div>

      {showFinancialExposure ? (
        <FinancialExposureCard
          exposure={financialExposure}
          onClose={() => {
            dismissFinancialExposure();
            setFinancialExposureDismissed(true);
          }}
        />
      ) : null}

      {!useAssetKpis ? (
        <div className={styles.mainGrid}>
          <Card className={styles.card}>
            <AssetHeatmap
              risks={filteredRisks}
              variant="inherent"
              subtitle="Inherent likelihood vs impact for open and in-progress items"
              activeOnly
              hoverEnabled={hoverEnabled}
              onRiskClick={onEditRisk}
              onViewAll={onViewHeatmapRisks ? handleHeatmapViewAll : undefined}
            />
          </Card>

          <Card className={styles.card}>
            <CardHeader
              header={<Title3 as="h2">Severity Summary</Title3>}
              description={
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Active items grouped by inherent priority
                </Text>
              }
            />
            <ChartSuspense>
              <SeveritySummaryChart counts={severityCounts} />
            </ChartSuspense>
          </Card>
        </div>
      ) : null}

      {!useAssetKpis && onNavigateToAssetValueSummary ? (
        <AppMessageBar intent="info" style={{ marginBottom: tokens.spacingVerticalL }}>
          Residual rating matrices are on the{' '}
          <Link as="button" onClick={onNavigateToAssetValueSummary}>
            Asset Rating
          </Link>{' '}
          page (inherent and residual side by side).
        </AppMessageBar>
      ) : null}

      <div className={styles.bottomGrid}>
        <Card className={styles.card}>
          <DashboardSectionHeader
            title={useAssetKpis ? 'Latest Assets' : 'Latest Items'}
            description={
              useAssetKpis
                ? 'Recently updated assets across your inventory'
                : 'Recently updated items across your portfolio'
            }
            icon={<ClipboardTaskListLtrRegular />}
            iconTone="teal"
          />
          <div className={tabStyles.tabBar} role="tablist" aria-label={useAssetKpis ? 'Latest assets views' : 'Latest items views'}>
            {latestTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={latestTab === tab.id}
                className={mergeClasses(
                  'asset-mgmt-tab',
                  tabStyles.tabButton,
                  latestTab === tab.id && 'asset-mgmt-tab--active',
                  latestTab === tab.id && tabStyles.tabButtonActive
                )}
                onClick={() => setLatestTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className={styles.tableScroll}>
          <Table
            aria-label={useAssetKpis ? 'Latest assets' : 'Latest items'}
            className={DATA_TABLE_CLASS}
            style={getDataTableLayoutStyle(useAssetKpis ? 920 : 980)}
          >
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('riskId')}>
                  {useAssetKpis ? 'Asset ID' : 'Item ID'}
                </TableHeaderCell>
                <TableHeaderCell
                  className={cardStyles.tableHeaderCell}
                  style={getListColumnStyle('title')}
                >
                  Title
                </TableHeaderCell>
                {!useAssetKpis ? (
                  <>
                    <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('priority')}>
                      Priority
                    </TableHeaderCell>
                    <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('rating')}>
                      Rating (L×C)
                    </TableHeaderCell>
                  </>
                ) : (
                  <>
                    <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('status')}>
                      Status
                    </TableHeaderCell>
                    <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('category')}>
                      Category
                    </TableHeaderCell>
                    <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('priority')}>
                      Assigned To
                    </TableHeaderCell>
                    <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('rating')}>
                      Cost
                    </TableHeaderCell>
                  </>
                )}
                {!useAssetKpis ? (
                  <>
                    <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('status')}>
                      Status
                    </TableHeaderCell>
                    <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('category')}>
                      Category
                    </TableHeaderCell>
                  </>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRisks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={useAssetKpis ? 6 : 6} className={styles.emptyCell}>
                    {useAssetKpis ? 'No assets match the current filters.' : 'No items match the current filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                recentRisks.map((risk) => {
                  const priority = getMatrixPriority(risk.Likelihood, risk.Consequence);
                  const numericRating = getRiskNumericRating(
                    risk,
                    likelihoodRatings,
                    consequenceRatings
                  );
                  return (
                    <TableRow key={risk.Id}>
                      <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('riskId')}>
                        {risk.AM_AssetId || risk.Id}
                      </TableCell>
                      <TableCell className={styles.titleColumn} style={getListColumnStyle('title')}>
                        {onEditRisk ? (
                          <button
                            type="button"
                            className={mergeClasses(styles.titleLink, styles.titleCellButton)}
                            onClick={() => onEditRisk(risk)}
                          >
                            {risk.Title}
                          </button>
                        ) : (
                          <Text weight="semibold">{risk.Title}</Text>
                        )}
                      </TableCell>
                      {useAssetKpis ? (
                        <>
                          <TableCell style={getListColumnStyle('status')}>
                            <RiskStatusBadge
                              status={resolveAssetStatusTitle(risk)}
                              workflowSettings={workflowSettings}
                            />
                          </TableCell>
                          <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('category')}>
                            {risk.AM_Category?.Title || risk.RiskCategory?.Title || '—'}
                          </TableCell>
                          <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('priority')}>
                            {risk.AM_AssignedTo ? (
                              <UserCell
                                name={risk.AM_AssignedTo.Title}
                                email={risk.AM_AssignedTo.Email}
                              />
                            ) : risk.AssignedTo?.length ? (
                              <UserCell
                                name={risk.AssignedTo.map((user) => user.Title).join(', ')}
                                email={risk.AssignedTo[0]?.Email}
                              />
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell style={getListColumnStyle('rating')}>{formatAssetCost(risk.AM_Cost)}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell style={getListColumnStyle('priority')}>
                            <RiskPriorityBadge priority={priority.level} />
                          </TableCell>
                          <TableCell style={getListColumnStyle('rating')}>
                            {numericRating ? (
                              <FullColorBadge
                                label={formatAssetValueSummary(numericRating.numericValue)}
                                backgroundColor="#0284c7"
                                color="#ffffff"
                              />
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell style={getListColumnStyle('status')}>
                            <RiskStatusBadge
                              status={resolveAssetStatusTitle(risk)}
                              workflowSettings={workflowSettings}
                            />
                          </TableCell>
                          <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('category')}>
                            {risk.RiskCategory?.Title || risk.AM_Category?.Title || '—'}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </Card>

        <DashboardChartCard
          title="Status Distribution"
          description={useAssetKpis ? 'Assets by current status' : 'Items by current status'}
          icon={<DataBarVerticalRegular />}
          iconTone="pink"
        >
          <ChartSuspense>
            <AssetStatusChart data={statusChartData} workflowSettings={workflowSettings} />
          </ChartSuspense>
        </DashboardChartCard>
      </div>

      <div className={styles.chartsGrid}>
        <DashboardChartCard
          title={useAssetKpis ? 'Assets by Category' : 'Status by Business'}
          description={
            useAssetKpis ? 'Asset counts grouped by category' : 'Item counts by business category'
          }
          icon={<TargetRegular />}
          iconTone="indigo"
        >
          <ChartSuspense>
            <AssetCategoryChart
              data={categoryChartData}
              variant={useAssetKpis ? 'asset' : 'risk'}
            />
          </ChartSuspense>
        </DashboardChartCard>

        {!useAssetKpis ? (
          <DashboardChartCard
            title="Status by Priority"
            description="Item counts by priority"
            icon={<ChartMultipleRegular />}
            iconTone="orange"
          >
            <ChartSuspense>
              <AssetPriorityChart data={priorityChartData} />
            </ChartSuspense>
          </DashboardChartCard>
        ) : (
          <DashboardChartCard
            title="Assets by Type"
            description="Inventory counts grouped by asset type"
            icon={<BoxRegular />}
            iconTone="orange"
          >
            <ChartSuspense>
              <DashboardDonutChart
                data={assetTypeChartData}
                emptyMessage="No asset type data available"
                centerLabel="Assets"
                tooltipLabel="Assets"
              />
            </ChartSuspense>
          </DashboardChartCard>
        )}
      </div>

      {useAssetKpis ? (
        <div className={styles.analyticsGrid}>
          <DashboardChartCard
            title="Value by Location"
            description="Share of total asset cost by location"
            icon={<LocationRegular />}
            iconTone="teal"
          >
            <ChartSuspense>
              <DashboardDonutChart
                data={locationValueChartData}
                emptyMessage="No location value data available"
                centerLabel="Total value"
                valueFormatter={formatAssetCost}
                tooltipLabel="Value"
              />
            </ChartSuspense>
          </DashboardChartCard>

          <DashboardChartCard
            title="Warranty Expiring"
            description="Assets with warranty ending in the next 90 days"
            icon={<ShieldRegular />}
            iconTone="orange"
          >
            <ChartSuspense>
              <DashboardTrendChart
                data={warrantyChartData}
                emptyMessage="No warranties expiring in the next 90 days"
                seriesLabel="Assets"
                stroke="#f59e0b"
                fill="rgba(245, 158, 11, 0.14)"
                variant="area"
              />
            </ChartSuspense>
          </DashboardChartCard>

          <DashboardChartCard
            title="Top Vendors"
            description="Asset counts by vendor (top 8)"
            icon={<BuildingRegular />}
            iconTone="indigo"
          >
            <ChartSuspense>
              <DashboardDonutChart
                data={vendorChartData}
                emptyMessage="No vendor data available"
                centerLabel="Assets"
                tooltipLabel="Assets"
              />
            </ChartSuspense>
          </DashboardChartCard>

          <DashboardChartCard
            title="Purchase Activity"
            description="Assets acquired per month (last 12 months)"
            icon={<CalendarLtrRegular />}
            iconTone="pink"
          >
            <ChartSuspense>
              <DashboardTrendChart
                data={purchaseTrendChartData}
                emptyMessage="No purchase date data available"
                seriesLabel="Purchases"
                stroke="#6366f1"
                fill="rgba(99, 102, 241, 0.1)"
                variant="line"
              />
            </ChartSuspense>
          </DashboardChartCard>
        </div>
      ) : null}
      </div>

      <DashboardPrintView
        title={printTitle || 'Dashboard'}
        subtitle={printSubtitle || (useAssetKpis
          ? 'Overview of assets, status, and assignments across your organization.'
          : 'Overview of items, severity, and status across your organization.')}
        printedAt={new Date().toLocaleString()}
        kpis={stats.map((stat) => ({ title: stat.label, value: stat.value }))}
        heatmapMatrix={printHeatmapMatrix}
        severityCounts={severityCounts}
        recentRisks={printRecentRisks}
        statusChartData={statusChartData}
        categoryChartData={categoryChartData}
        priorityChartData={priorityChartData}
        financialExposure={printFinancialExposure}
        getPriorityLabel={getPrintPriorityLabel}
        getStatusLabel={getPrintStatusLabel}
        formatDueDate={formatPrintDueDate}
      />
    </div>
  );
};
