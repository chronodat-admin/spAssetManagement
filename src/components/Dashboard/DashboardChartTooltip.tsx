import * as React from 'react';
import { makeStyles, Text, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow8,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    minWidth: '140px'
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground1
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    color: tokens.colorNeutralForeground2
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS
  },
  swatch: {
    width: '8px',
    height: '8px',
    borderRadius: tokens.borderRadiusCircular,
    flexShrink: 0
  },
  value: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  }
});

export interface IDashboardChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
  }>;
}

export const DashboardChartTooltip: React.FC<IDashboardChartTooltipProps> = ({
  active,
  label,
  payload
}) => {
  const styles = useStyles();

  if (!active || !payload?.length) {
    return null;
  }

  const entries = payload.filter((entry) => typeof entry.value === 'number' && entry.value > 0);

  if (!entries.length) {
    return null;
  }

  return (
    <div className={styles.root}>
      {label ? <div className={styles.title}>{label}</div> : null}
      {entries.map((entry) => (
        <div key={String(entry.dataKey || entry.name)} className={styles.row}>
          <span className={styles.label}>
            <span className={styles.swatch} style={{ backgroundColor: entry.color || '#64748b' }} />
            <Text size={200}>{entry.name}</Text>
          </span>
          <Text size={200} className={styles.value}>
            {entry.value}
          </Text>
        </div>
      ))}
    </div>
  );
};
