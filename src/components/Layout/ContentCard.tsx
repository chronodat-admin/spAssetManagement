import * as React from 'react';
import { Card, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  card: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    width: '100%',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    overflow: 'hidden'
  },
  body: {
    padding: tokens.spacingHorizontalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    '@media (max-width: 768px)': {
      padding: tokens.spacingHorizontalM
    }
  },
  bodyFlush: {
    padding: 0,
    gap: 0
  },
  tableWrap: {
    overflowX: 'auto',
    width: '100%',
    WebkitOverflowScrolling: 'touch',
    overscrollBehaviorX: 'contain',
    scrollbarWidth: 'thin'
  },
  tableHeaderCell: {
    backgroundColor: tokens.colorNeutralBackground2,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    verticalAlign: 'middle'
  },
  dataTableCell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle'
  },
  dataTableCellWrap: {
    overflow: 'hidden',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    verticalAlign: 'middle'
  },
  emptyCell: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalXL
  },
  rowButton: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    margin: 0,
    color: tokens.colorBrandForeground1,
    cursor: 'pointer',
    font: 'inherit',
    fontWeight: tokens.fontWeightSemibold,
    textAlign: 'left',
    ':hover': {
      textDecoration: 'underline'
    }
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS
  }
});

export interface IContentCardProps {
  children: React.ReactNode;
  pageHeader?: React.ReactNode;
  toolbar?: React.ReactNode;
  filtersBar?: React.ReactNode;
  flushBody?: boolean;
  className?: string;
}

export const ContentCard: React.FC<IContentCardProps> = ({
  children,
  pageHeader,
  toolbar,
  filtersBar,
  flushBody,
  className
}) => {
  const styles = useStyles();

  return (
    <Card className={mergeClasses(styles.card, className)}>
      {pageHeader}
      {toolbar}
      {filtersBar}
      <div className={mergeClasses(styles.body, flushBody && styles.bodyFlush)}>{children}</div>
    </Card>
  );
};

export function useContentCardStyles(): ReturnType<typeof useStyles> {
  return useStyles();
}
