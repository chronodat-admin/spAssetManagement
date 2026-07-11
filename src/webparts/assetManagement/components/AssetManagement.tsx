import * as React from 'react';
import { DisplayMode } from '@microsoft/sp-core-library';
import { Link, Text, Title3 } from '@fluentui/react-components';
import { AppMessageBar } from '../../../components/Layout/AppMessageBar';
import { AppPage, IProvisioningStep, IProvisioningStatus } from '../../../models/IAssetApp';
import { IAppSettings, IAsset, ILookupItem } from '../../../models/IAsset';
import { ASSETS_LIST_TITLE, CATEGORIES_LIST_TITLE, ASSET_TYPES_LIST_TITLE, VENDORS_LIST_TITLE, LOCATIONS_LIST_TITLE } from '../../../models/IListDefinitions';
import { AssetManagementShell } from '../../../components/Layout/AssetManagementShell';
import { AppLoadingSkeleton } from '../../../components/Layout/AppLoadingSkeleton';
import { ContentCard } from '../../../components/Layout/ContentCard';
import { EditModePlaceholder } from '../../../components/Onboarding/EditModePlaceholder';
import { ProvisioningOnboarding } from '../../../components/Onboarding/ProvisioningOnboarding';
import { SetupPromptBanner } from '../../../components/Onboarding/SetupPromptBanner';
import { MailSendPromptBanner } from '../../../components/Onboarding/MailSendPromptBanner';
import { SubscriptionPaywall } from '../../../components/Subscription/SubscriptionPaywall';
import { SubscriptionConnectivityError } from '../../../components/Subscription/SubscriptionConnectivityError';
import { SubscriptionTrialBanner } from '../../../components/Subscription/SubscriptionTrialBanner';
import { Dashboard } from '../../../components/Dashboard/Dashboard';
import { AssetList } from '../../../components/Assets/AssetList';
import { AssetFormPanel } from '../../../components/Forms/AssetFormPanel';
import { AssignAssetPanel } from '../../../components/Operations/AssignAssetPanel';
import { BookAssetPanel } from '../../../components/Operations/BookAssetPanel';
import { ReturnAssetPanel } from '../../../components/Operations/ReturnAssetPanel';
import { BookingDetailsPanel } from '../../../components/Operations/BookingDetailsPanel';
import { DepreciationPage } from '../../../components/Operations/DepreciationPage';
import { SoftwareLicensesPage } from '../../../components/Operations/SoftwareLicensesPage';
import { InventoryPage } from '../../../components/Operations/InventoryPage';
import { MaintenancePage } from '../../../components/Operations/MaintenancePage';
import { RequestAssetPage } from '../../../components/Operations/RequestAssetPage';
import { MyRequestsPage } from '../../../components/Operations/MyRequestsPage';
import { ManageRequestsPage } from '../../../components/Operations/ManageRequestsPage';
import { BulkAssignPanel } from '../../../components/Operations/BulkAssignPanel';
import { BulkReturnPanel } from '../../../components/Operations/BulkReturnPanel';
import { BarcodeScannerPage } from '../../../components/Operations/BarcodeScannerPage';
import { AuditLogPage } from '../../../components/Operations/AuditLogPage';
import { LookupPageRouter } from '../../../components/LookupLists/LookupPageRouter';
import { Settings } from '../../../components/Settings/Settings';
import { ReportBuilder } from '../../../components/ReportBuilder/ReportBuilder';
import { AppearanceThemeProvider } from '../../../contexts/AppearanceThemeContext';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { AssetService } from '../../../services/AssetService';
import { AssignmentService } from '../../../services/AssignmentService';
import { DepreciationService } from '../../../services/DepreciationService';
import { SoftwareLicenseService } from '../../../services/SoftwareLicenseService';
import { InventoryService } from '../../../services/InventoryService';
import { ListProvisioningService } from '../../../services/ListProvisioningService';
import { ReportBuilderService } from '../../../services/ReportBuilderService';
import { MaintenanceService } from '../../../services/MaintenanceService';
import { AssetRequestService } from '../../../services/AssetRequestService';
import { ImportExportService } from '../../../services/ImportExportService';
import { IntuneSyncService } from '../../../services/IntuneSyncService';
import { RoleService } from '../../../services/RoleService';
import { LocaleProvider, useTranslation } from '../../../i18n/LocaleContext';
import { formatMessage } from '../../../i18n/formatMessage';
import { useAppRoles } from '../../../hooks/useAppRoles';
import { canAccessPage } from '../../../utils/rbac';
import { removeAppLoadingState } from '../../../utils/loadAssetManagementStyles';
import { resolveAppDisplayName, SUBSCRIPTION_PRODUCT_SLUG } from '../../../constants/spfxComponents';
import {
  createInitialSteps,
  hasCompletedProvisioning,
  IProvisioningScope,
  markProvisioningComplete
} from '../../../utils/onboardingStorage';
import { getPageSubtitle, getPageTitle } from '../../../utils/pageTitles';
import { getDashboardSubtitle, getDashboardTitle } from '../../../utils/dashboardSettings';
import {
  loadPortfolioFilters,
  savePortfolioFilters
} from '../../../utils/appFilterStorage';
import { IDashboardFilters } from '../../../utils/dashboardAnalytics';
import { useListPermissions } from '../../../hooks/useListPermissions';
import { useMailSendApproval } from '../../../hooks/useMailSendApproval';
import { scrollAppContentToTop } from '../../../utils/scrollAppContentToTop';
import { setUserPhotoBaseUrl } from '../../../utils/userPhoto';
import { isAssignedToUser } from '../../../utils/assignmentUtils';
import {
  getAadTenantId,
  getSpfxSiteUrl,
  getSpfxTenantDisplayName
} from '../../../utils/spfxContext';
import type { FormMode } from '../../../lib/form-config/types';
import { IAssetManagementProps } from './IAssetManagementProps';

const LIST_PAGES: AppPage[] = [
  'allAssets',
  'assignedToMe',
  'available',
  'inRepair',
  'retired',
  'deletedAssets'
];

export const AssetManagement: React.FC<IAssetManagementProps> = (props) => (
  <LocaleProvider siteUrl={props.webUrl}>
    <AssetManagementImpl {...props} />
  </LocaleProvider>
);

const AssetManagementImpl: React.FC<IAssetManagementProps> = ({
  context,
  webUrl,
  siteTitle,
  displayMode,
  isTeamsHost = false,
  subscriptionApiUrl
}) => {
  const { t } = useTranslation();
  React.useMemo(() => setUserPhotoBaseUrl(webUrl), [webUrl]);

  const [currentPage, setCurrentPage] = React.useState<AppPage>('dashboard');
  const [portfolioFilters] = React.useState<IDashboardFilters>(() =>
    loadPortfolioFilters(webUrl)
  );
  const [assets, setAssets] = React.useState<IAsset[]>([]);
  const [settings, setSettings] = React.useState<IAppSettings | undefined>();
  const [categories, setCategories] = React.useState<ILookupItem[]>([]);
  const [assetTypes, setAssetTypes] = React.useState<ILookupItem[]>([]);
  const [vendors, setVendors] = React.useState<ILookupItem[]>([]);
  const [locations, setLocations] = React.useState<ILookupItem[]>([]);
  const [projects, setProjects] = React.useState<ILookupItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [formMode, setFormMode] = React.useState<FormMode>('create');
  const [editingAsset, setEditingAsset] = React.useState<IAsset | undefined>();
  const [showSetupWizard, setShowSetupWizard] = React.useState(false);
  const [provisioningStatus, setProvisioningStatus] = React.useState<IProvisioningStatus | undefined>();
  const [provisioningSteps, setProvisioningSteps] = React.useState<IProvisioningStep[]>(createInitialSteps());
  const [isProvisioning, setIsProvisioning] = React.useState(false);
  const [provisioningError, setProvisioningError] = React.useState('');
  const [bootstrapped, setBootstrapped] = React.useState(false);
  const [openSubscriptionTab, setOpenSubscriptionTab] = React.useState(false);

  const subscription = useSubscription();
  const appName = resolveAppDisplayName(settings?.Title || siteTitle);

  const assetService = React.useMemo(
    () =>
      new AssetService(context.spHttpClient, webUrl, {
        subscriptionApiUrl,
        aadHttpClientFactory: context.aadHttpClientFactory,
        getNotificationContext: () => ({
          tenantId: getAadTenantId(context),
          siteUrl: getSpfxSiteUrl(context),
          tenantName: getSpfxTenantDisplayName(context),
          productSlug: SUBSCRIPTION_PRODUCT_SLUG
        })
      }),
    [context, webUrl, subscriptionApiUrl]
  );

  const assignmentService = React.useMemo(
    () => new AssignmentService(context.spHttpClient, webUrl),
    [context.spHttpClient, webUrl]
  );

  const depreciationService = React.useMemo(
    () => new DepreciationService(context.spHttpClient, webUrl),
    [context.spHttpClient, webUrl]
  );

  const softwareService = React.useMemo(
    () => new SoftwareLicenseService(context.spHttpClient, webUrl),
    [context.spHttpClient, webUrl]
  );

  const inventoryService = React.useMemo(
    () => new InventoryService(context.spHttpClient, webUrl),
    [context.spHttpClient, webUrl]
  );

  const provisioningService = React.useMemo(
    () => new ListProvisioningService(context.spHttpClient, webUrl),
    [context.spHttpClient, webUrl]
  );

  const reportBuilderService = React.useMemo(
    () => new ReportBuilderService(context.spHttpClient, webUrl),
    [context.spHttpClient, webUrl]
  );

  const maintenanceService = React.useMemo(
    () => new MaintenanceService(context.spHttpClient, webUrl),
    [context.spHttpClient, webUrl]
  );

  const requestService = React.useMemo(
    () => new AssetRequestService(context.spHttpClient, webUrl),
    [context.spHttpClient, webUrl]
  );

  const importExportService = React.useMemo(
    () => new ImportExportService(context.spHttpClient, webUrl),
    [context.spHttpClient, webUrl]
  );

  const intuneSyncService = React.useMemo(
    () => new IntuneSyncService(context.spHttpClient, webUrl),
    [context.spHttpClient, webUrl]
  );

  const roleService = React.useMemo(
    () => new RoleService(context.spHttpClient, webUrl),
    [context.spHttpClient, webUrl]
  );

  const currentUserId = context.pageContext.legacyPageContext.userId as number | undefined;

  const provisioningScope = React.useMemo<IProvisioningScope>(
    () => ({
      tenantId: context.pageContext.aadInfo?.tenantId?.toString() || 'local',
      siteUrl: webUrl,
      userId: context.pageContext.legacyPageContext.userId?.toString() || 'anonymous'
    }),
    [context, webUrl]
  );

  const setupComplete =
    Boolean(provisioningStatus?.isComplete) || hasCompletedProvisioning(provisioningScope);

  const { permissions, isAppAdministrator, permissionRows } = useAppRoles(
    roleService,
    currentUserId,
    setupComplete
  );

  const adminEmails = React.useMemo(
    () =>
      [context.pageContext.user.email].filter((email): email is string => Boolean(email)),
    [context.pageContext.user.email]
  );

  const { permissions: assetPermissions } = useListPermissions(
    assetService,
    ASSETS_LIST_TITLE,
    undefined,
    setupComplete
  );

  const {
    status: mailSendStatus,
    adminUrl: mailSendAdminUrl,
    refreshing: refreshingMailSendStatus,
    refresh: refreshMailSendStatus
  } = useMailSendApproval({
    webUrl,
    aadHttpClientFactory: context.aadHttpClientFactory,
    enabled: currentPage === 'settings' || showSetupWizard
  });

  React.useEffect(() => {
    removeAppLoadingState(document.querySelector('.asset-management-webpart-host') as HTMLElement);
    setBootstrapped(true);
  }, []);

  React.useEffect(() => {
    savePortfolioFilters(webUrl, portfolioFilters);
  }, [webUrl, portfolioFilters]);

  React.useEffect(() => {
    scrollAppContentToTop();
  }, [currentPage]);

  const refreshProvisioningStatus = React.useCallback(async (options?: { fast?: boolean }): Promise<void> => {
    const status = await provisioningService.getProvisioningStatus(options);
    setProvisioningStatus(status);
  }, [provisioningService]);

  const loadData = React.useCallback(async (): Promise<void> => {
    if (!setupComplete) return;
    setLoading(true);
    setError('');
    try {
      const [nextSettings, nextCategories, nextProjects, nextAssetTypes, nextVendors, nextLocations, nextAssets] =
        await Promise.all([
        assetService.getAppSettings().catch(() => undefined),
        assetService.getLookupItems(CATEGORIES_LIST_TITLE).catch(() => [] as ILookupItem[]),
        assetService.getProjectItems().catch(() => [] as ILookupItem[]),
        assetService.getLookupItems(ASSET_TYPES_LIST_TITLE).catch(() => [] as ILookupItem[]),
        assetService.getLookupItems(VENDORS_LIST_TITLE).catch(() => [] as ILookupItem[]),
        assetService.getLookupItems(LOCATIONS_LIST_TITLE).catch(() => [] as ILookupItem[]),
        assetService.getAssets().catch(() => [] as IAsset[])
      ]);
      setSettings(nextSettings);
      setCategories(nextCategories);
      setProjects(nextProjects);
      setAssetTypes(nextAssetTypes);
      setVendors(nextVendors);
      setLocations(nextLocations);
      setAssets(nextAssets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [assetService, setupComplete]);

  React.useEffect(() => {
    void refreshProvisioningStatus({ fast: true });
  }, [refreshProvisioningStatus]);

  React.useEffect(() => {
    if (setupComplete) {
      void loadData();
    } else {
      setLoading(false);
    }
  }, [setupComplete, loadData]);

  const handleNavigate = React.useCallback((page: AppPage): void => {
    setCurrentPage(page);
  }, []);

  const handleOpenSubscriptionSettings = React.useCallback((): void => {
    setOpenSubscriptionTab(true);
    setCurrentPage('settings');
  }, []);

  const setupNotificationProps = React.useMemo(
    () => ({
      isSiteOwner: permissions.canAccessSettings,
      isAppAdministrator,
      onCompleteSetup: () => setShowSetupWizard(true),
      onOpenSettings: () => handleNavigate('settings')
    }),
    [permissions.canAccessSettings, isAppAdministrator, handleNavigate]
  );

  const handleRunSetup = React.useCallback(async (options?: { includeSampleData?: boolean }): Promise<void> => {
    setShowSetupWizard(true);
    setIsProvisioning(true);
    setProvisioningError('');
    setProvisioningSteps(createInitialSteps());
    try {
      const steps = createInitialSteps();
      setProvisioningSteps(steps);
      const result = await provisioningService.provisionAll(setProvisioningSteps, steps, {
        includeSampleData: options?.includeSampleData !== false
      });
      if (!result.success) {
        setProvisioningError(result.error || 'Setup failed. Review the steps above and try again.');
        await refreshProvisioningStatus();
        return;
      }
      markProvisioningComplete(provisioningScope);
      assetService.resetListAccessCaches();
      await refreshProvisioningStatus();
      setShowSetupWizard(false);
      await loadData();
    } catch (err) {
      setProvisioningError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsProvisioning(false);
    }
  }, [provisioningService, provisioningScope, refreshProvisioningStatus, loadData, assetService]);

  const handleCreateAsset = React.useCallback((): void => {
    if (!provisioningStatus?.isComplete) {
      setShowSetupWizard(true);
      return;
    }
    setEditingAsset(undefined);
    setFormMode('create');
    setShowForm(true);
  }, [provisioningStatus?.isComplete]);

  const handleViewAsset = React.useCallback((asset: IAsset): void => {
    setEditingAsset(asset);
    setFormMode('view');
    setShowForm(true);
  }, []);

  const handleEditAsset = React.useCallback((asset: IAsset): void => {
    setEditingAsset(asset);
    setFormMode('edit');
    setShowForm(true);
  }, []);

  const filteredAssets = React.useMemo(() => {
    switch (currentPage) {
      case 'assignedToMe':
        return assets.filter((a) =>
          isAssignedToUser(a, {
            id: currentUserId,
            email: context.pageContext.user.email,
            displayName: context.pageContext.user.displayName
          })
        );
      case 'available':
        return assets.filter((a) => {
          const status =
            typeof a.AM_Status === 'string' ? a.AM_Status : a.AM_Status?.Title;
          return status === 'Available' && !a.AM_IsDeleted;
        });
      case 'inRepair':
        return assets.filter((a) => {
          const status =
            typeof a.AM_Status === 'string' ? a.AM_Status : a.AM_Status?.Title;
          return status === 'In Repair' && !a.AM_IsDeleted;
        });
      case 'retired':
        return assets.filter((a) => {
          const status =
            typeof a.AM_Status === 'string' ? a.AM_Status : a.AM_Status?.Title;
          return status === 'Retired' && !a.AM_IsDeleted;
        });
      case 'deletedAssets':
        return assets.filter((a) => a.AM_IsDeleted);
      default:
        return assets.filter((a) => !a.AM_IsDeleted);
    }
  }, [assets, currentPage, context.pageContext.user, currentUserId]);

  if (displayMode === DisplayMode.Edit) {
    return <EditModePlaceholder isTeamsHost={isTeamsHost} />;
  }

  if (!bootstrapped || subscription.loading) {
    return <AppLoadingSkeleton fullPage />;
  }

  const subscriptionBlocked =
    subscription.configured && !subscription.loading && !subscription.hasAccess;

  if (
    subscriptionBlocked &&
    subscription.connectivityError &&
    currentPage !== 'settings'
  ) {
    return (
      <AppearanceThemeProvider settings={settings} webUrl={webUrl} isTeamsHost={isTeamsHost}>
        <SubscriptionConnectivityError
          onOpenSubscriptionSettings={handleOpenSubscriptionSettings}
        />
      </AppearanceThemeProvider>
    );
  }

  if (subscriptionBlocked && !subscription.connectivityError && currentPage !== 'settings') {
    return (
      <AppearanceThemeProvider settings={settings} webUrl={webUrl} isTeamsHost={isTeamsHost}>
        <SubscriptionPaywall onOpenSubscriptionSettings={handleOpenSubscriptionSettings} />
      </AppearanceThemeProvider>
    );
  }

  if (!setupComplete && !showSetupWizard) {
    return (
      <AppearanceThemeProvider settings={settings} webUrl={webUrl} isTeamsHost={isTeamsHost}>
        <ProvisioningOnboarding
          steps={provisioningSteps}
          isRunning={isProvisioning}
          error={provisioningError}
          isTeamsHost={isTeamsHost}
          mailSendStatus={mailSendStatus}
          mailSendAdminUrl={mailSendAdminUrl}
          onRefreshMailSendStatus={refreshMailSendStatus}
          refreshingMailSendStatus={refreshingMailSendStatus}
          onStart={(options) => void handleRunSetup(options)}
          {...setupNotificationProps}
        />
      </AppearanceThemeProvider>
    );
  }

  const pageTitle =
    currentPage === 'dashboard'
      ? getDashboardTitle(settings, portfolioFilters, categories, projects)
      : getPageTitle(currentPage, t);
  const pageSubtitle =
    currentPage === 'dashboard'
      ? getDashboardSubtitle(settings, portfolioFilters, categories, projects)
      : getPageSubtitle(currentPage, undefined, t);

  const renderPageContent = (): React.ReactNode => {
    if (loading && currentPage !== 'settings') {
      return <AppLoadingSkeleton />;
    }

    if (!canAccessPage(currentPage, permissions, permissionRows)) {
      return (
        <AppMessageBar intent="warning">
          {t('rbac', 'accessDenied', 'You do not have permission to view this page.')}
        </AppMessageBar>
      );
    }

    if (error) {
      return (
        <AppMessageBar intent="error">{error}</AppMessageBar>
      );
    }

    if (!setupComplete && currentPage === 'dashboard') {
      if (!provisioningStatus) {
        return <AppLoadingSkeleton />;
      }

      return (
        <>
          {!showSetupWizard ? (
            <SetupPromptBanner
              status={provisioningStatus}
              isSiteOwner={permissions.canAccessSettings}
              isAppAdministrator={isAppAdministrator}
              isTeamsHost={isTeamsHost}
              onCompleteSetup={() => setShowSetupWizard(true)}
              onOpenSettings={() => handleNavigate('settings')}
            />
          ) : null}
          <AppMessageBar intent="info">
            {t('onboarding', 'setupIncomplete')}{' '}
            <Link
              href="#"
              onClick={(event) => {
                event.preventDefault();
                handleNavigate('settings');
              }}
            >
              {t('nav', 'settings', 'Settings')}
            </Link>
          </AppMessageBar>
        </>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            risks={assets}
            businesses={categories}
            projects={projects}
            likelihoodItems={[]}
            consequenceItems={[]}
            settings={settings}
            filters={portfolioFilters}
            userId={currentUserId}
            userEmail={context.pageContext.user.email}
            userDisplayName={context.pageContext.user.displayName}
            onEditRisk={handleEditAsset}
          />
        );
      case 'reports':
        return <ReportBuilder reportBuilderService={reportBuilderService} />;
      case 'assignAsset':
        return (
          <AssignAssetPanel
            assets={assets}
            assetService={assetService}
            assignmentService={assignmentService}
            onComplete={() => void loadData()}
          />
        );
      case 'bookAsset':
        return (
          <BookAssetPanel
            assets={assets}
            assetService={assetService}
            assignmentService={assignmentService}
            onComplete={() => void loadData()}
          />
        );
      case 'returnAsset':
        return (
          <ReturnAssetPanel
            assets={assets}
            assignmentService={assignmentService}
            onComplete={() => void loadData()}
          />
        );
      case 'bookingDetails':
        return <BookingDetailsPanel assignmentService={assignmentService} />;
      case 'software':
        return <SoftwareLicensesPage softwareService={softwareService} />;
      case 'inventory':
        return <InventoryPage inventoryService={inventoryService} />;
      case 'maintenance':
        return (
          <MaintenancePage
            maintenanceService={maintenanceService}
            assetService={assetService}
            assets={assets}
          />
        );
      case 'requestAsset':
        return currentUserId ? (
          <RequestAssetPage
            requestService={requestService}
            categories={categories}
            currentUserId={currentUserId}
            onComplete={() => void loadData()}
          />
        ) : null;
      case 'myRequests':
        return currentUserId ? (
          <MyRequestsPage requestService={requestService} currentUserId={currentUserId} />
        ) : null;
      case 'manageRequests':
        return currentUserId ? (
          <ManageRequestsPage
            requestService={requestService}
            assignmentService={assignmentService}
            assets={assets}
            reviewerUserId={currentUserId}
            onChanged={() => void loadData()}
          />
        ) : null;
      case 'bulkAssign':
        return (
          <BulkAssignPanel
            assets={assets}
            assetService={assetService}
            assignmentService={assignmentService}
            onComplete={() => void loadData()}
          />
        );
      case 'bulkReturn':
        return (
          <BulkReturnPanel
            assets={assets}
            assignmentService={assignmentService}
            onComplete={() => void loadData()}
          />
        );
      case 'scanAsset':
        return <BarcodeScannerPage assets={assets} onViewAsset={handleViewAsset} />;
      case 'depreciation':
        return <DepreciationPage depreciationService={depreciationService} />;
      case 'auditLog':
        return <AuditLogPage assetService={assetService} />;
      case 'categories':
      case 'subCategories':
      case 'vendors':
      case 'locations':
      case 'projects':
        return (
          <LookupPageRouter
            page={currentPage}
            assetService={assetService}
            settings={settings}
            categories={categories}
            onChanged={() => void loadData()}
          />
        );
      case 'settings':
        return (
          <Settings
            settings={settings}
            provisioningStatus={provisioningStatus}
            riskService={assetService}
            isAppAdministrator={isAppAdministrator}
            isSiteOwner={permissions.canAccessSettings}
            categories={categories}
            assets={assets}
            adminEmails={adminEmails}
            roleService={roleService}
            importExportService={importExportService}
            intuneSyncService={intuneSyncService}
            assignmentService={assignmentService}
            softwareService={softwareService}
            aadHttpClientFactory={context.aadHttpClientFactory}
            onSaved={() => void loadData()}
            onRunSetup={() => setShowSetupWizard(true)}
            onClearSeedData={() => provisioningService.clearSeedData()}
            onRestoreSampleData={() => provisioningService.restoreSampleData()}
            onRefreshSetupStatus={() => void refreshProvisioningStatus()}
            mailSendStatus={mailSendStatus}
            mailSendAdminUrl={mailSendAdminUrl}
            onRefreshMailSendStatus={refreshMailSendStatus}
            refreshingMailSendStatus={refreshingMailSendStatus}
            subscriptionApiConfigured={subscription.configured}
            openSubscriptionTab={openSubscriptionTab}
            onSubscriptionTabOpened={() => setOpenSubscriptionTab(false)}
          />
        );
      default:
        if (LIST_PAGES.includes(currentPage)) {
          return (
            <AssetList
              risks={filteredAssets}
              title={getPageTitle(currentPage, t)}
              subtitle={pageSubtitle}
              listKey={currentPage}
              settings={settings}
              riskService={assetService}
              onView={handleViewAsset}
              onEdit={handleEditAsset}
              canEdit={assetPermissions.canEdit && permissions.canManageAssets}
              canDelete={assetPermissions.canDelete && permissions.canDeleteAssets}
              canRunBulkOps={permissions.canRunBulkOps}
              onRefresh={() => void loadData()}
            />
          );
        }
        return (
          <ContentCard>
            <Title3>{pageTitle}</Title3>
            <Text>
              {pageSubtitle ||
                formatMessage(t('errors', 'pageNotFound'), { appName })}
            </Text>
          </ContentCard>
        );
    }
  };

  return (
    <AppearanceThemeProvider settings={settings} webUrl={webUrl} isTeamsHost={isTeamsHost}>
      {showSetupWizard && (
        <ProvisioningOnboarding
          steps={provisioningSteps}
          isRunning={isProvisioning}
          error={provisioningError}
          isTeamsHost={isTeamsHost}
          variant="modal"
          mailSendStatus={mailSendStatus}
          mailSendAdminUrl={mailSendAdminUrl}
          onRefreshMailSendStatus={refreshMailSendStatus}
          refreshingMailSendStatus={refreshingMailSendStatus}
          onStart={(options) => void handleRunSetup(options)}
          onClose={() => setShowSetupWizard(false)}
          {...setupNotificationProps}
        />
      )}
      <AssetManagementShell
        currentPage={currentPage}
        pageTitle={pageTitle}
        pageSubtitle={pageSubtitle}
        appName={appName}
        onNavigate={handleNavigate}
        onCreateAsset={handleCreateAsset}
        createAssetDisabled={subscriptionBlocked || !assetPermissions.canAdd || !permissions.canManageAssets}
        setupComplete={provisioningStatus ? provisioningStatus.isComplete : setupComplete}
        onRunSetup={() => setShowSetupWizard(true)}
        showSettings={permissions.canAccessSettings}
        permissions={permissions}
        permissionRows={permissionRows}
        isTeamsHost={isTeamsHost}
        currentUser={{
          displayName: context.pageContext.user.displayName,
          email: context.pageContext.user.email,
          loginName: context.pageContext.user.loginName
        }}
      >
        <SubscriptionTrialBanner
          isAppAdministrator={isAppAdministrator}
          onOpenSubscriptionSettings={handleOpenSubscriptionSettings}
        />
        {provisioningStatus?.isComplete ? (
          <MailSendPromptBanner status={mailSendStatus} adminUrl={mailSendAdminUrl} />
        ) : null}
        {renderPageContent()}
      </AssetManagementShell>
      <AssetFormPanel
        open={showForm}
        mode={formMode}
        risk={editingAsset}
        riskService={assetService}
        provisioningComplete={provisioningStatus?.isComplete}
        settings={settings}
        categories={categories}
        subCategories={[]}
        businesses={categories}
        projects={projects}
        profiles={assetTypes}
        responses={vendors}
        strategies={locations}
        onSave={() => {
          setShowForm(false);
          void loadData();
        }}
        onCancel={() => setShowForm(false)}
        onEdit={() => setFormMode('edit')}
      />
    </AppearanceThemeProvider>
  );
};
