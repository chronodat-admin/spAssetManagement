import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { DashboardChartTooltip } from './DashboardChartTooltip';
import { useOptionalAppearanceTheme } from '../../contexts/AppearanceThemeContext';
import { getRechartsTheme } from '../../utils/chartTheme';

export interface IDashboardTrendChartItem {
  label: string;
  value: number;
}

export interface IDashboardTrendChartProps {
  data: IDashboardTrendChartItem[];
  emptyMessage?: string;
  seriesLabel?: string;
  stroke?: string;
  fill?: string;
  variant?: 'line' | 'area';
  valueFormatter?: (value: number) => string;
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

export const DashboardTrendChart: React.FC<IDashboardTrendChartProps> = ({
  data,
  emptyMessage = 'No data available',
  seriesLabel = 'Value',
  stroke = '#0284c7',
  fill = 'rgba(2, 132, 199, 0.12)',
  variant = 'area',
  valueFormatter = (value) => String(value)
}) => {
  const styles = useStyles();
  const chartTheme = getRechartsTheme(useOptionalAppearanceTheme()?.isDark ?? false);
  const visibleData = data.filter((item) => item.value >= 0);
  const hasData = visibleData.some((item) => item.value > 0);

  if (!hasData) {
    return <div className={styles.empty}>{emptyMessage}</div>;
  }

  const chartData = visibleData.map((item) => ({
    ...item,
    name: item.label
  }));

  return (
    <div className={styles.root}>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          {variant === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.barBackground} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: chartTheme.tickFill }}
                interval={0}
                tickLine={false}
                axisLine={{ stroke: chartTheme.barBackground }}
                height={48}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: chartTheme.labelFill }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                content={<DashboardChartTooltip />}
                formatter={(value: number) => [valueFormatter(value), seriesLabel]}
                cursor={{ stroke: chartTheme.tickFill, strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                name={seriesLabel}
                stroke={stroke}
                fill={fill}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: chartTheme.donutStroke }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.barBackground} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: chartTheme.tickFill }}
                interval={0}
                tickLine={false}
                axisLine={{ stroke: chartTheme.barBackground }}
                height={48}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: chartTheme.labelFill }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                content={<DashboardChartTooltip />}
                formatter={(value: number) => [valueFormatter(value), seriesLabel]}
                cursor={{ stroke: chartTheme.tickFill, strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={seriesLabel}
                stroke={stroke}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: chartTheme.donutStroke }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
