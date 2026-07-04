import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { IPriorityChartItem } from '../../utils/dashboardAnalytics';
import { DashboardChartTooltip } from './DashboardChartTooltip';

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

const PRIORITY_SEGMENTS = [
  { key: 'critical' as const, label: 'Critical', color: '#dc2626' },
  { key: 'major' as const, label: 'Major', color: '#f97316' },
  { key: 'moderate' as const, label: 'Moderate', color: '#facc15' },
  { key: 'low' as const, label: 'Low', color: '#22c55e' }
];

export interface IAssetPriorityChartProps {
  data: IPriorityChartItem[];
}

export const AssetPriorityChart: React.FC<IAssetPriorityChartProps> = ({ data }) => {
  const styles = useStyles();
  const visibleData = data.filter(
    (item) => item.critical + item.major + item.moderate + item.low > 0
  );
  const hasData = visibleData.length > 0;

  if (!hasData) {
    return <div className={styles.empty}>No priority data available</div>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={visibleData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#4b5563' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip content={<DashboardChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            />
            {PRIORITY_SEGMENTS.map((segment) => (
              <Bar
                key={segment.key}
                dataKey={segment.key}
                name={segment.label}
                stackId="priority"
                fill={segment.color}
                maxBarSize={56}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
