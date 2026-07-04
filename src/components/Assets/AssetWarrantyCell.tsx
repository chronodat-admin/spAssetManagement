import * as React from 'react';
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { IAsset } from '../../models/IAssetApp';
import { isOverdueRisk } from '../../utils/assetDateFilters';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: tokens.spacingVerticalXXS
  },
  date: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: 1.3,
    color: tokens.colorNeutralForeground1
  },
  dateOverdue: {
    color: tokens.colorPaletteRedForeground1,
    fontWeight: tokens.fontWeightSemibold
  },
  overdueTag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '1px 8px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
    lineHeight: 1.4
  }
});

function formatDueDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export interface IAssetDueDateCellProps {
  risk: IAsset;
}

export const AssetWarrantyCell: React.FC<IAssetDueDateCellProps> = ({ risk }) => {
  const styles = useStyles();

  const warrantyDate = risk.AM_WarrantyExpiry || risk.RiskDueDate;

  if (!warrantyDate) {
    return <>—</>;
  }

  const overdue = isOverdueRisk({ ...risk, AM_WarrantyExpiry: warrantyDate });

  return (
    <div className={styles.root}>
      <span className={mergeClasses(styles.date, overdue && styles.dateOverdue)}>
        {formatDueDate(warrantyDate)}
      </span>
      {overdue ? <span className={styles.overdueTag}>Overdue</span> : null}
    </div>
  );
};
