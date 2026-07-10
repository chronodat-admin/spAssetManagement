import * as React from 'react';
import { makeStyles, mergeClasses, Text, tokens } from '@fluentui/react-components';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardChartTooltip } from './DashboardChartTooltip';
import { useOptionalAppearanceTheme } from '../../contexts/AppearanceThemeContext';
import { getRechartsTheme } from '../../utils/chartTheme';

export const DASHBOARD_CHART_PALETTE = [
  '#0284c7',
  '#0d9488',
  '#6366f1',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#64748b'
] as const;

export interface IDashboardDonutChartItem {
  label: string;
  value: number;
  color?: string;
}

export interface IDashboardDonutChartProps {
  data: IDashboardDonutChartItem[];
  emptyMessage?: string;
  centerLabel?: string;
  valueFormatter?: (value: number) => string;
  tooltipLabel?: string;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: 0,
    width: '100%'
  },
  chartBlock: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
    textAlign: 'center',
    maxWidth: '42%'
  },
  centerTotal: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1.1,
    color: tokens.colorNeutralForeground1,
    wordBreak: 'break-word'
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
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusSmall
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
  empty: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalXXL
  }
});

interface IBucket extends IDashboardDonutChartItem {
  color: string;
  pct: number;
}

export const DashboardDonutChart: React.FC<IDashboardDonutChartProps> = ({
  data,
  emptyMessage = 'No data available',
  centerLabel = 'Total',
  valueFormatter = (value) => String(value),
  tooltipLabel = 'Value'
}) => {
  const styles = useStyles();
  const chartTheme = getRechartsTheme(useOptionalAppearanceTheme()?.isDark ?? false);
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);

  const buckets = React.useMemo((): IBucket[] => {
    const visible = data.filter((item) => item.value > 0);
    const total = visible.reduce((sum, item) => sum + item.value, 0);
    return visible.map((item, index) => ({
      ...item,
      color: item.color || DASHBOARD_CHART_PALETTE[index % DASHBOARD_CHART_PALETTE.length],
      pct: total > 0 ? Math.round((item.value / total) * 100) : 0
    }));
  }, [data]);

  const total = buckets.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <div className={styles.empty}>{emptyMessage}</div>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.chartBlock}>
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={buckets}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="52%"
                outerRadius="88%"
                paddingAngle={buckets.length > 1 ? 3 : 0}
                activeIndex={activeIndex}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                {buckets.map((entry) => (
                  <Cell
                    key={entry.label}
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
                  return [`${valueFormatter(value)} (${pct}%)`, name || tooltipLabel];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.centerOverlay}>
          <Text className={styles.centerTotal}>{valueFormatter(total)}</Text>
          <Text className={styles.centerLabel}>{centerLabel}</Text>
        </div>
      </div>

      <div className={styles.legend}>
        {buckets.map((item, index) => {
          const isHighlighted = activeIndex === index;
          return (
            <div
              key={item.label}
              className={mergeClasses(styles.legendRow, isHighlighted && styles.legendRowActive)}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              <span className={styles.swatch} style={{ backgroundColor: item.color }} />
              <Text size={300}>{item.label}</Text>
              <Text size={300} className={styles.legendCount}>
                {valueFormatter(item.value)}
              </Text>
              <Text size={200} className={styles.legendPct}>
                {item.pct}%
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
};
