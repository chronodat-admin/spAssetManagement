import * as React from 'react';
import { Badge, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    '@media (max-width: 768px)': {
      padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
      justifyContent: 'flex-start'
    }
  },
  countBadge: {
    marginRight: 'auto',
    '@media (max-width: 768px)': {
      flex: '1 1 100%'
    }
  }
});

export interface IContentToolbarProps {
  count?: number;
  countLabel?: string;
  children?: React.ReactNode;
}

export const ContentToolbar: React.FC<IContentToolbarProps> = ({
  count,
  countLabel = 'items',
  children
}) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      {typeof count === 'number' && (
        <Badge appearance="outline" className={styles.countBadge}>
          {count} {countLabel}
        </Badge>
      )}
      {children}
    </div>
  );
};
