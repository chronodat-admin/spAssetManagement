import * as React from 'react';
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalL}`,
    color: tokens.colorNeutralForeground3
  },
  bordered: {
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1
  },
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    borderRadius: '999px',
    marginBottom: tokens.spacingVerticalXS,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
    fontSize: '28px'
  },
  title: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2
  },
  description: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    maxWidth: '360px'
  },
  action: {
    marginTop: tokens.spacingVerticalM
  },
  fullWidth: {
    width: '100%',
    boxSizing: 'border-box'
  },
  inset: {
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`
  }
});

export interface IEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  bordered?: boolean;
  /** Adds horizontal padding for flush ContentCard bodies. */
  inset?: boolean;
  /** Stretch to full card width (recommended with inset). */
  fullWidth?: boolean;
  className?: string;
}

export const EmptyState: React.FC<IEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  bordered,
  inset,
  fullWidth,
  className
}) => {
  const styles = useStyles();
  return (
    <div
      className={mergeClasses(
        styles.root,
        bordered && styles.bordered,
        inset && styles.inset,
        fullWidth && styles.fullWidth,
        className
      )}
    >
      <span className={styles.iconWrap} aria-hidden>
        {icon}
      </span>
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};
