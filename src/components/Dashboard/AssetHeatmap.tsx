import * as React from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
  mergeClasses,
  shorthands,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title3,
  tokens
} from '@fluentui/react-components';
import { DismissRegular, OpenRegular } from '@fluentui/react-icons';
import { IAsset } from '../../models/IAssetApp';
import {
  MATRIX_CONSEQUENCE_LABELS,
  MATRIX_LIKELIHOOD_LABELS,
  MatrixPriority
} from '../../utils/priorityCalculator';
import { buildHeatmapMatrix, HeatmapCell } from '../../utils/riskMatrix';
import { getResidualRatings, resolveAssetStatusTitle } from '../../utils/dashboardAnalytics';
import { getHeatmapCellTone } from '../../utils/assetUi';
import { RiskStatusBadge } from '../Assets/AssetColoredBadges';

const useStyles = makeStyles({
  tableWrap: {
    overflowX: 'auto',
    padding: `0 ${tokens.spacingHorizontalL} ${tokens.spacingVerticalL}`,
    width: '100%',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'thin',
    '@media (max-width: 768px)': {
      padding: `0 ${tokens.spacingHorizontalM} ${tokens.spacingVerticalM}`
    }
  },
  heatmapCell: {
    textAlign: 'center',
    fontWeight: tokens.fontWeightSemibold,
    minWidth: '76px',
    height: '58px',
    verticalAlign: 'middle',
    padding: tokens.spacingVerticalXS,
    transition: 'transform 120ms ease, box-shadow 120ms ease',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    '@media (max-width: 768px)': {
      minWidth: '56px',
      height: '48px',
      fontSize: tokens.fontSizeBase200,
      padding: tokens.spacingVerticalXXS
    }
  },
  cellCount: {
    display: 'block',
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    lineHeight: 1,
    '@media (max-width: 768px)': {
      fontSize: tokens.fontSizeBase400
    }
  },
  cellEmpty: {
    opacity: 0.55,
    fontWeight: tokens.fontWeightRegular
  },
  heatmapCellInteractive: {
    cursor: 'pointer',
    ':hover': {
      transform: 'scale(1.04)',
      boxShadow: tokens.shadow8,
      zIndex: 1,
      position: 'relative'
    }
  },
  cellCritical: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2
  },
  cellMajor: {
    backgroundColor: tokens.colorPaletteDarkOrangeBackground2,
    color: tokens.colorPaletteDarkOrangeForeground2
  },
  cellModerate: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2
  },
  cellLow: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2
  },
  headerBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    paddingTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM
  },
  headerTitle: {
    display: 'block',
    margin: 0
  },
  headerSubtitle: {
    display: 'block',
    color: tokens.colorNeutralForeground3
  },
  rowLabel: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'nowrap',
    color: tokens.colorNeutralForeground2
  },
  cornerCell: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap'
  },
  colHeader: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    textAlign: 'center',
    color: tokens.colorNeutralForeground2
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    marginTop: tokens.spacingVerticalM
  },
  legendSwatch: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: tokens.borderRadiusSmall,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200
  },
  cellMeta: {
    display: 'block',
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightRegular,
    opacity: 0.85
  },
  dialogList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    maxHeight: '320px',
    overflowY: 'auto'
  },
  dialogRiskRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  dialogRiskRowClickable: {
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover
    }
  },
  dialogActions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalM
  }
});

export type HeatmapVariant = 'inherent' | 'residual';

export interface IAssetHeatmapProps {
  risks: IAsset[];
  title?: string;
  subtitle?: string;
  activeOnly?: boolean;
  compact?: boolean;
  variant?: HeatmapVariant;
  hoverEnabled?: boolean;
  onRiskClick?: (risk: IAsset) => void;
  onViewAll?: (cell: HeatmapCell, variant: HeatmapVariant) => void;
}

export const AssetHeatmap: React.FC<IAssetHeatmapProps> = ({
  risks,
  title,
  subtitle,
  activeOnly = true,
  compact = false,
  variant = 'inherent',
  hoverEnabled = true,
  onRiskClick,
  onViewAll
}) => {
  const styles = useStyles();
  const resolvedTitle =
    title || (variant === 'residual' ? 'Residual Rating Matrix' : 'Inherent Rating Matrix');
  const resolvedSubtitle =
    subtitle ||
    (variant === 'residual'
      ? 'Post-control likelihood vs impact for active items'
      : 'Likelihood vs impact for active items');

  const matrix = React.useMemo(() => {
    if (variant === 'residual') {
      return buildHeatmapMatrix(
        risks,
        activeOnly,
        (risk) => getResidualRatings(risk).likelihood,
        (risk) => getResidualRatings(risk).consequence
      );
    }
    return buildHeatmapMatrix(risks, activeOnly);
  }, [risks, activeOnly, variant]);
  const [selectedCell, setSelectedCell] = React.useState<HeatmapCell | undefined>();

  const getCellClass = (priority: MatrixPriority): string => {
    const tone = getHeatmapCellTone(priority);
    if (tone === 'critical') return styles.cellCritical;
    if (tone === 'major') return styles.cellMajor;
    if (tone === 'moderate') return styles.cellModerate;
    return styles.cellLow;
  };

  return (
    <>
      <div className={styles.tableWrap}>
        {!compact && (
          <div className={styles.headerBlock}>
            <Title3 as="h2" className={styles.headerTitle}>
              {resolvedTitle}
            </Title3>
            <Text size={300} block className={styles.headerSubtitle}>
              {resolvedSubtitle}
            </Text>
          </div>
        )}
        <Table
          aria-label="Rating heatmap"
          noNativeElements={false}
          style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: '6px' }}
        >
          <TableHeader>
            <TableRow>
              <TableHeaderCell className={styles.cornerCell}>Likelihood \ Impact</TableHeaderCell>
              {MATRIX_CONSEQUENCE_LABELS.map((label) => (
                <TableHeaderCell key={label} className={styles.colHeader}>
                  {label}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrix.map((row, lIdx) => (
              <TableRow key={lIdx}>
                <TableCell className={styles.rowLabel}>{MATRIX_LIKELIHOOD_LABELS[lIdx]}</TableCell>
                {row.map((cell) => {
                  const isInteractive = hoverEnabled && cell.count > 0;
                  return (
                  <TableCell
                    key={`${cell.likelihoodIdx}-${cell.consequenceIdx}`}
                    className={mergeClasses(
                      styles.heatmapCell,
                      getCellClass(cell.priority),
                      isInteractive && styles.heatmapCellInteractive
                    )}
                    onClick={() => {
                      if (isInteractive) {
                        setSelectedCell(cell);
                      }
                    }}
                    title={
                      cell.count > 0
                        ? `${cell.priority}: ${cell.count} item(s)${isInteractive ? ' — click for details' : ''}`
                        : `${cell.priority}`
                    }
                  >
                    <span
                      className={mergeClasses(styles.cellCount, cell.count === 0 && styles.cellEmpty)}
                    >
                      {cell.count > 0 ? cell.count : '—'}
                    </span>
                    <span className={styles.cellMeta}>{cell.priority}</span>
                  </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className={styles.legend}>
          <span className={mergeClasses(styles.legendSwatch, styles.cellLow)}>Low</span>
          <span className={mergeClasses(styles.legendSwatch, styles.cellModerate)}>Moderate</span>
          <span className={mergeClasses(styles.legendSwatch, styles.cellMajor)}>Major</span>
          <span className={mergeClasses(styles.legendSwatch, styles.cellCritical)}>Critical</span>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {hoverEnabled
              ? 'Click a cell with items to view details.'
              : 'Matrix cell drill-down is disabled in Settings → Dashboard.'}
          </Text>
        </div>
      </div>

      {selectedCell ? (
        <Dialog
          open={true}
          onOpenChange={(_, data) => !data.open && setSelectedCell(undefined)}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle
                action={
                  <Button
                    appearance="subtle"
                    icon={<DismissRegular />}
                    aria-label="Close"
                    onClick={() => setSelectedCell(undefined)}
                  />
                }
              >
                {`${selectedCell.priority} items — ${MATRIX_LIKELIHOOD_LABELS[selectedCell.likelihoodIdx]} × ${MATRIX_CONSEQUENCE_LABELS[selectedCell.consequenceIdx]}`}
              </DialogTitle>
              <DialogContent>
                <div className={styles.dialogList}>
                  {selectedCell.risks.map((risk) => (
                    <div
                      key={risk.Id}
                      className={mergeClasses(
                        styles.dialogRiskRow,
                        onRiskClick && styles.dialogRiskRowClickable
                      )}
                      onClick={() => onRiskClick?.(risk)}
                      onKeyDown={(event) => {
                        if (onRiskClick && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault();
                          onRiskClick(risk);
                        }
                      }}
                      role={onRiskClick ? 'button' : undefined}
                      tabIndex={onRiskClick ? 0 : undefined}
                    >
                      <div>
                        <Text weight="semibold" block>
                          {risk.AM_AssetId || risk.Id} — {risk.Title}
                        </Text>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          {risk.AM_Category?.Title || risk.RiskCategory?.Title || 'Uncategorized'}
                          {risk.riskBusiness?.Title ? ` · ${risk.riskBusiness.Title}` : ''}
                          {risk.RiskProject?.Title ? ` · ${risk.RiskProject.Title}` : ''}
                        </Text>
                      </div>
                      <RiskStatusBadge status={resolveAssetStatusTitle(risk)} />
                    </div>
                  ))}
                </div>
                {selectedCell.risks.length > 0 && (
                  <div className={styles.dialogActions}>
                    {onViewAll && (
                      <Button
                        appearance="primary"
                        icon={<OpenRegular />}
                        onClick={() => {
                          onViewAll(selectedCell, variant);
                          setSelectedCell(undefined);
                        }}
                      >
                        View all {selectedCell.count} item{selectedCell.count === 1 ? '' : 's'}
                      </Button>
                    )}
                    <Button appearance="subtle" onClick={() => setSelectedCell(undefined)}>
                      Close
                    </Button>
                  </div>
                )}
              </DialogContent>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      ) : null}
    </>
  );
};
