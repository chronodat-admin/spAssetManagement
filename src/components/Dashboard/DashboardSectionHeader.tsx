import * as React from 'react';
import {
  makeStyles,
  mergeClasses,
  shorthands,
  Text,
  Title3,
  tokens
} from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    width: '100%',
    minWidth: 0,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    boxSizing: 'border-box',
    '@media (max-width: 768px)': {
      padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`
    }
  },
  iconWrap: {
    width: '44px',
    height: '44px',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#ffffff',
    fontSize: '22px'
  },
  iconIndigo: {
    backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)'
  },
  iconOrange: {
    backgroundImage: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)'
  },
  iconPink: {
    backgroundImage: 'linear-gradient(135deg, #ec4899 0%, #e11d48 100%)'
  },
  iconTeal: {
    backgroundImage: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)'
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: tokens.spacingVerticalXXS
  },
  title: {
    display: 'block',
    width: '100%',
    margin: 0,
    lineHeight: tokens.lineHeightBase400,
    wordBreak: 'break-word'
  },
  description: {
    display: 'block',
    width: '100%',
    color: tokens.colorNeutralForeground3,
    lineHeight: tokens.lineHeightBase200,
    wordBreak: 'break-word'
  },
  action: {
    flexShrink: 0,
    marginLeft: 'auto'
  }
});

export type DashboardSectionIconTone = 'indigo' | 'orange' | 'pink' | 'teal';

export interface IDashboardSectionHeaderProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  iconTone: DashboardSectionIconTone;
  action?: React.ReactNode;
}

export const DashboardSectionHeader: React.FC<IDashboardSectionHeaderProps> = ({
  title,
  description,
  icon,
  iconTone,
  action
}) => {
  const styles = useStyles();

  const iconClass =
    iconTone === 'indigo'
      ? styles.iconIndigo
      : iconTone === 'orange'
        ? styles.iconOrange
        : iconTone === 'teal'
          ? styles.iconTeal
          : styles.iconPink;

  return (
    <div className={styles.root}>
      <div className={mergeClasses(styles.iconWrap, iconClass)}>{icon}</div>
      <div className={styles.textBlock}>
        <Title3 as="h2" className={styles.title}>
          {title}
        </Title3>
        {description ? (
          <Text size={200} className={styles.description}>
            {description}
          </Text>
        ) : null}
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
};
