import * as React from 'react';

import { Card, CardHeader, makeStyles, shorthands, Text, Title3, tokens } from '@fluentui/react-components';

import { IAppSettings, IHeatmapDrillDownFilter, IAsset } from '../../models/IAssetApp';
import { isDashboardHoverEnabled } from '../../utils/dashboardSettings';

import { countByMatrixPriority, HeatmapCell } from '../../utils/riskMatrix';

import { AssetHeatmap } from './AssetHeatmap';



const useStyles = makeStyles({

  card: {

    ...shorthands.borderRadius(tokens.borderRadiusLarge),

    boxShadow: tokens.shadow4,

    width: '100%'

  },

  summary: {

    display: 'flex',

    flexWrap: 'wrap',

    gap: tokens.spacingHorizontalL,

    padding: `0 ${tokens.spacingHorizontalL} ${tokens.spacingVerticalM}`,

    color: tokens.colorNeutralForeground3

  },

  matrixGrid: {

    display: 'grid',

    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',

    gap: tokens.spacingHorizontalL,

    '@media (max-width: 768px)': {

      gridTemplateColumns: '1fr',

      gap: tokens.spacingHorizontalM

    }

  }

});



export interface IAssetRatingProps {
  risks: IAsset[];
  settings?: IAppSettings;
  onEditRisk?: (risk: IAsset) => void;
  onViewHeatmapRisks?: (risks: IAsset[], filter: IHeatmapDrillDownFilter) => void;
}



export const AssetValueSummary: React.FC<IAssetRatingProps> = ({
  risks,
  settings,
  onEditRisk,
  onViewHeatmapRisks
}) => {
  const styles = useStyles();
  const hoverEnabled = isDashboardHoverEnabled(settings);

  const inherentCounts = countByMatrixPriority(risks, false);



  const handleViewAll = (cell: HeatmapCell, variant: 'inherent' | 'residual'): void => {

    onViewHeatmapRisks?.(cell.risks, {

      variant,

      likelihoodIdx: cell.likelihoodIdx,

      consequenceIdx: cell.consequenceIdx,

      priority: cell.priority

    });

  };



  return (

    <div className={styles.matrixGrid}>

      <Card className={styles.card}>

        <CardHeader header={<Title3 as="h2">Inherent Rating Matrix</Title3>} />

        <div className={styles.summary}>

          <Text size={300}>

            Critical: {inherentCounts.Critical} · Major: {inherentCounts.Major} · Moderate:{' '}

            {inherentCounts.Moderate} · Low: {inherentCounts.Low}

          </Text>

        </div>

        <AssetHeatmap
          risks={risks}
          variant="inherent"
          activeOnly={false}
          compact
          hoverEnabled={hoverEnabled}
          onRiskClick={onEditRisk}
          onViewAll={onViewHeatmapRisks ? handleViewAll : undefined}
        />

      </Card>



      <Card className={styles.card}>

        <CardHeader header={<Title3 as="h2">Residual Rating Matrix</Title3>} />

        <div className={styles.summary}>

          <Text size={300}>

            Uses potential/residual ratings when set, otherwise derives from control effectiveness.

          </Text>

        </div>

        <AssetHeatmap
          risks={risks}
          variant="residual"
          activeOnly={false}
          compact
          hoverEnabled={hoverEnabled}
          onRiskClick={onEditRisk}
          onViewAll={onViewHeatmapRisks ? handleViewAll : undefined}
        />

      </Card>

    </div>

  );

};

