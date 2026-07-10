import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
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
import { DashboardChartTooltip } from './DashboardChartTooltip';
import { useOptionalAppearanceTheme } from '../../contexts/AppearanceThemeContext';
import { getRechartsTheme } from '../../utils/chartTheme';

export interface IDashboardBarChartItem {
  label: string;
  value: number;
}

export interface IDashboardBarChartProps {
  data: IDashboardBarChartItem[];
  emptyMessage?: string;
  valueFormatter?: (value: number) => string;
  tooltipLabel?: string;
  barColor?: string;
}

const useStyles = makeStyles({
  root: {
    width: '100%',
    minHeight: '280px'
  },
  chart: {
    width: '100%',
    height: '280px',
    minHeight: '240px'
  },
  empty: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalXXL
  }
});

export const DashboardBarChart: React.FC<IDashboardBarChartProps> = ({
  data,
  emptyMessage = 'No data available',
  valueFormatter = (value) => String(value),
  tooltipLabel = 'Value',
  barColor = '#0284c7'
}) => {
  const styles = useStyles();
  const chartTheme = getRechartsTheme(useOptionalAppearanceTheme()?.isDark ?? false);
  const visibleData = data.filter((item) => item.value > 0);
  const [activeLabel, setActiveLabel] = React.useState<string | undefined>(undefined);

  if (visibleData.length === 0) {
    return <div className={styles.empty}>{emptyMessage}</div>;
  }

  const chartData = visibleData.map((item) => ({
    ...item,
    barLabel: valueFormatter(item.value)
  }));

  return (
    <div className={styles.root}>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 56, left: 4, bottom: 4 }}
            barCategoryGap="18%"
          >
            <XAxis type="number" hide domain={[0, 'dataMax']} />
            <YAxis
              type="category"
              dataKey="label"
              width={112}
              tick={{ fontSize: 12, fill: chartTheme.tickFill }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<DashboardChartTooltip />}
              formatter={(value: number) => [valueFormatter(value), tooltipLabel]}
              cursor={{ fill: chartTheme.tooltipCursor }}
            />
            <Bar
              dataKey="value"
              radius={[0, 6, 6, 0]}
              barSize={22}
              background={{ fill: chartTheme.barBackground, radius: 6 }}
              onMouseEnter={(entry) => setActiveLabel(entry.label)}
              onMouseLeave={() => setActiveLabel(undefined)}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.label}
                  fill={barColor}
                  opacity={activeLabel && activeLabel !== entry.label ? 0.45 : 1}
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
    </div>
  );
};
