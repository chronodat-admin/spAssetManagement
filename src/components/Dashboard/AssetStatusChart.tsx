import * as React from 'react';
import { makeStyles, Text, tokens } from '@fluentui/react-components';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { IStatusChartItem } from '../../utils/dashboardAnalytics';
import { classifyRiskStatus } from '../../lib/workflow-settings/utils';
import type { IWorkflowSettings } from '../../models/IWorkflowSettings';
import { DashboardChartTooltip } from './DashboardChartTooltip';
import { useOptionalAppearanceTheme } from '../../contexts/AppearanceThemeContext';
import { getRechartsTheme } from '../../utils/chartTheme';

const STATUS_BUCKETS = [
  { key: 'open' as const, label: 'Open', color: '#2563eb' },
  { key: 'inProgress' as const, label: 'In Progress', color: '#f97316' },
  { key: 'closed' as const, label: 'Closed', color: '#10b981' }
];

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: 0,
    width: '100%'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: tokens.spacingHorizontalS
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    borderTop: `3px solid transparent`,
    minWidth: 0
  },
  statValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1.1,
    color: tokens.colorNeutralForeground1
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3
  },
  statPct: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold
  },
  chart: {
    width: '100%',
    height: '168px',
    minHeight: '148px'
  },
  summary: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  summaryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  progressTrack: {
    display: 'flex',
    width: '100%',
    height: '8px',
    borderRadius: tokens.borderRadiusCircular,
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground3
  },
  progressOpen: {
    height: '100%',
    backgroundColor: '#2563eb',
    transitionProperty: 'width',
    transitionDuration: '300ms'
  },
  progressInProgress: {
    height: '100%',
    backgroundColor: '#f97316',
    transitionProperty: 'width',
    transitionDuration: '300ms'
  },
  progressClosed: {
    height: '100%',
    backgroundColor: '#10b981',
    transitionProperty: 'width',
    transitionDuration: '300ms'
  },
  summaryLegend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    justifyContent: 'space-between'
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS
  },
  swatch: {
    width: '10px',
    height: '10px',
    borderRadius: tokens.borderRadiusCircular,
    flexShrink: 0
  },
  empty: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalXXL
  }
});

interface IStatusBucketItem {
  key: 'open' | 'inProgress' | 'closed';
  label: string;
  value: number;
  color: string;
  pct: number;
}

function buildStatusBuckets(
  data: IStatusChartItem[],
  workflowSettings: IWorkflowSettings | undefined,
  total: number
): IStatusBucketItem[] {
  const counts = { open: 0, inProgress: 0, closed: 0 };

  data.forEach((item) => {
    const bucket = classifyRiskStatus(item.name, workflowSettings);
    if (bucket === 'closed') {
      counts.closed += item.value;
    } else if (bucket === 'inProgress') {
      counts.inProgress += item.value;
    } else {
      counts.open += item.value;
    }
  });

  return STATUS_BUCKETS.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    value: counts[bucket.key],
    color: bucket.color,
    pct: total > 0 ? Math.round((counts[bucket.key] / total) * 100) : 0
  }));
}

function formatBarLabel(value: number, pct: number): string {
  return `${value} (${pct}%)`;
}

export interface IAssetStatusChartProps {
  data: IStatusChartItem[];
  workflowSettings?: IWorkflowSettings;
}

export const AssetStatusChart: React.FC<IAssetStatusChartProps> = ({ data, workflowSettings }) => {
  const styles = useStyles();
  const chartTheme = getRechartsTheme(useOptionalAppearanceTheme()?.isDark ?? false);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const [activeKey, setActiveKey] = React.useState<string | undefined>(undefined);

  if (total === 0) {
    return <div className={styles.empty}>No status data available</div>;
  }

  const buckets = buildStatusBuckets(data, workflowSettings, total);
  const chartData = buckets
    .filter((item) => item.value > 0)
    .map((item) => ({ ...item, barLabel: formatBarLabel(item.value, item.pct) }));
  const activeCount = buckets[0].value + buckets[1].value;
  const activePct = total > 0 ? Math.round((activeCount / total) * 100) : 0;

  return (
    <div className={styles.root}>
      <div className={styles.statsRow}>
        {buckets.map((item) => (
          <div
            key={item.key}
            className={styles.statCard}
            style={{ borderTopColor: item.color }}
            onMouseEnter={() => setActiveKey(item.key)}
            onMouseLeave={() => setActiveKey(undefined)}
          >
            <Text className={styles.statValue}>{item.value}</Text>
            <Text className={styles.statLabel}>{item.label}</Text>
            <Text className={styles.statPct} style={{ color: item.color }}>
              {item.pct}%
            </Text>
          </div>
        ))}
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 56, left: 4, bottom: 4 }}
            barCategoryGap="22%"
          >
            <XAxis type="number" hide domain={[0, 'dataMax']} />
            <YAxis
              type="category"
              dataKey="label"
              width={92}
              tick={{ fontSize: 13, fill: chartTheme.tickFill }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<DashboardChartTooltip />}
              formatter={(value: number, name: string, item: { payload?: { pct?: number } }) => {
                const pct =
                  typeof item?.payload?.pct === 'number'
                    ? item.payload.pct
                    : total > 0
                      ? Math.round((value / total) * 100)
                      : 0;
                return [`${value} (${pct}%)`, name];
              }}
              cursor={{ fill: chartTheme.tooltipCursor }}
            />
            <Bar
              dataKey="value"
              radius={[0, 6, 6, 0]}
              barSize={24}
              background={{ fill: chartTheme.barBackground, radius: 6 }}
              onMouseEnter={(entry) => setActiveKey(entry.key)}
              onMouseLeave={() => setActiveKey(undefined)}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={entry.color}
                  opacity={activeKey && activeKey !== entry.key ? 0.45 : 1}
                />
              ))}
              <LabelList
                dataKey="barLabel"
                position="right"
                style={{ fill: chartTheme.labelFill, fontSize: 12, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryHeader}>
          <Text size={200} weight="semibold">
            Portfolio mix
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {activePct}% active · {total} total
          </Text>
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          {buckets[0].value > 0 ? (
            <div className={styles.progressOpen} style={{ width: `${buckets[0].pct}%` }} />
          ) : null}
          {buckets[1].value > 0 ? (
            <div className={styles.progressInProgress} style={{ width: `${buckets[1].pct}%` }} />
          ) : null}
          {buckets[2].value > 0 ? (
            <div className={styles.progressClosed} style={{ width: `${buckets[2].pct}%` }} />
          ) : null}
        </div>
        <div className={styles.summaryLegend}>
          {buckets.map((item) =>
            item.value > 0 ? (
              <span key={item.key} className={styles.summaryItem}>
                <span className={styles.swatch} style={{ backgroundColor: item.color }} />
                <Text size={200}>
                  {item.label} {item.pct}%
                </Text>
              </span>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
};
