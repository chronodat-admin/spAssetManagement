import * as React from 'react';

import {

  Breadcrumb,

  BreadcrumbButton,

  BreadcrumbItem,

  Button,

  Caption1,

  makeStyles,

  mergeClasses,

  Text,

  Title3,

  ToolbarButton,

  tokens

} from '@fluentui/react-components';

import { AddRegular, ArrowUpRegular, DocumentRegular, HomeRegular, NavigationRegular, BoxMultipleRegular } from '@fluentui/react-icons';

import { AppPage } from '../../models/IAssetApp';

import { getAppVersionLabel } from '../../utils/appVersion';
import { scrollAppContentToTop } from '../../utils/scrollAppContentToTop';

import { useIsMobile } from '../../utils/useMediaQuery';

import { AccentBarButton } from './AccentBarButton';
import { ThemeModeToggle } from './ThemeModeToggle';

import { Sidebar, NAVIGATION_ITEMS } from './Sidebar';
import type { IAppPermissions } from '../../utils/rbac';
import type { IRolePermissionRow } from '../../lib/permissions/checkRolePermission';
import { AppUserPill } from './AppUserPill';
import { useAppearanceTheme } from '../../contexts/AppearanceThemeContext';
import { isContentActionsLayoutEnabled } from '../../utils/contentActionsLayout';
import { APP_COPYRIGHT_HOLDER, DEFAULT_APP_TITLE } from '../../constants/spfxComponents';



const useStyles = makeStyles({

  shellOuter: {

    display: 'flex',

    flexDirection: 'column',

    width: '100%',

    maxWidth: '100%',

    height: 'var(--asset-mgmt-available-height, 100vh)',

    maxHeight: 'var(--asset-mgmt-available-height, 100vh)',

    minHeight: 'var(--asset-mgmt-available-height, 100vh)',

    overflow: 'hidden',

    backgroundColor: tokens.colorNeutralBackground1,

    color: tokens.colorNeutralForeground1,

    fontFamily: tokens.fontFamilyBase,

    position: 'relative',

    boxSizing: 'border-box',

    '& .fui-MessageBar': {
      width: '100%',
      minWidth: 0,
      maxWidth: '100%',
      boxSizing: 'border-box'
    },

    '& .fui-MessageBarBody': {
      wordBreak: 'break-word',
      overflowWrap: 'anywhere',
      whiteSpace: 'pre-wrap',
      minWidth: 0,
      maxWidth: '100%'
    }

  },

  shell: {

    display: 'flex',

    flexDirection: 'row',

    alignItems: 'stretch',

    width: '100%',

    maxWidth: '100%',

    flex: '1 1 auto',

    minWidth: 0,

    minHeight: 0,

    overflow: 'hidden',

    position: 'relative'

  },

  sidebarWrap: {

    display: 'flex',

    flexDirection: 'column',

    alignSelf: 'stretch',

    flexShrink: 0,

    minHeight: '100%',

    backgroundColor: 'var(--asset-sidebar-bg)'

  },

  sidebarWrapMobile: {

    width: 0,

    minWidth: 0,

    flexShrink: 0,

    overflow: 'visible'

  },

  backdrop: {

    position: 'fixed',

    inset: 0,

    backgroundColor: 'rgba(0, 0, 0, 0.45)',

    zIndex: 1000

  },

  main: {

    display: 'flex',

    flexDirection: 'column',

    flex: '1 1 auto',

    alignSelf: 'stretch',

    minWidth: 0,

    minHeight: 0,

    width: '100%',

    overflow: 'hidden'

  },

  pageHeader: {

    flexShrink: 0,

    zIndex: 50,

    display: 'flex',

    flexDirection: 'column',

    gap: 0,

    padding: 0,

    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,

    backgroundColor: tokens.colorNeutralBackground1,

    boxShadow: tokens.shadow4

  },

  topAccentBar: {

    width: '100%',

    flexShrink: 0,

    minHeight: 'var(--asset-compact-bar-height, 40px)',

    background: 'var(--asset-topnav-bg)',

    borderBottom: '1px solid var(--asset-topnav-border)',

    boxSizing: 'border-box',

    zIndex: 60

  },

  topAccentBarInner: {

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'space-between',

    gap: tokens.spacingHorizontalM,

    flexWrap: 'wrap',

    minHeight: 'var(--asset-compact-bar-height, 40px)',

    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalL}`,

    boxSizing: 'border-box',

    '@media (max-width: 768px)': {

      padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,

      gap: tokens.spacingHorizontalS

    }

  },

  topAccentBarBrand: {

    display: 'flex',

    alignItems: 'center',

    gap: tokens.spacingHorizontalS,

    minWidth: 0,

    flex: '1 1 auto'

  },

  topAccentBarBrandIcon: {

    display: 'inline-flex',

    alignItems: 'center',

    justifyContent: 'center',

    flexShrink: 0,

    fontSize: '20px',

    color: 'var(--asset-topnav-text)' },

  topAccentBarBrandName: {

    fontSize: tokens.fontSizeBase400,

    fontWeight: tokens.fontWeightSemibold,

    color: 'var(--asset-topnav-text)',

    overflow: 'hidden',

    textOverflow: 'ellipsis',

    whiteSpace: 'nowrap'

  },

  topAccentBarActions: {

    display: 'flex',

    alignItems: 'center',

    flexWrap: 'wrap',

    justifyContent: 'flex-end',

    gap: tokens.spacingHorizontalS,

    flexShrink: 0,

    maxWidth: '100%'

  },

  contentActionBar: {

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'flex-end',

    flexWrap: 'wrap',

    gap: tokens.spacingHorizontalS,

    flex: '0 1 auto',

    minWidth: 0,

    marginLeft: 'auto',

    color: tokens.colorNeutralForeground1,

    ['--asset-topnav-text' as string]: tokens.colorNeutralForeground1,

    ['--asset-topnav-border' as string]: tokens.colorNeutralStroke1,

    '@media (max-width: 768px)': {

      width: '100%',

      marginLeft: 0

    }

  },

  pageTitleSection: {

    display: 'flex',

    flexDirection: 'column',

    gap: tokens.spacingVerticalS,

    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL} ${tokens.spacingVerticalS}`,

    '@media (max-width: 768px)': {

      padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`

    }

  },

  pageTitleRow: {

    display: 'flex',

    flexWrap: 'wrap',

    alignItems: 'flex-start',

    gap: tokens.spacingHorizontalM,

    width: '100%'

  },

  pageTitleBlock: {

    flex: '1 1 auto',

    minWidth: 0

  },

  pageTitleHeading: {

    display: 'flex',

    alignItems: 'center',

    gap: tokens.spacingHorizontalS,

    minWidth: 0

  },

  pageTitleIcon: {

    display: 'inline-flex',

    alignItems: 'center',

    justifyContent: 'center',

    flexShrink: 0,

    fontSize: '28px',

    color: tokens.colorBrandForeground1,

    '@media (max-width: 768px)': {

      fontSize: '22px'

    }

  },

  pageTitle: {

    fontSize: tokens.fontSizeHero700,

    fontWeight: tokens.fontWeightSemibold,

    lineHeight: 1.2,

    margin: 0,

    '@media (max-width: 768px)': {

      fontSize: tokens.fontSizeBase500

    }

  },

  pageSubtitle: {

    display: 'block',

    marginTop: tokens.spacingVerticalXXS,

    color: tokens.colorNeutralForeground3,

    maxWidth: '720px',

    lineHeight: 1.45

  },

  content: {

    flex: '1 1 auto',

    minHeight: 0,

    overflowY: 'auto',

    overflowX: 'hidden',

    width: '100%',

    boxSizing: 'border-box',

    display: 'flex',

    flexDirection: 'column',

    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL} 0`,

    backgroundColor: tokens.colorNeutralBackground2,

    WebkitOverflowScrolling: 'touch',

    '@media (max-width: 768px)': {

      padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM} 0`

    }

  },

  pageBody: {

    flex: '1 0 auto',

    width: '100%',

    minWidth: 0

  },

  footer: {

    display: 'flex',

    flexWrap: 'wrap',

    flexShrink: 0,

    alignItems: 'center',

    gap: tokens.spacingHorizontalM,

    width: '100%',

    marginTop: tokens.spacingVerticalL,

    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL} ${tokens.spacingVerticalL}`,

    backgroundColor: tokens.colorNeutralBackground2,

    color: tokens.colorNeutralForeground3,

    fontSize: tokens.fontSizeBase200,

    boxSizing: 'border-box',

    '@media (max-width: 768px)': {

      padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM} ${tokens.spacingVerticalL}`,

      flexDirection: 'column',

      alignItems: 'flex-start'

    }

  },

  footerMeta: {

    display: 'flex',

    flexWrap: 'wrap',

    alignItems: 'center',

    gap: tokens.spacingHorizontalS,

    flex: '1 1 auto',

    minWidth: 0

  },

  footerBackToTop: {

    flexShrink: 0,

    width: 'fit-content',

    marginLeft: 'auto',

    '@media (max-width: 768px)': {

      marginLeft: 0

    }

  },

  breadcrumb: {

    maxWidth: '100%',

    overflowX: 'auto',

    WebkitOverflowScrolling: 'touch'

  },

  createLabel: {

    '@media (max-width: 640px)': {

      display: 'none'

    }

  },

  procedureLabel: {

    '@media (max-width: 640px)': {

      display: 'none'

    }

  }

});



export interface IAssetManagementShellProps {

  currentPage: AppPage;

  pageTitle: string;

  pageSubtitle?: string;

  /** App display name from Settings → General (App display name). */
  appName?: string;

  /** Valid http(s) URL to an asset management procedure document. */
  assetProcedureUrl?: string;

  onNavigate: (page: AppPage) => void;

  onCreateAsset: () => void;

  createAssetDisabled?: boolean;

  /** When set, replaces the default Create New Asset accent bar action. */
  headerPrimaryAction?: {
    label: string;
    ariaLabel: string;
    onClick: () => void;
    disabled?: boolean;
  };

  showSettings?: boolean;

  permissions?: IAppPermissions;

  permissionRows?: IRolePermissionRow[];

  /** When false, the sidebar hides all navigation and shows only a "Complete Setup" action. */
  setupComplete?: boolean;

  /** Opens the provisioning/setup wizard from the setup-only navigation state. */
  onRunSetup?: () => void;

  headerActions?: React.ReactNode;

  /** Signed-in user shown in the app header when SharePoint top toolbar is hidden. */
  currentUser?: {
    displayName: string;
    email?: string;
    loginName?: string;
  };

  profileUrl?: string;

  /** True when hosted in Microsoft Teams. Forces the compact content-header action layout. */
  isTeamsHost?: boolean;

  children: React.ReactNode;

}



export const AssetManagementShell: React.FC<IAssetManagementShellProps> = ({

  currentPage,

  pageTitle,

  pageSubtitle,

  appName,

  assetProcedureUrl,

  onNavigate,

  onCreateAsset,

  createAssetDisabled,

  headerPrimaryAction,

  showSettings = true,

  permissions,

  permissionRows,

  setupComplete = true,

  onRunSetup,

  headerActions,

  currentUser,

  profileUrl,

  isTeamsHost = false,

  children
}) => {
  const styles = useStyles();
  const { appearance } = useAppearanceTheme();
  const contentActionsLayout = isContentActionsLayoutEnabled(appearance, isTeamsHost);
  const showUserPill =
    (appearance.hideSharePointTopBar || contentActionsLayout) && !!currentUser?.displayName?.trim();

  const pageIcon = NAVIGATION_ITEMS.find((item) => item.id === currentPage)?.icon;
  const accentPrimaryAction = headerPrimaryAction ?? {
    label: 'New Asset',
    ariaLabel: 'Create new asset',
    onClick: onCreateAsset,
    disabled: createAssetDisabled
  };

  const isMobile = useIsMobile();

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const contentRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {

    contentRef.current?.scrollTo({ top: 0, behavior: 'auto' });

  }, [currentPage]);



  React.useEffect(() => {

    if (!isMobile) {

      setMobileNavOpen(false);

    }

  }, [isMobile]);



  React.useEffect(() => {

    const scrollRoot = contentRef.current;

    if (!isMobile || !mobileNavOpen || !scrollRoot) {

      return undefined;

    }

    const previousOverflow = scrollRoot.style.overflow;

    scrollRoot.style.overflow = 'hidden';

    return () => {

      scrollRoot.style.overflow = previousOverflow;

    };

  }, [isMobile, mobileNavOpen]);



  const handleToggleSidebar = (): void => {

    if (isMobile) {

      setMobileNavOpen((prev) => !prev);

      return;

    }

    setSidebarCollapsed((prev) => !prev);

  };



  const handleNavigate = (page: AppPage): void => {

    onNavigate(page);

    contentRef.current?.scrollTo({ top: 0, behavior: 'auto' });

    if (isMobile) {

      setMobileNavOpen(false);

    }

  };



  const handleCloseMobileNav = (): void => {

    setMobileNavOpen(false);

  };

  const shellActions = (
    <>
      {assetProcedureUrl && (
        <AccentBarButton
          variant="ghost"
          icon={<DocumentRegular />}
          as="a"
          href={assetProcedureUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${DEFAULT_APP_TITLE} procedure document`}
        >
          <span className={styles.procedureLabel}>Procedure</span>
        </AccentBarButton>
      )}
      <ThemeModeToggle compact={isMobile} />
      {headerActions}
      <AccentBarButton
        variant="solid"
        icon={<AddRegular />}
        onClick={accentPrimaryAction.onClick}
        disabled={accentPrimaryAction.disabled}
        aria-label={accentPrimaryAction.ariaLabel}
        size={isMobile ? 'small' : 'medium'}
      >
        <span className={styles.createLabel}>{accentPrimaryAction.label}</span>
      </AccentBarButton>
      {showUserPill ? (
        <AppUserPill
          displayName={currentUser!.displayName}
          email={currentUser!.email}
          loginName={currentUser!.loginName}
          profileUrl={profileUrl}
        />
      ) : null}
    </>
  );



  return (

    <div className={styles.shellOuter}>

      {!contentActionsLayout ? (
      <div className={mergeClasses(styles.topAccentBar, 'asset-mgmt-no-print')}>
        <div className={styles.topAccentBarInner}>
          {appName && (
            <div className={styles.topAccentBarBrand} title={appName}>
              <BoxMultipleRegular className={styles.topAccentBarBrandIcon} aria-hidden />
              <Text as="span" className={styles.topAccentBarBrandName}>
                {appName}
              </Text>
            </div>
          )}
          <div className={styles.topAccentBarActions}>
            {shellActions}
          </div>
        </div>
      </div>
      ) : null}

      <div className={styles.shell}>

      {isMobile && mobileNavOpen && (

        <button

          type="button"

          className={styles.backdrop}

          aria-label="Close navigation"

          onClick={handleCloseMobileNav}

        />

      )}

      <div className={mergeClasses(styles.sidebarWrap, isMobile && styles.sidebarWrapMobile, 'asset-mgmt-no-print')}>
      <Sidebar

        currentPage={currentPage}

        collapsed={!isMobile && sidebarCollapsed}

        mobile={isMobile}

        mobileOpen={mobileNavOpen}

        onNavigate={handleNavigate}

        onClose={handleCloseMobileNav}

        onToggleCollapse={handleToggleSidebar}

        showSettings={showSettings}

        permissions={permissions}

        permissionRows={permissionRows}

        setupComplete={setupComplete}

        onRunSetup={onRunSetup}

      />
      </div>

      <div className={styles.main}>

        <div className={mergeClasses(styles.pageHeader, 'asset-mgmt-no-print')}>
          <div className={styles.pageTitleSection}>
            <div className={styles.pageTitleRow}>
              {isMobile && (
                <ToolbarButton
                  aria-label="Open navigation"
                  icon={<NavigationRegular />}
                  onClick={handleToggleSidebar}
                />
              )}
              <div className={styles.pageTitleBlock}>
                <div className={styles.pageTitleHeading}>
                  {pageIcon && <span className={styles.pageTitleIcon}>{pageIcon}</span>}
                  <Title3 as="h1" className={styles.pageTitle}>
                    {pageTitle}
                  </Title3>
                </div>
                {pageSubtitle && <Caption1 className={styles.pageSubtitle}>{pageSubtitle}</Caption1>}
              </div>
              {contentActionsLayout ? (
                <div className={mergeClasses(styles.contentActionBar, 'asset-mgmt-no-print')}>
                  {shellActions}
                </div>
              ) : null}
            </div>

            {currentPage !== 'dashboard' && (
              <Breadcrumb aria-label="Breadcrumb" className={styles.breadcrumb}>
                <BreadcrumbItem>
                  <BreadcrumbButton icon={<HomeRegular />} onClick={() => handleNavigate('dashboard')}>
                    Home
                  </BreadcrumbButton>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbButton current>{pageTitle}</BreadcrumbButton>
                </BreadcrumbItem>
              </Breadcrumb>
            )}
          </div>
        </div>

        <main ref={contentRef} className={styles.content} data-asset-mgmt-scroll-root>
          <div className={styles.pageBody}>{children}</div>

          <footer className={mergeClasses(styles.footer, 'asset-mgmt-no-print')}>
            <div className={styles.footerMeta}>
              <Text size={200}>
                <strong>{APP_COPYRIGHT_HOLDER}</strong> &copy; {new Date().getFullYear()}
              </Text>
              <Caption1>{getAppVersionLabel()}</Caption1>
            </div>

            <Button
              className={styles.footerBackToTop}
              appearance="subtle"
              size="small"
              icon={<ArrowUpRegular />}
              onClick={() => scrollAppContentToTop('smooth')}
            >
              Back to top
            </Button>
          </footer>
        </main>

      </div>

    </div>

    </div>

  );

};

