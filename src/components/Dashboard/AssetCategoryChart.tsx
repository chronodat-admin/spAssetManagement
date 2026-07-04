import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ICategoryChartItem } from '../../utils/dashboardAnalytics';
import { DashboardChartTooltip } from './DashboardChartTooltip';
import { useOptionalAppearanceTheme } from '../../contexts/AppearanceThemeContext';
import { getRechartsTheme } from '../../utils/chartTheme';

const useStyles = makeStyles({
  root: {
    width: '100%',
    minHeight: '320px'
  },
  chart: {
    width: '100%',
    height: '320px',
    minHeight: '280px'
  },
  empty: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalXXL
  }
});

const RISK_SERIES = [
  { key: 'open' as const, label: 'Open', stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.12)' },
  { key: 'inProgress' as const, label: 'In Progress', stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.1)' },
  { key: 'closed' as const, label: 'Closed', stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)' }
];

const ASSET_SERIES = [
  { key: 'open' as const, label: 'Available', stroke: '#16a34a', fill: 'rgba(22, 163, 74, 0.12)' },
  { key: 'inProgress' as const, label: 'Assigned / In repair', stroke: '#0284c7', fill: 'rgba(2, 132, 199, 0.1)' },
  { key: 'closed' as const, label: 'Other', stroke: '#64748b', fill: 'rgba(100, 116, 139, 0.1)' }
];

export interface IAssetCategoryChartProps {
  data: ICategoryChartItem[];
  variant?: 'asset' | 'risk';
}

export const AssetCategoryChart: React.FC<IAssetCategoryChartProps> = ({ data, variant = 'risk' }) => {
  const styles = useStyles();
  const chartTheme = getRechartsTheme(useOptionalAppearanceTheme()?.isDark ?? false);
  const gridStroke = chartTheme.barBackground;
  const series = variant === 'asset' ? ASSET_SERIES : RISK_SERIES;
  const hasData = data.some((item) => item.open + item.inProgress + item.closed > 0);

  if (!hasData) {
    return (
      <div className={styles.empty}>
        {variant === 'asset' ? 'No asset data by category' : 'No data by business unit'}
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 12, fill: chartTheme.tickFill }}
              interval={0}
              tickLine={false}
              axisLine={{ stroke: gridStroke }}
              height={48}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: chartTheme.labelFill }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip content={<DashboardChartTooltip />} cursor={{ stroke: chartTheme.tickFill, strokeWidth: 1 }} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            />
            {series.map((entry) => (
              <Area
                key={entry.key}
                type="monotone"
                dataKey={entry.key}
                name={entry.label}
                stroke={entry.stroke}
                fill={entry.fill}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: chartTheme.donutStroke }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
