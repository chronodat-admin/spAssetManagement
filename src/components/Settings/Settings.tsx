import * as React from 'react';
import {
  Button,
  Card,
  CardFooter,
  Field,
  Input,
  makeStyles,
  mergeClasses,
  shorthands,
  Spinner,
  Switch,
  tokens
} from '@fluentui/react-components';
import { SaveRegular } from '@fluentui/react-icons';
import {
  ArrowClockwiseRegular,
  PlayRegular,
  SettingsRegular
} from '@fluentui/react-icons';
import { IAppSettings, IClearSeedDataResult, ILookupItem, IProvisioningStatus } from '../../models/IAssetApp';
import { CATEGORIES_LIST_TITLE } from '../../models/IListDefinitions';
import { ComplianceSettingsTab } from '../Compliance/ComplianceSettingsTab';
import { ComplianceService } from '../../services/ComplianceService';
import { LookupListManager } from '../LookupLists/LookupListManager';
import { SubCategoryListManager } from '../LookupLists/SubCategoryListManager';
import { AssetService } from '../../services/AssetService';
import { RightDetailPanel } from '../Layout/RightDetailPanel';
import { AppMessageBar } from '../Layout/AppMessageBar';
import { parseAppearanceSettings, serializeAppearanceSettings } from '../../lib/appearance-settings/storage';
import type { IAppearanceSettings } from '../../models/IAppearanceSettings';
import { syncSharePointLeftNavVisibility, syncSharePointPageBarVisibility, syncSharePointTopBarVisibility } from '../../utils/loadAssetManagementStyles';
import { DEFAULT_APP_TITLE, resolveAppDisplayName } from '../../constants/spfxComponents';
import { isHiddenSettingsPage } from '../../constants/scheduleDependentFeatures';
import { validateAppSettings } from '../../utils/assetValidation';
import { validateOptionalHttpUrl } from '../../utils/urlValidation';
import { SetupStatusPanel } from './SetupStatusPanel';
import { buildFormSettingsForSave, FormSettingsTab } from './FormSettingsTab';
import { FormTemplatesManager } from './FormTemplatesManager';
import { AssetStatusPriorityTab } from './AssetStatusPriorityTab';
import { NumberingSettingsTab } from './NumberingSettingsTab';
import { DropdownOptionsTab } from './DropdownOptionsTab';
import { TagsSettingsTab } from './TagsSettingsTab';
import { EmailIntegrationTab } from './EmailIntegrationTab';
import { NotificationWorkflowsTab } from './NotificationWorkflowsTab';
import { WorkflowRulesTab } from './WorkflowRulesTab';
import { EmailTemplatesTab } from './EmailTemplatesTab';
import { ScheduledReportsTab } from './ScheduledReportsTab';
import { SubscriptionSettingsTab } from './SubscriptionSettingsTab';
import { AuditLogTab } from './AuditLogTab';
import { AppAdministratorsTab } from './AppAdministratorsTab';
import { RolesAndPermissionsTab } from './RolesAndPermissionsTab';
import { IntuneSyncTab } from './IntuneSyncTab';
import { BulkImportTab } from './BulkImportTab';
import { LanguageSettingsTab } from './LanguageSettingsTab';
import { RemindersTab } from './RemindersTab';
import { AppearanceSettingsTab } from './AppearanceSettingsTab';
import {
  SettingsSidebar,
  SETTINGS_SELF_SAVE_PAGES,
  SettingsPageId
} from './SettingsSidebar';
import { SETTINGS_PAGE_BY_ID as SETTINGS_PAGE_META, isSettingsLookupPage } from './settingsPageMeta';
import { SettingsPageHeader } from './SettingsPageHeader';
import { SampleDataSettingsSection } from './SampleDataSettingsSection';
import { scrollAppContentToTop } from '../../utils/scrollAppContentToTop';
import { APP_ADMINISTRATOR_REQUIRED_MESSAGE } from '../../utils/sitePermissions';
import type { MailSendApprovalUiStatus } from '../../models/IMailSendApproval';
import type { AadHttpClientFactory } from '@microsoft/sp-http';
import type { IAsset } from '../../models/IAsset';
import { RoleService } from '../../services/RoleService';
import { ImportExportService } from '../../services/ImportExportService';
import { IntuneSyncService } from '../../services/IntuneSyncService';
import { AssignmentService } from '../../services/AssignmentService';
import { SoftwareLicenseService } from '../../services/SoftwareLicenseService';
import { resolveEmailDeliveryMode } from '../../lib/workflow-settings/emailIntegration';
import { parseCustomFieldExtensions, parseFormSettings } from '../../lib/form-config/storage';
import {
  parseWorkflowSettings,
  serializeWorkflowSettings
} from '../../lib/workflow-settings/storage';
import { buildLegacyTicketPrefix } from '../../lib/workflow-settings/numberingEngine';
import type { IWorkflowSettings } from '../../models/IWorkflowSettings';
import type { FormSettings } from '../../lib/form-config/types';
import { useTranslation } from '../../i18n/LocaleContext';
import {
  getLocalizedSettingsPageDescription,
  getLocalizedSettingsPageLabel
} from '../../i18n/pageLabels';

const useStyles = makeStyles({
  card: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    width: '100%',
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  formBody: {
    padding: tokens.spacingHorizontalL,
    display: 'grid',
    gap: tokens.spacingVerticalM,
    minWidth: 0,
    '& > *': {
      minWidth: 0
    }
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: tokens.spacingHorizontalL
  },
  sectionTitle: {
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalXS,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  toggleRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalM
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2
  },
  settingCopy: {
    flex: '1 1 auto',
    minWidth: 0
  },
  setupRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2
  },
  setupSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
    flex: '1 1 auto'
  },
  setupReady: {
    color: tokens.colorPaletteGreenForeground2
  },
  setupIncomplete: {
    color: tokens.colorPaletteYellowForeground2
  },
  settingsLayout: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    alignItems: 'flex-start',
    width: '100%'
  },
  settingsContent: {
    flex: '1 1 auto',
    minWidth: 0
  }
});

type SettingsTab = SettingsPageId;

export interface ISettingsProps {
  settings?: IAppSettings;
  provisioningStatus?: IProvisioningStatus;
  riskService: AssetService;
  isAppAdministrator?: boolean;
  isSiteOwner?: boolean;
  complianceService?: ComplianceService;
  categories?: ILookupItem[];
  onLookupDataChanged?: () => void;
  onSaved: () => void;
  onRunSetup?: () => void;
  onRefreshSetupStatus?: () => void;
  refreshingSetupStatus?: boolean;
  openSetupStatusPanel?: boolean;
  onSetupStatusPanelOpened?: () => void;
  openSubscriptionTab?: boolean;
  onSubscriptionTabOpened?: () => void;
  initialSettingsTab?: SettingsPageId;
  onClearSeedData?: () => Promise<IClearSeedDataResult>;
  onRestoreSampleData?: () => Promise<number>;
  mailSendStatus?: MailSendApprovalUiStatus;
  mailSendAdminUrl?: string;
  onRefreshMailSendStatus?: () => void;
  refreshingMailSendStatus?: boolean;
  subscriptionApiConfigured?: boolean;
  roleService?: RoleService;
  importExportService?: ImportExportService;
  intuneSyncService?: IntuneSyncService;
  assignmentService?: AssignmentService;
  softwareService?: SoftwareLicenseService;
  aadHttpClientFactory?: AadHttpClientFactory;
  assets?: IAsset[];
  adminEmails?: string[];
}

export const Settings: React.FC<ISettingsProps> = ({
  settings,
  provisioningStatus,
  riskService,
  isAppAdministrator = true,
  isSiteOwner = true,
  complianceService,
  categories = [],
  onLookupDataChanged,
  onSaved,
  onRunSetup,
  onRefreshSetupStatus,
  refreshingSetupStatus,
  openSetupStatusPanel,
  onSetupStatusPanelOpened,
  openSubscriptionTab,
  onSubscriptionTabOpened,
  initialSettingsTab,
  onClearSeedData,
  onRestoreSampleData,
  mailSendStatus,
  mailSendAdminUrl,
  onRefreshMailSendStatus,
  refreshingMailSendStatus,
  subscriptionApiConfigured = false,
  roleService,
  importExportService,
  intuneSyncService,
  assignmentService,
  softwareService,
  aadHttpClientFactory,
  assets = [],
  adminEmails = []
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const localizedSettingsPages = React.useMemo(() => {
    const pages = {} as Record<SettingsTab, (typeof SETTINGS_PAGE_META)[SettingsTab]>;
    (Object.keys(SETTINGS_PAGE_META) as SettingsTab[]).forEach((pageId) => {
      const page = SETTINGS_PAGE_META[pageId];
      pages[pageId] = {
        ...page,
        label: getLocalizedSettingsPageLabel(pageId, t, page.label),
        description: getLocalizedSettingsPageDescription(pageId, t, page.description)
      };
    });
    return pages;
  }, [t]);
  const [activeTab, setActiveTab] = React.useState<SettingsTab>(initialSettingsTab ?? 'general');
  const [setupStatusOpen, setSetupStatusOpen] = React.useState(false);

  React.useEffect(() => {
    if (isHiddenSettingsPage(activeTab)) {
      setActiveTab('general');
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (initialSettingsTab) {
      setActiveTab(isHiddenSettingsPage(initialSettingsTab) ? 'general' : initialSettingsTab);
    }
  }, [initialSettingsTab]);
  const [title, setTitle] = React.useState(() => resolveAppDisplayName(settings?.Title));
  const [appearanceSettings, setAppearanceSettings] = React.useState<IAppearanceSettings>(() =>
    parseAppearanceSettings(settings)
  );
  const [riskMgmtProc, setAssetMgmtProc] = React.useState(settings?.AssetMgmtProc || '');
  const [dashboardName, setDashboardName] = React.useState(settings?.DashboardName || '');
  const [dashboardDynamicNaming, setDashboardDynamicNaming] = React.useState(
    settings?.DashboardDynamicNaming || 'Yes'
  );
  const [dashboardHoverEnabled, setDashboardHoverEnabled] = React.useState(
    settings?.DashboardHoverEnabled || 'Yes'
  );
  const [dashboardFinancialExposureEnabled, setDashboardFinancialExposureEnabled] =
    React.useState(settings?.DashboardFinExpEnabled || 'Yes');
  const [formSettings, setFormSettings] = React.useState<FormSettings>(() => {
    const parsed = parseFormSettings(settings);
    return {
      ...parsed,
      risks: {
        ...parsed.risks,
        customFields: parseCustomFieldExtensions(settings)
      }
    };
  });
  const [workflowSettings, setWorkflowSettings] = React.useState<IWorkflowSettings>(() =>
    parseWorkflowSettings(settings)
  );
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [messageIntent, setMessageIntent] = React.useState<'success' | 'error'>('success');

  React.useEffect(() => {
    setTitle(resolveAppDisplayName(settings?.Title));
    setAppearanceSettings(parseAppearanceSettings(settings));
    setAssetMgmtProc(settings?.AssetMgmtProc || '');
    setDashboardName(settings?.DashboardName || '');
    setDashboardDynamicNaming(settings?.DashboardDynamicNaming || 'Yes');
    setDashboardHoverEnabled(settings?.DashboardHoverEnabled || 'Yes');
    setDashboardFinancialExposureEnabled(settings?.DashboardFinExpEnabled || 'Yes');
    const parsed = parseFormSettings(settings);
    setFormSettings({
      ...parsed,
      risks: {
        ...parsed.risks,
        customFields: parseCustomFieldExtensions(settings)
      }
    });
    setWorkflowSettings(parseWorkflowSettings(settings));
  }, [settings]);

  React.useEffect(() => {
    return () => {
      const appearance = parseAppearanceSettings(settings);
      syncSharePointPageBarVisibility(appearance.hideSharePointPageBar);
      syncSharePointTopBarVisibility(appearance.hideSharePointTopBar);
      syncSharePointLeftNavVisibility(appearance.hideSharePointLeftNav);
    };
  }, [settings]);

  React.useEffect(() => {
    if (openSetupStatusPanel) {
      setSetupStatusOpen(true);
      onSetupStatusPanelOpened?.();
    }
  }, [openSetupStatusPanel, onSetupStatusPanelOpened]);

  React.useEffect(() => {
    if (openSubscriptionTab) {
      setActiveTab('subscription');
      onSubscriptionTabOpened?.();
    }
  }, [openSubscriptionTab, onSubscriptionTabOpened]);

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setMessage('');

    const assetNumbering = workflowSettings.numbering.find((item) => item.entityType === 'asset');
    const ticketPrefix = assetNumbering
      ? buildLegacyTicketPrefix(assetNumbering)
      : settings.TicketIDPrefix || 'AM-';

    const validationError = validateAppSettings({
      title,
      prefix: ticketPrefix,
      colorScheme: appearanceSettings.colorScheme
    });
    const procedureUrlError = validateOptionalHttpUrl(
      riskMgmtProc,
      `${DEFAULT_APP_TITLE} procedure URL`
    );
    if (validationError || procedureUrlError) {
      setMessageIntent('error');
      setMessage(validationError || procedureUrlError || 'Invalid settings.');
      setSaving(false);
      return;
    }

    try {
      await riskService.updateAppSettings(settings.Id, {
        Title: resolveAppDisplayName(title),
        TicketIDPrefix: ticketPrefix.trim(),
        ColorScheme: appearanceSettings.colorScheme,
        AppearanceSettings: serializeAppearanceSettings(appearanceSettings),
        AssetMgmtProc: riskMgmtProc.trim(),
        DashboardName: dashboardName.trim(),
        DashboardDynamicNaming: dashboardDynamicNaming,
        DashboardHoverEnabled: dashboardHoverEnabled,
        DashboardFinExpEnabled: dashboardFinancialExposureEnabled,
        WorkflowSettings: serializeWorkflowSettings(workflowSettings),
        ...buildFormSettingsForSave(settings, formSettings),
        Reviewed: 'Yes'
      });
      await riskService.syncAssetStatusChoices(workflowSettings);
      await riskService.syncAssetDropdownChoices(formSettings);
      setMessageIntent('success');
      setMessage(t('onboarding', 'settingsSaved'));
      onSaved();
    } catch (err) {
      setMessageIntent('error');
      setMessage(err instanceof Error ? err.message : t('errors', 'saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const setupIncomplete = provisioningStatus && !provisioningStatus.isComplete;
  const showSaveFooter = !SETTINGS_SELF_SAVE_PAGES.includes(activeTab);

  const handleOpenSetupStatus = (): void => {
    setSetupStatusOpen(true);
  };

  const handleCloseSetupStatus = (): void => {
    setSetupStatusOpen(false);
  };

  const handleRunSetupFromPanel = (): void => {
    setSetupStatusOpen(false);
    onRunSetup?.();
  };

  const handleSelectSettingsTab = (page: SettingsTab): void => {
    setActiveTab(page);
    scrollAppContentToTop('auto');
  };

  if (!isAppAdministrator) {
    return (
      <AppMessageBar intent="warning">{APP_ADMINISTRATOR_REQUIRED_MESSAGE}</AppMessageBar>
    );
  }

  return (
    <div>
      {provisioningStatus && (
        <AppMessageBar
          intent={provisioningStatus.isComplete ? 'success' : 'warning'}
          style={{ marginBottom: tokens.spacingVerticalL }}
          actions={
            <Button appearance="secondary" icon={<SettingsRegular />} onClick={handleOpenSetupStatus}>
              {t('onboarding', 'viewSetupStatus')}
            </Button>
          }
        >
          {provisioningStatus.isComplete
            ? t('onboarding', 'listsReady')
            : t('onboarding', 'listsIncomplete')}
        </AppMessageBar>
      )}

      {!settings && setupIncomplete && (
        <AppMessageBar intent="info" style={{ marginTop: tokens.spacingVerticalL }}>
          {t('onboarding', 'settingsAfterSetup')}
        </AppMessageBar>
      )}

      {!settings && !setupIncomplete && (
        <AppMessageBar intent="warning" style={{ marginTop: tokens.spacingVerticalL }}>
          {t('onboarding', 'appSettingsNotFound')}
        </AppMessageBar>
      )}

      {settings && (
        <div className={styles.settingsLayout}>
          <SettingsSidebar
            activePage={activeTab}
            onSelect={handleSelectSettingsTab}
            showCompliance={Boolean(complianceService)}
            graphEmailNotificationsEnabled={resolveEmailDeliveryMode(workflowSettings) === 'graph'}
            mailSendStatus={mailSendStatus}
            mailSendAdminUrl={mailSendAdminUrl}
            onRefreshMailSendStatus={onRefreshMailSendStatus}
            refreshingMailSendStatus={refreshingMailSendStatus}
          />
          <Card className={mergeClasses(styles.card, styles.settingsContent)}>
          <form onSubmit={(e) => void handleSave(e)}>
            <div className={styles.formBody}>
              {message && <AppMessageBar intent={messageIntent}>{message}</AppMessageBar>}

              {settings.Reviewed !== 'Yes' && (
                <AppMessageBar intent="info">
                  {t('onboarding', 'reviewAndSave')}
                </AppMessageBar>
              )}

              {!isSettingsLookupPage(activeTab) &&
                activeTab !== 'auditLog' &&
                activeTab !== 'subscription' &&
                activeTab !== 'appAdministrators' &&
                activeTab !== 'rolesAndPermissions' &&
                activeTab !== 'intuneSync' &&
                activeTab !== 'bulkImport' &&
                activeTab !== 'language' &&
                activeTab !== 'reminders' &&
                (() => {
                const pageMeta = localizedSettingsPages[activeTab];
                return pageMeta ? (
                  <SettingsPageHeader
                    title={pageMeta.label}
                    description={pageMeta.description}
                    icon={pageMeta.icon}
                  />
                ) : (
                  <SettingsPageHeader title={t('nav', 'settings', 'Settings')} icon={SettingsRegular} />
                );
              })()}

              {activeTab === 'general' && (
                <>
                  <Field
                    label="App display name"
                    hint={`Shown in the top navigation bar. Default: ${DEFAULT_APP_TITLE}.`}
                    required
                  >
                    <Input value={title} onChange={(_, data) => setTitle(data.value)} required />
                  </Field>
                  <Field
                    label={`${DEFAULT_APP_TITLE} procedure URL`}
                    hint={`Link to your ${DEFAULT_APP_TITLE} procedure document. When set, a document link appears in the top navigation bar.`}
                  >
                    <Input
                      value={riskMgmtProc}
                      onChange={(_, data) => setAssetMgmtProc(data.value)}
                      placeholder="https://..."
                      type="url"
                    />
                  </Field>

                  {onClearSeedData && (
                    <SampleDataSettingsSection
                      isSiteOwner={isSiteOwner}
                      onClearSeedData={onClearSeedData}
                      onRestoreSampleData={onRestoreSampleData}
                      onCleared={() => {
                        onLookupDataChanged?.();
                        onRefreshSetupStatus?.();
                      }}
                      settingRowClassName={styles.settingRow}
                      settingCopyClassName={styles.settingCopy}
                    />
                  )}
                </>
              )}

              {activeTab === 'appearance' && (
                <AppearanceSettingsTab
                  value={appearanceSettings}
                  onChange={setAppearanceSettings}
                />
              )}

              {activeTab === 'dashboard' && (
                <>
                  <Field
                    label="Dashboard name"
                    hint="Custom label for the dashboard. Leave blank to use the app display name."
                  >
                    <Input
                      value={dashboardName}
                      onChange={(_, data) => setDashboardName(data.value)}
                      placeholder="Asset Dashboard"
                    />
                  </Field>

                  <div className={styles.settingRow}>
                    <div className={styles.settingCopy}>
                      <strong>Dynamic dashboard naming</strong>
                      <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
                        Update the dashboard title when filtering by business or project.
                      </div>
                    </div>
                    <Switch
                      checked={dashboardDynamicNaming === 'Yes'}
                      onChange={(_, data) => setDashboardDynamicNaming(data.checked ? 'Yes' : 'No')}
                    />
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingCopy}>
                      <strong>Heat map cell details</strong>
                      <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
                        Allow clicking heat map cells to open a list of items in that cell.
                      </div>
                    </div>
                    <Switch
                      checked={dashboardHoverEnabled === 'Yes'}
                      onChange={(_, data) => setDashboardHoverEnabled(data.checked ? 'Yes' : 'No')}
                    />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingCopy}>
                      <strong>Financial exposure summary</strong>
                      <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
                        Show the financial exposure card on the dashboard with total cost and top assets.
                      </div>
                    </div>
                    <Switch
                      checked={dashboardFinancialExposureEnabled === 'Yes'}
                      onChange={(_, data) =>
                        setDashboardFinancialExposureEnabled(data.checked ? 'Yes' : 'No')
                      }
                    />
                  </div>
                </>
              )}

              {activeTab === 'forms' && settings && (
                <FormSettingsTab formSettings={formSettings} onChange={setFormSettings} />
              )}

              {activeTab === 'formTemplates' && (
                <FormTemplatesManager riskService={riskService} />
              )}

              {activeTab === 'riskStatusPriority' && (
                <AssetStatusPriorityTab
                  workflowSettings={workflowSettings}
                  onChange={setWorkflowSettings}
                />
              )}

              {activeTab === 'numbering' && (
                <NumberingSettingsTab workflowSettings={workflowSettings} onChange={setWorkflowSettings} />
              )}

              {activeTab === 'dropdownOptions' && (
                <DropdownOptionsTab formSettings={formSettings} onChange={setFormSettings} />
              )}

              {activeTab === 'tags' && (
                <TagsSettingsTab workflowSettings={workflowSettings} onChange={setWorkflowSettings} />
              )}

              {activeTab === 'emailIntegration' && (
                <EmailIntegrationTab
                  workflowSettings={workflowSettings}
                  onChange={setWorkflowSettings}
                  siteUrl={riskService.getSiteWebUrl()}
                  subscriptionApiConfigured={subscriptionApiConfigured}
                  onNavigateToSubscription={() => handleSelectSettingsTab('subscription')}
                  mailSendStatus={mailSendStatus}
                  mailSendAdminUrl={mailSendAdminUrl}
                  onRefreshMailSendStatus={onRefreshMailSendStatus}
                  refreshingMailSendStatus={refreshingMailSendStatus}
                />
              )}

              {activeTab === 'notificationWorkflows' && (
                <NotificationWorkflowsTab
                  workflowSettings={workflowSettings}
                  onChange={setWorkflowSettings}
                />
              )}

              {activeTab === 'workflowRules' && (
                <WorkflowRulesTab
                  workflowSettings={workflowSettings}
                  onChange={setWorkflowSettings}
                  riskService={riskService}
                  settings={settings}
                />
              )}

              {activeTab === 'emailTemplates' && (
                <EmailTemplatesTab
                  workflowSettings={workflowSettings}
                  onChange={setWorkflowSettings}
                  riskService={riskService}
                  settings={settings}
                />
              )}

              {activeTab === 'scheduledReports' && (
                <ScheduledReportsTab
                  workflowSettings={workflowSettings}
                  onChange={setWorkflowSettings}
                  riskService={riskService}
                  settings={settings}
                />
              )}

              {activeTab === 'auditLog' && <AuditLogTab riskService={riskService} />}

              {activeTab === 'compliance' && complianceService && (
                <ComplianceSettingsTab complianceService={complianceService} />
              )}

              {activeTab === 'subscription' && <SubscriptionSettingsTab />}

              {activeTab === 'appAdministrators' && (
                <AppAdministratorsTab
                  riskService={riskService}
                  pageTitle={localizedSettingsPages.appAdministrators.label}
                  pageDescription={localizedSettingsPages.appAdministrators.description}
                  pageIcon={localizedSettingsPages.appAdministrators.icon}
                />
              )}

              {activeTab === 'rolesAndPermissions' && roleService && (
                <RolesAndPermissionsTab
                  roleService={roleService}
                  assetService={riskService}
                  pageTitle={localizedSettingsPages.rolesAndPermissions.label}
                  pageDescription={localizedSettingsPages.rolesAndPermissions.description}
                  pageIcon={localizedSettingsPages.rolesAndPermissions.icon}
                />
              )}

              {activeTab === 'language' && (
                <LanguageSettingsTab
                  pageTitle={localizedSettingsPages.language.label}
                  pageDescription={localizedSettingsPages.language.description}
                  pageIcon={localizedSettingsPages.language.icon}
                />
              )}

              {activeTab === 'intuneSync' && intuneSyncService && aadHttpClientFactory && (
                <IntuneSyncTab
                  aadHttpClientFactory={aadHttpClientFactory}
                  intuneSyncService={intuneSyncService}
                  pageTitle={localizedSettingsPages.intuneSync.label}
                  pageDescription={localizedSettingsPages.intuneSync.description}
                  pageIcon={localizedSettingsPages.intuneSync.icon}
                />
              )}

              {activeTab === 'bulkImport' && importExportService && (
                <BulkImportTab
                  importExportService={importExportService}
                  pageTitle={localizedSettingsPages.bulkImport.label}
                  pageDescription={localizedSettingsPages.bulkImport.description}
                  pageIcon={localizedSettingsPages.bulkImport.icon}
                  onImported={onLookupDataChanged}
                />
              )}

              {activeTab === 'reminders' &&
                aadHttpClientFactory &&
                assignmentService &&
                softwareService && (
                  <RemindersTab
                    aadHttpClientFactory={aadHttpClientFactory}
                    assets={assets}
                    assignmentService={assignmentService}
                    softwareService={softwareService}
                    workflowSettings={workflowSettings}
                    adminEmails={adminEmails}
                    pageTitle={localizedSettingsPages.reminders.label}
                    pageDescription={localizedSettingsPages.reminders.description}
                    pageIcon={localizedSettingsPages.reminders.icon}
                  />
                )}

              {activeTab === 'lookupCategories' && (
                <LookupListManager
                  listTitle={CATEGORIES_LIST_TITLE}
                  displayTitle="Asset Categories"
                  riskService={riskService}
                  settings={settings}
                  onChanged={() => onLookupDataChanged?.()}
                  pageTitle={localizedSettingsPages.lookupCategories.label}
                  pageDescription={localizedSettingsPages.lookupCategories.description}
                  pageIcon={localizedSettingsPages.lookupCategories.icon}
                />
              )}

              {activeTab === 'lookupSubCategories' && (
                <SubCategoryListManager
                  categories={categories}
                  riskService={riskService}
                  settings={settings}
                  onChanged={() => onLookupDataChanged?.()}
                  pageTitle={localizedSettingsPages.lookupSubCategories.label}
                  pageDescription={localizedSettingsPages.lookupSubCategories.description}
                  pageIcon={localizedSettingsPages.lookupSubCategories.icon}
                />
              )}

              {activeTab === 'lookupLikelihood' && (
                <LookupListManager
                  listTitle="Likelihood"
                  displayTitle="Likelihood Scale"
                  showRating
                  ratingReadOnlyTitle
                  riskService={riskService}
                  settings={settings}
                  onChanged={() => onLookupDataChanged?.()}
                  pageTitle={localizedSettingsPages.lookupLikelihood.label}
                  pageDescription={localizedSettingsPages.lookupLikelihood.description}
                  pageIcon={localizedSettingsPages.lookupLikelihood.icon}
                />
              )}

              {activeTab === 'lookupConsequences' && (
                <LookupListManager
                  listTitle="Consequences"
                  displayTitle="Consequence Scale"
                  showRating
                  ratingReadOnlyTitle
                  riskService={riskService}
                  settings={settings}
                  onChanged={() => onLookupDataChanged?.()}
                  pageTitle={localizedSettingsPages.lookupConsequences.label}
                  pageDescription={localizedSettingsPages.lookupConsequences.description}
                  pageIcon={localizedSettingsPages.lookupConsequences.icon}
                />
              )}

              {activeTab === 'lookupRiskProfile' && (
                <LookupListManager
                  listTitle="RiskProfile"
                  displayTitle="Asset Types"
                  riskService={riskService}
                  settings={settings}
                  onChanged={() => onLookupDataChanged?.()}
                  pageTitle={localizedSettingsPages.lookupRiskProfile.label}
                  pageDescription={localizedSettingsPages.lookupRiskProfile.description}
                  pageIcon={localizedSettingsPages.lookupRiskProfile.icon}
                />
              )}

              {activeTab === 'lookupRiskResponse' && (
                <LookupListManager
                  listTitle="RiskResponse"
                  displayTitle="Vendors"
                  riskService={riskService}
                  settings={settings}
                  onChanged={() => onLookupDataChanged?.()}
                  pageTitle={localizedSettingsPages.lookupRiskResponse.label}
                  pageDescription={localizedSettingsPages.lookupRiskResponse.description}
                  pageIcon={localizedSettingsPages.lookupRiskResponse.icon}
                />
              )}

              {activeTab === 'lookupRiskStrategy' && (
                <LookupListManager
                  listTitle="RiskStrategy"
                  displayTitle="Locations"
                  riskService={riskService}
                  settings={settings}
                  onChanged={() => onLookupDataChanged?.()}
                  pageTitle={localizedSettingsPages.lookupRiskStrategy.label}
                  pageDescription={localizedSettingsPages.lookupRiskStrategy.description}
                  pageIcon={localizedSettingsPages.lookupRiskStrategy.icon}
                />
              )}
            </div>

            {showSaveFooter && (
            <CardFooter className={styles.footer}>
              <Button
                appearance="primary"
                type="submit"
                disabled={saving}
                icon={saving ? <Spinner size="tiny" /> : <SaveRegular />}
              >
                {saving ? t('onboarding', 'saving') : t('onboarding', 'saveSettings')}
              </Button>
            </CardFooter>
            )}
          </form>
        </Card>
        </div>
      )}

      {provisioningStatus && (
        <RightDetailPanel
          open={setupStatusOpen}
          wide
          title={t('onboarding', 'setupStatus')}
          subtitle={
            provisioningStatus.isComplete
              ? t('onboarding', 'allListsReady')
              : t('onboarding', 'someListsNeedSetup')
          }
          onClose={handleCloseSetupStatus}
          footer={
            <>
              <Button appearance="secondary" onClick={handleCloseSetupStatus}>
                {t('onboarding', 'close')}
              </Button>
              {onRefreshSetupStatus && (
                <Button
                  appearance="secondary"
                  icon={refreshingSetupStatus ? <Spinner size="tiny" /> : <ArrowClockwiseRegular />}
                  disabled={refreshingSetupStatus}
                  onClick={onRefreshSetupStatus}
                >
                  {t('onboarding', 'refresh')}
                </Button>
              )}
              {!provisioningStatus.isComplete && onRunSetup && (
                <Button appearance="primary" icon={<PlayRegular />} onClick={handleRunSetupFromPanel}>
                  {t('onboarding', 'completeSetup')}
                </Button>
              )}
            </>
          }
        >
          <SetupStatusPanel
            status={provisioningStatus}
            embedded
            hideActions
            mailSendStatus={mailSendStatus}
            mailSendAdminUrl={mailSendAdminUrl}
            onRefreshMailSendStatus={onRefreshMailSendStatus}
            refreshingMailSendStatus={refreshingMailSendStatus}
          />
        </RightDetailPanel>
      )}
    </div>
  );
};
