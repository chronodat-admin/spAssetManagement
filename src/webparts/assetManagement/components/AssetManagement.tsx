import * as React from 'react';
import { DisplayMode } from '@microsoft/sp-core-library';
import { MessageBar, MessageBarBody, Text, Title3 } from '@fluentui/react-components';
import { AppPage, IProvisioningStep, IProvisioningStatus } from '../../../models/IAssetApp';
import { IAppSettings, IAsset, ILookupItem } from '../../../models/IAsset';
import { ASSETS_LIST_TITLE, CATEGORIES_LIST_TITLE } from '../../../models/IListDefinitions';
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
import { removeAppLoadingState } from '../../../utils/loadAssetManagementStyles';
import { resolveAppDisplayName, SUBSCRIPTION_PRODUCT_SLUG } from '../../../constants/spfxComponents';
import {
  createInitialSteps,
  hasCompletedProvisioning,
  IProvisioningScope,
  markProvisioningComplete
} from '../../../utils/onboardingStorage';
import { getPageSubtitle, PAGE_TITLES } from '../../../utils/pageTitles';
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

export const AssetManagement: React.FC<IAssetManagementProps> = ({
  context,
  webUrl,
  siteTitle,
  displayMode,
  isTeamsHost = false,
  subscriptionApiUrl
}) => {
  React.useMemo(() => setUserPhotoBaseUrl(webUrl), [webUrl]);

  const [currentPage, setCurrentPage] = React.useState<AppPage>('dashboard');
  const [portfolioFilters] = React.useState<IDashboardFilters>(() =>
    loadPortfolioFilters(webUrl)
  );
  const [assets, setAssets] = React.useState<IAsset[]>([]);
  const [settings, setSettings] = React.useState<IAppSettings | undefined>();
  const [categories, setCategories] = React.useState<ILookupItem[]>([]);
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

  const refreshProvisioningStatus = React.useCallback(async (): Promise<void> => {
    const status = await provisioningService.getProvisioningStatus();
    setProvisioningStatus(status);
  }, [provisioningService]);

  const loadData = React.useCallback(async (): Promise<void> => {
    if (!setupComplete) return;
    setLoading(true);
    setError('');
    try {
      const [nextSettings, nextCategories, nextProjects, nextAssets] = await Promise.all([
        assetService.getAppSettings().catch(() => undefined),
        assetService.getLookupItems(CATEGORIES_LIST_TITLE).catch(() => [] as ILookupItem[]),
        assetService.getProjectItems().catch(() => [] as ILookupItem[]),
        assetService.getAssets().catch(() => [] as IAsset[])
      ]);
      setSettings(nextSettings);
      setCategories(nextCategories);
      setProjects(nextProjects);
      setAssets(nextAssets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [assetService, setupComplete]);

  React.useEffect(() => {
    void refreshProvisioningStatus();
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

  const handleRunSetup = React.useCallback(async (): Promise<void> => {
    setShowSetupWizard(true);
    setIsProvisioning(true);
    setProvisioningError('');
    setProvisioningSteps(createInitialSteps());
    try {
      const steps = createInitialSteps();
      setProvisioningSteps(steps);
      const result = await provisioningService.provisionAll(setProvisioningSteps, steps);
      if (!result.success) {
        setProvisioningError(result.error || 'Setup failed. Review the steps above and try again.');
        await refreshProvisioningStatus();
        return;
      }
      markProvisioningComplete(provisioningScope);
      await refreshProvisioningStatus();
      setShowSetupWizard(false);
      await loadData();
    } catch (err) {
      setProvisioningError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsProvisioning(false);
    }
  }, [provisioningService, provisioningScope, refreshProvisioningStatus, loadData]);

  const handleCreateAsset = React.useCallback((): void => {
    setEditingAsset(undefined);
    setFormMode('create');
    setShowForm(true);
  }, []);

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
        return assets.filter(
          (a) =>
            a.AM_AssignedTo?.Email === context.pageContext.user.email ||
            a.AM_AssignedTo?.Title === context.pageContext.user.displayName
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
  }, [assets, currentPage, context.pageContext.user]);

  if (displayMode === DisplayMode.Edit) {
    return <EditModePlaceholder isTeamsHost={isTeamsHost} />;
  }

  if (!bootstrapped || subscription.loading) {
    return <AppLoadingSkeleton />;
  }

  const subscriptionBlocked =
    subscription.configured && !subscription.loading && !subscription.hasAccess;

  if (
    subscriptionBlocked &&
    subscription.connectivityError &&
    currentPage !== 'settings'
  ) {
    return (
      <AppearanceThemeProvider webUrl={webUrl} isTeamsHost={isTeamsHost}>
        <SubscriptionConnectivityError
          onOpenSubscriptionSettings={() => setCurrentPage('settings')}
        />
      </AppearanceThemeProvider>
    );
  }

  if (subscriptionBlocked && !subscription.connectivityError && currentPage !== 'settings') {
    return (
      <AppearanceThemeProvider webUrl={webUrl} isTeamsHost={isTeamsHost}>
        <SubscriptionPaywall onOpenSubscriptionSettings={() => setCurrentPage('settings')} />
      </AppearanceThemeProvider>
    );
  }

  if (!setupComplete && !showSetupWizard) {
    return (
      <AppearanceThemeProvider webUrl={webUrl} isTeamsHost={isTeamsHost}>
        <ProvisioningOnboarding
          steps={provisioningSteps}
          isRunning={isProvisioning}
          error={provisioningError}
          isTeamsHost={isTeamsHost}
          mailSendStatus={mailSendStatus}
          mailSendAdminUrl={mailSendAdminUrl}
          onRefreshMailSendStatus={refreshMailSendStatus}
          refreshingMailSendStatus={refreshingMailSendStatus}
          onStart={() => void handleRunSetup()}
        />
      </AppearanceThemeProvider>
    );
  }

  const pageTitle =
    currentPage === 'dashboard'
      ? getDashboardTitle(settings, portfolioFilters, categories, projects)
      : PAGE_TITLES[currentPage];
  const pageSubtitle =
    currentPage === 'dashboard'
      ? getDashboardSubtitle(settings, portfolioFilters, categories, projects)
      : getPageSubtitle(currentPage);

  const renderPageContent = (): React.ReactNode => {
    if (loading && currentPage !== 'settings') {
      return <AppLoadingSkeleton />;
    }

    if (error) {
      return (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
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
      case 'depreciation':
        return <DepreciationPage depreciationService={depreciationService} />;
      case 'auditLog':
        return <AuditLogPage assetService={assetService} />;
      case 'categories':
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
            isAppAdministrator
            isSiteOwner
            categories={categories}
            onSaved={() => void loadData()}
            onRunSetup={() => {
              setShowSetupWizard(true);
              void handleRunSetup();
            }}
            onRefreshSetupStatus={() => void refreshProvisioningStatus()}
            mailSendStatus={mailSendStatus}
            mailSendAdminUrl={mailSendAdminUrl}
            onRefreshMailSendStatus={refreshMailSendStatus}
            refreshingMailSendStatus={refreshingMailSendStatus}
            subscriptionApiConfigured={subscription.configured}
          />
        );
      default:
        if (LIST_PAGES.includes(currentPage)) {
          return (
            <AssetList
              risks={filteredAssets}
              title={PAGE_TITLES[currentPage]}
              subtitle={pageSubtitle}
              listKey={currentPage}
              settings={settings}
              riskService={assetService}
              onView={handleViewAsset}
              onEdit={handleEditAsset}
              canEdit={assetPermissions.canEdit}
              canDelete={assetPermissions.canDelete}
              onRefresh={() => void loadData()}
            />
          );
        }
        return (
          <ContentCard>
            <Title3>{pageTitle}</Title3>
            <Text>{pageSubtitle || `${appName} — this view will be expanded in upcoming tasks.`}</Text>
          </ContentCard>
        );
    }
  };

  return (
    <AppearanceThemeProvider webUrl={webUrl} isTeamsHost={isTeamsHost}>
      <SubscriptionTrialBanner />
      {!setupComplete && provisioningStatus ? (
        <>
          <SetupPromptBanner
            status={provisioningStatus}
            isSiteOwner
            onCompleteSetup={() => setShowSetupWizard(true)}
            onOpenSettings={() => handleNavigate('settings')}
          />
          <MailSendPromptBanner status={mailSendStatus} adminUrl={mailSendAdminUrl} />
        </>
      ) : null}
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
          onStart={() => void handleRunSetup()}
          onClose={() => setShowSetupWizard(false)}
        />
      )}
      <AssetManagementShell
        currentPage={currentPage}
        pageTitle={pageTitle}
        pageSubtitle={pageSubtitle}
        appName={appName}
        onNavigate={handleNavigate}
        onCreateAsset={handleCreateAsset}
        createAssetDisabled={subscriptionBlocked || !assetPermissions.canAdd}
        setupComplete={setupComplete}
        isTeamsHost={isTeamsHost}
        currentUser={{
          displayName: context.pageContext.user.displayName,
          email: context.pageContext.user.email,
          loginName: context.pageContext.user.loginName
        }}
      >
        {renderPageContent()}
      </AssetManagementShell>
      <AssetFormPanel
        open={showForm}
        mode={formMode}
        risk={editingAsset}
        riskService={assetService}
        settings={settings}
        categories={categories}
        subCategories={[]}
        businesses={categories}
        projects={projects}
        profiles={[]}
        responses={[]}
        strategies={[]}
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
