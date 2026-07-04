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
import { IComplianceAssessment } from '../../models/ICompliance';
import { getComplianceRate, getComplianceRateColor } from '../../utils/complianceAnalytics';
import { DashboardChartTooltip } from '../Dashboard/DashboardChartTooltip';
import { useOptionalAppearanceTheme } from '../../contexts/AppearanceThemeContext';
import { getRechartsTheme } from '../../utils/chartTheme';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: 0,
    width: '100%'
  },
  chart: {
    width: '100%',
    minHeight: '160px'
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    justifyContent: 'flex-end'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3
  },
  swatch: {
    width: '10px',
    height: '10px',
    borderRadius: tokens.borderRadiusCircular
  }
});

export interface IComplianceByAssessmentChartProps {
  assessments: IComplianceAssessment[];
  onOpenAssessment: (assessmentId: number) => void;
}

export const ComplianceByAssessmentChart: React.FC<IComplianceByAssessmentChartProps> = ({
  assessments,
  onOpenAssessment
}) => {
  const styles = useStyles();
  const chartTheme = getRechartsTheme(useOptionalAppearanceTheme()?.isDark ?? false);
  const [activeId, setActiveId] = React.useState<number | undefined>(undefined);

  const chartData = assessments.map((assessment) => {
    const rate = getComplianceRate(assessment);
    return {
      id: assessment.id,
      name: assessment.name,
      rate,
      color: getComplianceRateColor(rate),
      framework: `${assessment.frameworkCode}`
    };
  });

  const chartHeight = Math.max(160, assessments.length * 48 + 32);

  return (
    <div className={styles.root}>
      <div className={styles.chart} style={{ height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
            barCategoryGap="18%"
          >
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 12, fill: chartTheme.tickFill }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<DashboardChartTooltip />}
              formatter={(value: number, _name: string, item?: { payload?: { framework?: string } }) => [
                `${value}%`,
                item?.payload?.framework ? `Framework ${item.payload.framework}` : 'Compliance'
              ]}
              cursor={{ fill: chartTheme.tooltipCursor }}
            />
            <Bar
              dataKey="rate"
              radius={[0, 6, 6, 0]}
              barSize={22}
              background={{ fill: chartTheme.barBackground, radius: 6 }}
              onClick={(entry) => onOpenAssessment(entry.id)}
              onMouseEnter={(entry) => setActiveId(entry.id)}
              onMouseLeave={() => setActiveId(undefined)}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={entry.color}
                  opacity={activeId && activeId !== entry.id ? 0.45 : 1}
                />
              ))}
              <LabelList
                dataKey="rate"
                position="right"
                formatter={(value: number) => `${value}%`}
                style={{ fill: chartTheme.labelFill, fontSize: 12, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.legend} aria-hidden="true">
        <span className={styles.legendItem}>
          <span className={styles.swatch} style={{ backgroundColor: '#16a34a' }} />
          ≥70%
        </span>
        <span className={styles.legendItem}>
          <span className={styles.swatch} style={{ backgroundColor: '#d97706' }} />
          40–69%
        </span>
        <span className={styles.legendItem}>
          <span className={styles.swatch} style={{ backgroundColor: '#dc2626' }} />
          &lt;40%
        </span>
      </div>
    </div>
  );
};
