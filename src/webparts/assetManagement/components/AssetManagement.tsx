import * as React from 'react';
import { DisplayMode } from '@microsoft/sp-core-library';
import { Text, Title3 } from '@fluentui/react-components';
import { AppPage } from '../../../models/IAssetApp';
import { AssetManagementShell } from '../../../components/Layout/AssetManagementShell';
import { AppLoadingSkeleton } from '../../../components/Layout/AppLoadingSkeleton';
import { ContentCard } from '../../../components/Layout/ContentCard';
import { EditModePlaceholder } from '../../../components/Onboarding/EditModePlaceholder';
import { SubscriptionPaywall } from '../../../components/Subscription/SubscriptionPaywall';
import { SubscriptionConnectivityError } from '../../../components/Subscription/SubscriptionConnectivityError';
import { SubscriptionTrialBanner } from '../../../components/Subscription/SubscriptionTrialBanner';
import { AppearanceThemeProvider } from '../../../contexts/AppearanceThemeContext';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { removeAppLoadingState } from '../../../utils/loadAssetManagementStyles';
import { resolveAppDisplayName } from '../../../constants/spfxComponents';
import { IAssetManagementProps } from './IAssetManagementProps';

const PAGE_TITLES: Record<AppPage, string> = {
  dashboard: 'Dashboard',
  allAssets: 'All Assets',
  assignedToMe: 'Assigned To Me',
  available: 'Available Assets',
  inRepair: 'In Repair',
  retired: 'Retired Assets',
  deletedAssets: 'Deleted Assets',
  assignAsset: 'Assign Asset',
  bookAsset: 'Book Asset',
  bookingDetails: 'Booking Details',
  software: 'Software Licenses',
  inventory: 'Inventory',
  reports: 'Reports',
  depreciation: 'Depreciation',
  auditLog: 'Audit Log',
  categories: 'Categories',
  vendors: 'Vendors',
  locations: 'Locations',
  projects: 'Projects',
  settings: 'Settings'
};

export const AssetManagement: React.FC<IAssetManagementProps> = ({
  context,
  webUrl,
  siteTitle,
  displayMode,
  isTeamsHost = false
}) => {
  const [currentPage, setCurrentPage] = React.useState<AppPage>('dashboard');
  const [bootstrapped, setBootstrapped] = React.useState(false);
  const subscription = useSubscription();
  const appName = resolveAppDisplayName(siteTitle);
  const user = context.pageContext.user;

  React.useEffect(() => {
    removeAppLoadingState(document.querySelector('.asset-management-webpart-host') as HTMLElement);
    setBootstrapped(true);
  }, []);

  if (displayMode === DisplayMode.Edit) {
    return <EditModePlaceholder isTeamsHost={isTeamsHost} />;
  }

  if (!bootstrapped || subscription.loading) {
    return <AppLoadingSkeleton />;
  }

  const subscriptionBlocked =
    subscription.configured && !subscription.loading && !subscription.hasAccess;
  const pageTitle = PAGE_TITLES[currentPage];

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

  return (
    <AppearanceThemeProvider webUrl={webUrl} isTeamsHost={isTeamsHost}>
      <SubscriptionTrialBanner />
      <AssetManagementShell
        currentPage={currentPage}
        pageTitle={pageTitle}
        pageSubtitle={appName}
        appName={appName}
        onNavigate={setCurrentPage}
        onCreateAsset={() => undefined}
        createAssetDisabled={subscriptionBlocked}
        setupComplete={true}
        isTeamsHost={isTeamsHost}
        currentUser={{
          displayName: user.displayName,
          email: user.email,
          loginName: user.loginName
        }}
      >
        <ContentCard>
          <Title3>{pageTitle}</Title3>
          <Text>
            {appName} — {pageTitle} view will be implemented in the next build tasks.
          </Text>
        </ContentCard>
      </AssetManagementShell>
    </AppearanceThemeProvider>
  );
};
