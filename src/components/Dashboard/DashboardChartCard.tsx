import * as React from 'react';
import { Button, Card, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import { ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons';
import {
  DashboardSectionHeader,
  DashboardSectionIconTone
} from './DashboardSectionHeader';

const useStyles = makeStyles({
  card: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    overflow: 'hidden',
    minWidth: 0
  },
  body: {
    overflow: 'hidden',
    transitionProperty: 'max-height, opacity',
    transitionDuration: '300ms',
    transitionTimingFunction: 'ease'
  },
  bodyExpanded: {
    maxHeight: '560px',
    opacity: 1
  },
  bodyCollapsed: {
    maxHeight: '0px',
    opacity: 0
  },
  bodyInner: {
    padding: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalL,
    minWidth: 0
  }
});

export interface IDashboardChartCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconTone: DashboardSectionIconTone;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const DashboardChartCard: React.FC<IDashboardChartCardProps> = ({
  title,
  description,
  icon,
  iconTone,
  children,
  defaultExpanded = true
}) => {
  const styles = useStyles();
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <Card className={styles.card}>
      <DashboardSectionHeader
        title={title}
        description={description}
        icon={icon}
        iconTone={iconTone}
        action={
          <Button
            appearance="subtle"
            icon={expanded ? <ChevronUpRegular /> : <ChevronDownRegular />}
            aria-label={expanded ? `Minimize ${title}` : `Expand ${title}`}
            onClick={() => setExpanded((current) => !current)}
          />
        }
      />
      <div className={mergeClasses(styles.body, expanded ? styles.bodyExpanded : styles.bodyCollapsed)}>
        <div className={styles.bodyInner}>{children}</div>
      </div>
    </Card>
  );
};
