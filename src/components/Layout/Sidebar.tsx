import * as React from 'react';

import { makeStyles, mergeClasses, tokens, Text, Caption1, Button, ToolbarButton } from '@fluentui/react-components';

import {
  ArrowSyncRegular,
  BoxRegular,
  BuildingRegular,
  CameraRegular,
  DismissRegular,
  GridRegular,
  HistoryRegular,
  ListRegular,
  LocationRegular,
  NavigationRegular,
  PersonRegular,
  SettingsRegular,
  ShoppingBagRegular,
  TableRegular,
  TagRegular,
  TagMultipleRegular,
  ToolboxRegular,
  WrenchRegular
} from '@fluentui/react-icons';

import { AppPage } from '../../models/IAssetApp';
import { DEFAULT_NAVIGATION_ARIA_LABEL } from '../../constants/spfxComponents';
import { useTranslation } from '../../i18n/LocaleContext';
import type { IAppPermissions } from '../../utils/rbac';
import { canAccessPage } from '../../utils/rbac';
import type { IRolePermissionRow } from '../../lib/permissions/checkRolePermission';



export interface INavigationItem {

  id: AppPage;

  label: string;

  icon: React.ReactElement;

  section?: string;

}



export const NAVIGATION_ITEMS: INavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <GridRegular />, section: 'MAIN' },
  { id: 'allAssets', label: 'All Assets', icon: <ListRegular />, section: 'ASSETS' },
  { id: 'assignedToMe', label: 'Assigned To Me', icon: <PersonRegular />, section: 'ASSETS' },
  { id: 'available', label: 'Available', icon: <BoxRegular />, section: 'ASSETS' },
  { id: 'inRepair', label: 'In Repair', icon: <WrenchRegular />, section: 'ASSETS' },
  { id: 'retired', label: 'Retired', icon: <ToolboxRegular />, section: 'ASSETS' },
  { id: 'deletedAssets', label: 'Deleted Assets', icon: <HistoryRegular />, section: 'ASSETS' },
  { id: 'assignAsset', label: 'Assign Asset', icon: <PersonRegular />, section: 'OPERATIONS' },
  { id: 'bulkAssign', label: 'Bulk Assign', icon: <PersonRegular />, section: 'OPERATIONS' },
  { id: 'returnAsset', label: 'Return Asset', icon: <ArrowSyncRegular />, section: 'OPERATIONS' },
  { id: 'bulkReturn', label: 'Bulk Return', icon: <ArrowSyncRegular />, section: 'OPERATIONS' },
  { id: 'bookAsset', label: 'Book Asset', icon: <ShoppingBagRegular />, section: 'OPERATIONS' },
  { id: 'bookingDetails', label: 'Booking Details', icon: <TableRegular />, section: 'OPERATIONS' },
  { id: 'requestAsset', label: 'Request Asset', icon: <ShoppingBagRegular />, section: 'OPERATIONS' },
  { id: 'myRequests', label: 'My Requests', icon: <HistoryRegular />, section: 'OPERATIONS' },
  { id: 'manageRequests', label: 'Manage Requests', icon: <TableRegular />, section: 'OPERATIONS' },
  { id: 'scanAsset', label: 'Scan Asset', icon: <CameraRegular />, section: 'OPERATIONS' },
  { id: 'software', label: 'Software Licenses', icon: <TagRegular />, section: 'OPERATIONS' },
  { id: 'inventory', label: 'Inventory', icon: <ListRegular />, section: 'OPERATIONS' },
  { id: 'maintenance', label: 'Maintenance', icon: <WrenchRegular />, section: 'OPERATIONS' },
  { id: 'reports', label: 'Reports', icon: <TableRegular />, section: 'ANALYSIS' },
  { id: 'depreciation', label: 'Depreciation', icon: <GridRegular />, section: 'ANALYSIS' },
  { id: 'auditLog', label: 'Audit Log', icon: <HistoryRegular />, section: 'ANALYSIS' },
  { id: 'categories', label: 'Categories', icon: <TagRegular />, section: 'LOOKUPS' },
  { id: 'subCategories', label: 'Sub-Categories', icon: <TagMultipleRegular />, section: 'LOOKUPS' },
  { id: 'vendors', label: 'Vendors', icon: <BuildingRegular />, section: 'LOOKUPS' },
  { id: 'locations', label: 'Locations', icon: <LocationRegular />, section: 'LOOKUPS' },
  { id: 'projects', label: 'Projects', icon: <BuildingRegular />, section: 'LOOKUPS' },
  { id: 'settings', label: 'Settings', icon: <SettingsRegular />, section: 'ADMIN' }
];



const useStyles = makeStyles({

  root: {

    width: '240px',

    flex: '1 1 auto',

    flexShrink: 0,

    alignSelf: 'stretch',

    minHeight: '100%',

    height: '100%',

    display: 'flex',

    flexDirection: 'column',

    backgroundColor: 'var(--asset-sidebar-bg)',

    color: 'var(--asset-sidebar-text)',

    borderRight: '1px solid var(--asset-sidebar-border)',

    overflowY: 'auto',

    overflowX: 'hidden',

    WebkitOverflowScrolling: 'touch',

    scrollbarWidth: 'none',

    msOverflowStyle: 'none',

    '::-webkit-scrollbar': {
      display: 'none'
    }

  },

  rootCollapsed: {

    width: '52px'

  },

  rootMobile: {

    position: 'fixed',

    top: 0,

    left: 0,

    bottom: 0,

    zIndex: 1001,

    width: 'min(280px, 88vw)',

    maxWidth: '100%',

    transform: 'translateX(-105%)',

    transition: 'transform 0.2s ease',

    boxShadow: tokens.shadow28

  },

  rootMobileOpen: {

    transform: 'translateX(0)'

  },

  rootMobileClosed: {

    pointerEvents: 'none'

  },

  mobileHeader: {

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'space-between',

    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,

    borderBottom: '1px solid var(--asset-sidebar-border)'

  },

  collapsedToggle: {

    display: 'flex',

    justifyContent: 'center',

    padding: tokens.spacingVerticalS

  },

  sectionHeader: {

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'space-between',

    gap: tokens.spacingHorizontalXS,

    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM} ${tokens.spacingVerticalXXS}`

  },

  nav: {

    display: 'flex',

    flexDirection: 'column',

    flex: '1 1 auto',

    padding: tokens.spacingVerticalS,

    gap: tokens.spacingVerticalXXS

  },

  sectionLabel: {

    color: 'var(--asset-sidebar-muted-text)',

    textTransform: 'uppercase',

    letterSpacing: '0.04em'

  },

  navButton: {

    display: 'flex',

    alignItems: 'center',

    gap: tokens.spacingHorizontalS,

    width: '100%',

    border: 'none',

    background: 'transparent',

    color: 'inherit',

    cursor: 'pointer',

    textAlign: 'left',

    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,

    borderRadius: tokens.borderRadiusMedium,

    fontFamily: tokens.fontFamilyBase,

    fontSize: tokens.fontSizeBase300,

    lineHeight: tokens.lineHeightBase300,

    minHeight: 'var(--asset-compact-control-height, 40px)',

    ':hover': {

      backgroundColor: 'var(--asset-sidebar-hover-bg)'

    }

  },

  navButtonSelected: {

    backgroundColor: 'var(--asset-sidebar-selected-bg)',

    color: 'var(--asset-sidebar-selected-text)',

    fontWeight: tokens.fontWeightSemibold,

    ':hover': {

      backgroundColor: 'var(--asset-sidebar-selected-hover-bg)'

    }

  },

  navIcon: {

    display: 'flex',

    flexShrink: 0,

    fontSize: '18px'

  },

  navLabel: {

    overflow: 'hidden',

    textOverflow: 'ellipsis',

    whiteSpace: 'nowrap'

  }

});



export interface ISidebarProps {

  currentPage: AppPage;

  collapsed?: boolean;

  mobile?: boolean;

  mobileOpen?: boolean;

  onNavigate: (page: AppPage) => void;

  onClose?: () => void;

  onToggleCollapse?: () => void;

  showSettings?: boolean;

  permissions?: IAppPermissions;

  permissionRows?: IRolePermissionRow[];

  /** When false, the full navigation is hidden and only a "Complete Setup" action is shown. */
  setupComplete?: boolean;

  /** Opens the provisioning/setup wizard. Used by the setup-only navigation state. */
  onRunSetup?: () => void;

}



export const Sidebar: React.FC<ISidebarProps> = ({

  currentPage,

  collapsed,

  mobile,

  mobileOpen,

  onNavigate,

  onClose,

  onToggleCollapse,

  showSettings = true,

  permissions,

  permissionRows,

  setupComplete = true,

  onRunSetup

}) => {

  const styles = useStyles();
  const { t } = useTranslation();

  const navigationItems = React.useMemo(() => {
    let items = showSettings ? NAVIGATION_ITEMS : NAVIGATION_ITEMS.filter((item) => item.id !== 'settings');
    if (permissions) {
      items = items.filter((item) => canAccessPage(item.id, permissions, permissionRows));
    }
    return items.map((item) => ({
      ...item,
      label: t('nav', item.id, item.label),
      section: item.section ? t('nav', `section${item.section}`, item.section) : item.section
    }));
  }, [permissions, permissionRows, showSettings, t]);

  const sections = navigationItems.reduce<Record<string, INavigationItem[]>>((acc, item) => {

    const section = item.section || 'OTHER';

    if (!acc[section]) {

      acc[section] = [];

    }

    acc[section].push(item);

    return acc;

  }, {});



  const showLabels = mobile || !collapsed;



  return (

    <aside

      className={mergeClasses(

        styles.root,

        mobile && styles.rootMobile,

        mobile && mobileOpen && styles.rootMobileOpen,

        mobile && !mobileOpen && styles.rootMobileClosed,

        !mobile && collapsed && styles.rootCollapsed

      )}

      aria-label={DEFAULT_NAVIGATION_ARIA_LABEL}

      aria-hidden={mobile ? !mobileOpen : undefined}

    >

      {mobile && (

        <div className={styles.mobileHeader}>

          <Text weight="semibold">Menu</Text>

          <Button

            appearance="subtle"

            icon={<DismissRegular />}

            aria-label="Close navigation"

            onClick={onClose}

          />

        </div>

      )}

      {!mobile && collapsed && onToggleCollapse && (
        <div className={styles.collapsedToggle}>
          <ToolbarButton
            aria-label="Expand navigation"
            icon={<NavigationRegular />}
            onClick={onToggleCollapse}
          />
        </div>
      )}

      <nav className={styles.nav}>

        {!setupComplete ? (

          <React.Fragment>

            {showLabels && (
              <div className={styles.sectionHeader}>
                <Caption1 className={styles.sectionLabel}>SETUP</Caption1>
                {!mobile && onToggleCollapse && (
                  <ToolbarButton
                    aria-label="Collapse navigation"
                    icon={<NavigationRegular />}
                    onClick={onToggleCollapse}
                  />
                )}
              </div>
            )}

            <button
              type="button"
              className={mergeClasses(styles.navButton, styles.navButtonSelected)}
              aria-current="page"
              title={!showLabels ? 'Complete Setup' : undefined}
              onClick={() => onRunSetup?.()}
            >
              <span className={styles.navIcon}><SettingsRegular /></span>
              {showLabels && <span className={styles.navLabel}>Complete Setup</span>}
            </button>

          </React.Fragment>

        ) : (

          Object.keys(sections).map((section, sectionIndex) => (

          <React.Fragment key={section}>

            {showLabels && (
              <div className={styles.sectionHeader}>
                <Caption1 className={styles.sectionLabel}>{section}</Caption1>
                {!mobile && sectionIndex === 0 && onToggleCollapse && (
                  <ToolbarButton
                    aria-label="Collapse navigation"
                    icon={<NavigationRegular />}
                    onClick={onToggleCollapse}
                  />
                )}
              </div>
            )}

            {sections[section].map((item) => {

              const selected = currentPage === item.id;

              return (

                <button

                  key={item.id}

                  type="button"

                  className={mergeClasses(styles.navButton, selected && styles.navButtonSelected)}

                  aria-current={selected ? 'page' : undefined}

                  title={!showLabels ? item.label : undefined}

                  onClick={() => onNavigate(item.id)}

                >

                  <span className={styles.navIcon}>{item.icon}</span>

                  {showLabels && <span className={styles.navLabel}>{item.label}</span>}

                </button>

              );

            })}

          </React.Fragment>

          ))

        )}

      </nav>

    </aside>

  );

};

