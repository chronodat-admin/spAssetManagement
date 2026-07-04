import * as React from 'react';
import {
  Button,
  Card,
  CardHeader,
  makeStyles,
  mergeClasses,
  shorthands,
  Text,
  Title3,
  tokens
} from '@fluentui/react-components';
import {
  ChevronDownRegular,
  ChevronUpRegular,
  DismissRegular,
  MoneyRegular,
  WarningRegular
} from '@fluentui/react-icons';
import { IFinancialExposure } from '../../utils/dashboardAnalytics';
import {
  isFinancialExposureMinimized,
  setFinancialExposureMinimized
} from '../../utils/dashboardSettings';
import { useOptionalAppearanceTheme } from '../../contexts/AppearanceThemeContext';

const useStyles = makeStyles({
  card: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    backgroundColor: tokens.colorPaletteYellowBackground1,
    border: `1px solid ${tokens.colorPaletteYellowBorder2}`,
    marginBottom: tokens.spacingVerticalL,
    overflow: 'visible',
    minWidth: 0
  },
  cardDark: {
    backgroundColor: tokens.colorNeutralBackground3,
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  cardMinimized: {
    marginBottom: tokens.spacingVerticalM
  },
  inner: {
    padding: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalL
  },
  total: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorPaletteDarkOrangeForeground1,
    lineHeight: 1.1,
    marginBottom: tokens.spacingVerticalM
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} 0`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  icon: {
    fontSize: '28px',
    color: tokens.colorPaletteDarkOrangeForeground2
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center'
  },
  minimizedTotal: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorPaletteDarkOrangeForeground1
  }
});

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

export interface IFinancialExposureCardProps {
  exposure: IFinancialExposure;
  onClose?: () => void;
}

export const FinancialExposureCard: React.FC<IFinancialExposureCardProps> = ({
  exposure,
  onClose
}) => {
  const styles = useStyles();
  const isDark = useOptionalAppearanceTheme()?.isDark ?? false;
  const [minimized, setMinimized] = React.useState(() => isFinancialExposureMinimized());

  const toggleMinimized = (): void => {
    setMinimized((current) => {
      const next = !current;
      setFinancialExposureMinimized(next);
      return next;
    });
  };

  if (exposure.riskCount === 0) {
    return null;
  }

  const headerActions = (
    <div className={styles.headerActions}>
      <Button
        appearance="subtle"
        icon={minimized ? <ChevronDownRegular /> : <ChevronUpRegular />}
        aria-label={minimized ? 'Expand financial exposure summary' : 'Minimize financial exposure summary'}
        onClick={toggleMinimized}
      />
      {onClose ? (
        <Button
          appearance="subtle"
          icon={<DismissRegular />}
          aria-label="Dismiss financial exposure summary"
          onClick={onClose}
        />
      ) : undefined}
    </div>
  );

  return (
    <Card className={mergeClasses(styles.card, isDark && styles.cardDark, minimized && styles.cardMinimized)}>
      <CardHeader
        header={
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
            <MoneyRegular className={styles.icon} />
            <Title3 as="h2">Financial Exposure</Title3>
            {minimized && (
              <Text size={400} className={styles.minimizedTotal}>
                {formatCurrency(exposure.totalExposure)}
              </Text>
            )}
          </div>
        }
        description={
          minimized
            ? `${exposure.riskCount} active assessed assets`
            : `Total potential cost across ${exposure.riskCount} active assessed assets`
        }
        action={headerActions}
      />
      {!minimized && (
        <div className={styles.inner}>
          <div className={styles.total}>{formatCurrency(exposure.totalExposure)}</div>
          {exposure.topRisks.length > 0 && (
            <>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalS }}>
                Top assets by cost
              </Text>
              {exposure.topRisks.map((risk) => (
                <div key={risk.riskId} className={styles.topRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS, minWidth: 0 }}>
                    <WarningRegular style={{ color: tokens.colorPaletteDarkOrangeForeground2, flexShrink: 0 }} />
                    <Text size={300} truncate wrap={false}>
                      {risk.riskId} — {risk.title}
                    </Text>
                  </div>
                  <Text
                    size={300}
                    weight="semibold"
                    style={{ color: tokens.colorPaletteDarkOrangeForeground1, flexShrink: 0 }}
                  >
                    {formatCurrency(risk.exposure)}
                  </Text>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </Card>
  );
};
