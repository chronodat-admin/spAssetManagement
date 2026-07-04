import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  Button,
  Card,
  makeStyles,
  mergeClasses,
  MessageBar,
  MessageBarBody,
  shorthands,
  Spinner,
  Text,
  Title3,
  tokens,
  webLightTheme
} from '@fluentui/react-components';
import {
  CheckmarkCircleRegular,
  CircleRegular,
  DataHistogramRegular,
  DataTrendingRegular,
  DismissCircleRegular,
  DismissRegular,
  DocumentRegular,
  FlowchartRegular,
  ListRegular,
  LockClosedRegular,
  PlayRegular,
  SettingsRegular,
  ShieldRegular
} from '@fluentui/react-icons';
import { IProvisioningStep } from '../../models/IAssetApp';
import { SpfxFluentProvider } from '../SpfxFluentProvider/SpfxFluentProvider';
import { DEFAULT_SETUP_TITLE } from '../../constants/spfxComponents';
import { DedicatedSubsiteWarning } from './DedicatedSubsiteWarning';
import { MailSendApprovalPanel } from './MailSendApprovalPanel';
import type { MailSendApprovalUiStatus } from '../../models/IMailSendApproval';

const SETUP_PORTAL_CLASS = 'asset-mgmt-setup-portal';

interface IFeatureHighlight {
  icon: React.ReactElement;
  title: string;
  description: string;
}

const FEATURE_HIGHLIGHTS: IFeatureHighlight[] = [
  {
    icon: <ListRegular />,
    title: 'Asset register & operations',
    description: 'Track hardware, software, assignments, bookings, and returns in one place.'
  },
  {
    icon: <DataHistogramRegular />,
    title: 'Dashboards & analytics',
    description: 'Executive dashboard with asset counts, status mix, category breakdown, and warranty alerts.'
  },
  {
    icon: <DataTrendingRegular />,
    title: 'Depreciation & inventory',
    description: 'Straight-line depreciation schedules, inventory scans, and software license tracking.'
  },
  {
    icon: <ShieldRegular />,
    title: 'Compliance frameworks',
    description: 'Optional SOC 2, ISO 27001 and more, with controls linked to assets when enabled.'
  },
  {
    icon: <DocumentRegular />,
    title: 'Reports & CSV export',
    description: 'Board-ready reports and a configurable report builder.'
  },
  {
    icon: <FlowchartRegular />,
    title: 'Settings & notifications',
    description: 'Custom fields, scoring scales, email templates, and workflows - no code.'
  }
];

const useStyles = makeStyles({
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalL),
    overflowY: 'auto',
    boxSizing: 'border-box',
    WebkitOverflowScrolling: 'touch',
    '@media (max-width: 768px)': {
      ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalS),
      alignItems: 'flex-start'
    }
  },
  modalPanel: {
    width: '100%',
    maxWidth: '760px',
    maxHeight: 'min(92vh, 820px)',
    overflowY: 'auto',
    flexShrink: 0,
    margin: 'auto',
    '@media (max-width: 768px)': {
      maxHeight: 'none',
      margin: 0
    }
  },
  pageShell: {
    position: 'relative',
    minHeight: '480px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusLarge
  },
  panel: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow16,
    width: '100%',
    maxWidth: '760px',
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXL)
  },
  panelContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalS
  },
  overview: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2
  },
  overviewLabel: {
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: tokens.spacingHorizontalXXL,
    rowGap: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalS,
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr'
    }
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalS
  },
  featureIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: '20px',
    flexShrink: 0,
    marginTop: '2px'
  },
  trustNote: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground3
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase300
  },
  stepDone: { color: tokens.colorPaletteGreenForeground2 },
  stepRunning: { color: tokens.colorBrandForeground1, fontWeight: tokens.fontWeightSemibold },
  stepError: { color: tokens.colorPaletteRedForeground2 },
  stepPending: { color: tokens.colorNeutralForeground3 },
  footer: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalS
  }
});

export interface IProvisioningOnboardingProps {
  steps: IProvisioningStep[];
  isRunning: boolean;
  error?: string;
  isTeamsHost?: boolean;
  mailSendStatus?: MailSendApprovalUiStatus;
  mailSendAdminUrl?: string;
  onRefreshMailSendStatus?: () => void;
  refreshingMailSendStatus?: boolean;
  onStart: () => void;
  onSkip?: () => void;
  onClose?: () => void;
  variant?: 'page' | 'modal';
}

export const ProvisioningOnboarding: React.FC<IProvisioningOnboardingProps> = ({
  steps,
  isRunning,
  error,
  isTeamsHost = false,
  mailSendStatus,
  mailSendAdminUrl,
  onRefreshMailSendStatus,
  refreshingMailSendStatus,
  onStart,
  onSkip,
  onClose,
  variant = 'page'
}) => {
  const styles = useStyles();
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);
  const allDone = steps.every((s) => s.status === 'done');

  React.useEffect(() => {
    if (variant === 'modal' && typeof document !== 'undefined') {
      setPortalTarget(document.body);
    }
  }, [variant]);

  const panel = (
    <Card className={styles.panel}>
      <div className={styles.panelContent}>
        <div className={styles.headerRow}>
          <Title3 as="h2" id="asset-mgmt-setup-title">
            <SettingsRegular /> {DEFAULT_SETUP_TITLE}
          </Title3>
          {variant === 'modal' && onClose && !isRunning && (
            <Button appearance="subtle" icon={<DismissRegular />} aria-label="Close" onClick={onClose} />
          )}
        </div>

        <Text block style={{ color: tokens.colorNeutralForeground3 }}>
          This web part will create all required SharePoint lists and seed default lookup data for
          asset and inventory management.
        </Text>

        {!isRunning && !allDone && (
          <div className={styles.overview}>
            <Text size={200} className={styles.overviewLabel}>
              What you&apos;ll get
            </Text>
            <div className={styles.featureGrid}>
              {FEATURE_HIGHLIGHTS.map((feature) => (
                <div key={feature.title} className={styles.featureItem}>
                  <span className={styles.featureIcon} aria-hidden>
                    {feature.icon}
                  </span>
                  <span>
                    <Text size={300} weight="semibold" block>
                      {feature.title}
                    </Text>
                    <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                      {feature.description}
                    </Text>
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.trustNote}>
              <LockClosedRegular />
              <Text size={200}>
                Everything runs inside your Microsoft 365 tenant - your data stays in SharePoint.
              </Text>
            </div>
          </div>
        )}

        <DedicatedSubsiteWarning isTeamsHost={isTeamsHost} />

        <div className={styles.steps}>
          {steps.map((step) => (
            <div
              key={step.id}
              className={mergeClasses(
                styles.step,
                step.status === 'done' && styles.stepDone,
                step.status === 'running' && styles.stepRunning,
                step.status === 'error' && styles.stepError,
                step.status === 'pending' && styles.stepPending
              )}
            >
              {step.status === 'done' && <CheckmarkCircleRegular />}
              {step.status === 'running' && <Spinner size="tiny" />}
              {step.status === 'error' && <DismissCircleRegular />}
              {step.status === 'pending' && <CircleRegular />}
              <span>
                {step.label}
                {step.description && (
                  <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                    {step.description}
                  </Text>
                )}
                {step.message && (
                  <Text
                    size={200}
                    block
                    style={{ color: tokens.colorBrandForeground1, fontWeight: 500 }}
                  >
                    {step.message}
                  </Text>
                )}
              </span>
            </div>
          ))}
        </div>

        {isRunning && (
          <Text size={200} block italic style={{ color: tokens.colorNeutralForeground3 }}>
            Creating lists in the background — the SharePoint page stays responsive. Seeding sample
            assets can take a few minutes on slower tenants; progress is shown under each step.
          </Text>
        )}

        {error && (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}

        {mailSendStatus && mailSendAdminUrl && (
          <MailSendApprovalPanel
            status={mailSendStatus}
            adminUrl={mailSendAdminUrl}
            onRefresh={onRefreshMailSendStatus}
            refreshing={refreshingMailSendStatus}
          />
        )}

        <div className={styles.footer}>
          {!isRunning && !allDone && onSkip && (
            <Button appearance="secondary" onClick={onSkip}>
              Skip (lists already exist)
            </Button>
          )}
          {!isRunning && !allDone && (
            <Button appearance="primary" icon={<PlayRegular />} onClick={onStart}>
              Start Setup
            </Button>
          )}
          {allDone && (
            <MessageBar intent="success" style={{ flex: 1 }}>
              <MessageBarBody>Setup complete! Loading application...</MessageBarBody>
            </MessageBar>
          )}
        </div>
      </div>
    </Card>
  );

  if (variant === 'modal' && portalTarget) {
    return ReactDOM.createPortal(
      <SpfxFluentProvider theme={webLightTheme} providerId="asset-mgmt-setup-modal" portal>
        <div
          className={mergeClasses(styles.modalBackdrop, SETUP_PORTAL_CLASS)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="asset-mgmt-setup-title"
          onClick={(event) => {
            if (event.target === event.currentTarget && onClose && !isRunning) {
              onClose();
            }
          }}
        >
          <div className={styles.modalPanel}>{panel}</div>
        </div>
      </SpfxFluentProvider>,
      portalTarget
    );
  }

  return <div className={styles.pageShell}>{panel}</div>;
};
