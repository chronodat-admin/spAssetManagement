import * as React from 'react';
import { Caption1, makeStyles, mergeClasses, Subtitle1, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  titleBlock: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    minWidth: 0,
    flex: '1 1 280px'
  },
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorBrandBackground2,
    flexShrink: 0
  },
  icon: {
    fontSize: '28px',
    color: tokens.colorBrandForeground1
  },
  textBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    minWidth: 0
  },
  title: {
    margin: 0
  },
  description: {
    color: tokens.colorNeutralForeground3,
    maxWidth: '720px',
    lineHeight: tokens.lineHeightBase300
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexShrink: 0
  },
  embedded: {
    marginBottom: 0,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM} ${tokens.spacingVerticalS}`
  }
});

export interface ISettingsPageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
  embedded?: boolean;
}

export const SettingsPageHeader: React.FC<ISettingsPageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  actions,
  embedded
}) => {
  const styles = useStyles();

  return (
    <header className={mergeClasses(styles.root, embedded && styles.embedded)}>
      <div className={styles.titleBlock}>
        {Icon && (
          <div className={styles.iconWrap} aria-hidden>
            <Icon className={styles.icon} />
          </div>
        )}
        <div className={styles.textBlock}>
          <Subtitle1 as="h2" className={styles.title}>
            {title}
          </Subtitle1>
          {description && <Caption1 className={styles.description}>{description}</Caption1>}
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
};
