import * as React from 'react';
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import type { MatrixPriority } from '../../utils/priorityCalculator';
import type { IWorkflowSettings } from '../../models/IWorkflowSettings';
import { getMatrixPriorityBadgeStyle, getAssetStatusBadgeStyle } from '../../utils/assetUi';

const useStyles = makeStyles({
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '22px',
    padding: `2px ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box'
  },
  pill: {
    borderRadius: '999px',
    padding: `2px ${tokens.spacingHorizontalM}`
  }
});

export interface IFullColorBadgeProps {
  label: string;
  backgroundColor: string;
  color: string;
  pill?: boolean;
  className?: string;
}

export const FullColorBadge: React.FC<IFullColorBadgeProps> = ({
  label,
  backgroundColor,
  color,
  pill,
  className
}) => {
  const styles = useStyles();

  return (
    <span
      className={mergeClasses(styles.badge, pill && styles.pill, className)}
      style={{ backgroundColor, color }}
    >
      {label}
    </span>
  );
};

export interface IAssetPriorityBadgeProps {
  priority: MatrixPriority;
  pill?: boolean;
  className?: string;
}

export const RiskPriorityBadge: React.FC<IAssetPriorityBadgeProps> = ({
  priority,
  pill = true,
  className
}) => {
  const style = getMatrixPriorityBadgeStyle(priority);

  return (
    <FullColorBadge
      label={priority}
      backgroundColor={style.backgroundColor}
      color={style.color}
      pill={pill}
      className={className}
    />
  );
};

export interface IAssetStatusBadgeProps {
  status?: string;
  workflowSettings?: IWorkflowSettings;
  pill?: boolean;
  className?: string;
}

export const RiskStatusBadge: React.FC<IAssetStatusBadgeProps> = ({
  status,
  workflowSettings: _workflowSettings,
  pill = true,
  className
}) => {
  const style = getAssetStatusBadgeStyle(status);

  return (
    <FullColorBadge
      label={status || 'Open'}
      backgroundColor={style.backgroundColor}
      color={style.color}
      pill={pill}
      className={className}
    />
  );
};
