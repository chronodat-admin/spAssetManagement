import * as React from 'react';
import { makeStyles, Text, tokens } from '@fluentui/react-components';
import { getMatrixPriority } from '../../utils/priorityCalculator';
import { RiskPriorityBadge } from './AssetColoredBadges';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    marginBottom: tokens.spacingVerticalM
  }
});

export interface IAssetMatrixPreviewProps {
  likelihood: string;
  consequence: string;
}

export const AssetMatrixPreview: React.FC<IAssetMatrixPreviewProps> = ({
  likelihood,
  consequence
}) => {
  const styles = useStyles();

  if (!likelihood || !consequence) {
    return null;
  }

  const priority = getMatrixPriority(likelihood, consequence);

  return (
    <div className={styles.root} role="status" aria-live="polite">
      <Text>Matrix priority:</Text>
      <RiskPriorityBadge priority={priority.level} pill={false} />
      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
        Auto-calculated from likelihood “{likelihood}” and consequence “{consequence}”. Adjust
        either rating on the Assessment tab to recalculate.
      </Text>
    </div>
  );
};
