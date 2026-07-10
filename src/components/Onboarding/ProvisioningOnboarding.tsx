import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  Button,
  Card,
  Checkbox,
  makeStyles,
  mergeClasses,
  shorthands,
  Spinner,
  Text,
  Title3,
  tokens,
  webLightTheme
} from '@fluentui/react-components';
import { AppMessageBar } from '../Layout/AppMessageBar';
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
  PlayRegular
} from '@fluentui/react-icons';
import { IProvisioningStep } from '../../models/IAssetApp';
import { SpfxFluentProvider } from '../SpfxFluentProvider/SpfxFluentProvider';
import { DEFAULT_SETUP_TITLE } from '../../constants/spfxComponents';
import { AppBrandIcon } from '../Layout/AppBrandIcon';
import { getListProgressLabel } from '../../utils/provisioningListLabels';
import { SetupContextNotifications } from './SetupContextNotifications';
import { MailSendApprovalPanel } from './MailSendApprovalPanel';
import type { MailSendApprovalUiStatus } from '../../models/IMailSendApproval';
import { useTranslation } from '../../i18n/LocaleContext';

const SETUP_PORTAL_CLASS = 'asset-mgmt-setup-portal';

interface IFeatureHighlightConfig {
  icon: React.ReactElement;
  titleKey: string;
  descriptionKey: string;
  highlight?: boolean;
}

const FEATURE_HIGHLIGHT_KEYS: IFeatureHighlightConfig[] = [
  {
    icon: <ListRegular />,
    titleKey: 'featureRegisterLifecycle',
    descriptionKey: 'featureRegisterLifecycleDesc'
  },
  {
    icon: <DataHistogramRegular />,
    titleKey: 'featureDashboards',
    descriptionKey: 'featureDashboardsDesc'
  },
  {
    icon: <DataTrendingRegular />,
    titleKey: 'featureDepreciationInventory',
    descriptionKey: 'featureDepreciationInventoryDesc'
  },
  {
    icon: <DocumentRegular />,
    titleKey: 'featureReportsExport',
    descriptionKey: 'featureReportsExportDesc'
  },
  {
    icon: <FlowchartRegular />,
    titleKey: 'featureFormsSettings',
    descriptionKey: 'featureFormsSettingsDesc'
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
  titleBrandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: 0
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
  featureItemHighlight: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalS),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2
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
  },
  sampleOption: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2
  }
});

export interface IProvisioningOnboardingOptions {
  includeSampleData: boolean;
}

export interface IProvisioningOnboardingProps {
  steps: IProvisioningStep[];
  isRunning: boolean;
  error?: string;
  isTeamsHost?: boolean;
  mailSendStatus?: MailSendApprovalUiStatus;
  mailSendAdminUrl?: string;
  onRefreshMailSendStatus?: () => void;
  refreshingMailSendStatus?: boolean;
  onStart: (options: IProvisioningOnboardingOptions) => void;
  onSkip?: () => void;
  onClose?: () => void;
  variant?: 'page' | 'modal';
  showSetupNotifications?: boolean;
  isSiteOwner?: boolean;
  isAppAdministrator?: boolean;
  ownerAccessMessage?: string;
  onCompleteSetup?: () => void;
  onOpenSettings?: () => void;
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
  variant = 'page',
  showSetupNotifications = true,
  isSiteOwner = false,
  isAppAdministrator = false,
  ownerAccessMessage,
  onCompleteSetup,
  onOpenSettings
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);
  const [includeSampleData, setIncludeSampleData] = React.useState(true);
  const allDone = steps.every((s) => s.status === 'done');
  const hasError = steps.some((s) => s.status === 'error');
  const showProgressSteps = isRunning || allDone || hasError;
  const showPreSetupOverview = !isRunning && !allDone;

  React.useEffect(() => {
    if (variant === 'modal' && typeof document !== 'undefined') {
      setPortalTarget(document.body);
    }
  }, [variant]);

  const panel = (
    <Card className={styles.panel}>
      <div className={styles.panelContent}>
        <div className={styles.headerRow}>
          <div className={styles.titleBrandRow}>
            <AppBrandIcon variant="title" decorative />
            <Title3 as="h2" id="asset-mgmt-setup-title">
              {DEFAULT_SETUP_TITLE}
            </Title3>
          </div>
          {variant === 'modal' && onClose && !isRunning && (
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              aria-label={t('onboarding', 'close')}
              onClick={onClose}
            />
          )}
        </div>

        <Text block style={{ color: tokens.colorNeutralForeground3 }}>
          {t('onboarding', 'webPartIntro')}
        </Text>

        {showSetupNotifications ? (
          <SetupContextNotifications
            isTeamsHost={isTeamsHost}
            isSiteOwner={isSiteOwner}
            isAppAdministrator={isAppAdministrator}
            ownerAccessMessage={ownerAccessMessage}
            showSetupActions={variant !== 'modal'}
            onCompleteSetup={onCompleteSetup}
            onOpenSettings={onOpenSettings}
          />
        ) : null}

        {showPreSetupOverview && (
          <div className={styles.overview}>
            <Text size={200} className={styles.overviewLabel}>
              {t('onboarding', 'whatYouGet')}
            </Text>
            <div className={styles.featureGrid}>
              {FEATURE_HIGHLIGHT_KEYS.map((feature) => (
                <div
                  key={feature.titleKey}
                  className={mergeClasses(
                    styles.featureItem,
                    feature.highlight && styles.featureItemHighlight
                  )}
                >
                  <span className={styles.featureIcon} aria-hidden>
                    {feature.icon}
                  </span>
                  <span>
                    <Text size={300} weight="semibold" block>
                      {t('onboarding', feature.titleKey)}
                    </Text>
                    <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                      {t('onboarding', feature.descriptionKey)}
                    </Text>
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.trustNote}>
              <LockClosedRegular />
              <Text size={200}>{t('onboarding', 'tenantTrust')}</Text>
            </div>
          </div>
        )}

        {showPreSetupOverview && (
          <div className={styles.sampleOption}>
            <Checkbox
              checked={includeSampleData}
              onChange={(_, data) => setIncludeSampleData(Boolean(data.checked))}
              label={t('onboarding', 'seedSampleData')}
            />
            <Text size={200} block style={{ color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalXS }}>
              {t('onboarding', 'seedSampleDataDescExtended')}
            </Text>
          </div>
        )}

        {showProgressSteps && (
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
                  {!isRunning && step.description && (
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
                      {getListProgressLabel(step.message)}
                    </Text>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {isRunning && (
          <Text size={200} block italic style={{ color: tokens.colorNeutralForeground3 }}>
            {t('onboarding', 'setupMayTakeTimeProgress')}
          </Text>
        )}

        {error && (
          <AppMessageBar intent="error">{error}</AppMessageBar>
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
          {showPreSetupOverview && onSkip && (
            <Button appearance="secondary" onClick={onSkip}>
              {t('onboarding', 'skipSetup')}
            </Button>
          )}
          {showPreSetupOverview && (
            <Button
              appearance="primary"
              icon={<PlayRegular />}
              onClick={() => onStart({ includeSampleData })}
            >
              {t('onboarding', 'startSetup')}
            </Button>
          )}
          {allDone && (
            <AppMessageBar intent="success" style={{ flex: 1 }}>
              {t('onboarding', 'setupCompleteLoading')}
            </AppMessageBar>
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
