import * as React from 'react';
import { makeStyles, mergeClasses, Text, tokens } from '@fluentui/react-components';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { MatrixPriority } from '../../utils/priorityCalculator';
import { DashboardChartTooltip } from './DashboardChartTooltip';
import { useOptionalAppearanceTheme } from '../../contexts/AppearanceThemeContext';
import { getRechartsTheme } from '../../utils/chartTheme';

const SEVERITY_LEVELS: Array<{ key: MatrixPriority; label: string; color: string }> = [
  { key: 'Critical', label: 'Critical', color: '#dc2626' },
  { key: 'Major', label: 'Major', color: '#f97316' },
  { key: 'Moderate', label: 'Moderate', color: '#eab308' },
  { key: 'Low', label: 'Low', color: '#22c55e' },
  { key: 'Not Assessed', label: 'Not Assessed', color: '#94a3b8' }
];

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: 0,
    width: '100%',
    padding: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalL,
    boxSizing: 'border-box',
    '@media (max-width: 768px)': {
      padding: tokens.spacingHorizontalM,
      paddingBottom: tokens.spacingVerticalM
    }
  },
  chartBlock: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalS,
    minWidth: 0
  },
  chart: {
    width: '100%',
    height: '260px',
    minHeight: '240px'
  },
  centerOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    pointerEvents: 'none',
    textAlign: 'center'
  },
  centerTotal: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1.1,
    color: tokens.colorNeutralForeground1
  },
  centerLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXXS
  },
  legend: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    boxSizing: 'border-box'
  },
  legendRow: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto auto',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalXXS,
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusSmall,
    cursor: 'default'
  },
  legendRowActive: {
    backgroundColor: tokens.colorNeutralBackground1
  },
  swatch: {
    width: '10px',
    height: '10px',
    borderRadius: tokens.borderRadiusCircular,
    flexShrink: 0
  },
  legendCount: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    textAlign: 'right',
    minWidth: '24px'
  },
  legendPct: {
    color: tokens.colorNeutralForeground3,
    textAlign: 'right',
    minWidth: '36px'
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
  progressSegment: {
    height: '100%',
    transitionProperty: 'width',
    transitionDuration: '300ms'
  },
  summaryLegend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'space-between'
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS
  },
  empty: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalXXL
  }
});

interface ISeverityBucket {
  key: MatrixPriority;
  label: string;
  value: number;
  color: string;
  pct: number;
}

function buildSeverityBuckets(counts: Record<MatrixPriority, number>): ISeverityBucket[] {
  const total = SEVERITY_LEVELS.reduce((sum, level) => sum + (counts[level.key] || 0), 0);

  return SEVERITY_LEVELS.map((level) => ({
    key: level.key,
    label: level.label,
    value: counts[level.key] || 0,
    color: level.color,
    pct: total > 0 ? Math.round(((counts[level.key] || 0) / total) * 100) : 0
  }));
}

export interface ISeveritySummaryChartProps {
  counts: Record<MatrixPriority, number>;
}

export const SeveritySummaryChart: React.FC<ISeveritySummaryChartProps> = ({ counts }) => {
  const styles = useStyles();
  const chartTheme = getRechartsTheme(useOptionalAppearanceTheme()?.isDark ?? false);
  const buckets = React.useMemo(() => buildSeverityBuckets(counts), [counts]);
  const total = buckets.reduce((sum, item) => sum + item.value, 0);
  const pieData = buckets.filter((item) => item.value > 0);
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);

  const highSeverityCount = buckets
    .filter((item) => item.key === 'Critical' || item.key === 'Major')
    .reduce((sum, item) => sum + item.value, 0);
  const highSeverityPct = total > 0 ? Math.round((highSeverityCount / total) * 100) : 0;

  if (total === 0) {
    return <div className={styles.empty}>No active items to summarize</div>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.chartBlock}>
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="52%"
                outerRadius="88%"
                paddingAngle={pieData.length > 1 ? 3 : 0}
                activeIndex={activeIndex}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={entry.color}
                    stroke={chartTheme.donutStroke}
                    strokeWidth={2}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  />
                ))}
              </Pie>
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
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.centerOverlay}>
          <Text className={styles.centerTotal}>{total}</Text>
          <Text className={styles.centerLabel}>Active items</Text>
        </div>
      </div>

      <div className={styles.legend}>
        {buckets.map((item) => {
          if (item.value === 0) {
            return null;
          }

          const pieIndex = pieData.findIndex((entry) => entry.key === item.key);
          const isHighlighted = pieIndex >= 0 && activeIndex === pieIndex;

          return (
            <div
              key={item.key}
              className={mergeClasses(styles.legendRow, isHighlighted && styles.legendRowActive)}
              onMouseEnter={() => {
                if (pieIndex >= 0) {
                  setActiveIndex(pieIndex);
                }
              }}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              <span className={styles.swatch} style={{ backgroundColor: item.color }} />
              <Text size={300}>{item.label}</Text>
              <Text size={300} className={styles.legendCount}>
                {item.value}
              </Text>
              <Text size={200} className={styles.legendPct}>
                {item.pct}%
              </Text>
            </div>
          );
        })}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryHeader}>
          <Text size={200} weight="semibold">
            Severity mix
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {highSeverityPct}% Critical or Major
          </Text>
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          {buckets.map((item) =>
            item.value > 0 ? (
              <div
                key={item.key}
                className={styles.progressSegment}
                style={{ width: `${item.pct}%`, backgroundColor: item.color }}
              />
            ) : null
          )}
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
