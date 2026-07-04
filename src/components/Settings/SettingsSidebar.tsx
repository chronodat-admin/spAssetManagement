import * as React from 'react';
import {
  ChevronDownRegular,
  ChevronUpRegular
} from '@fluentui/react-icons';
import { Button, tokens } from '@fluentui/react-components';
import { makeStyles, mergeClasses, shorthands } from '@fluentui/react-components';
import { SETTINGS_PAGES, SettingsPageId } from './settingsPageMeta';
import { isHiddenSettingsPage } from '../../constants/scheduleDependentFeatures';
import { MailSendApprovalPanel } from '../Onboarding/MailSendApprovalPanel';
import type { MailSendApprovalUiStatus } from '../../models/IMailSendApproval';

export type { SettingsPageId } from './settingsPageMeta';
export { SETTINGS_SELF_SAVE_PAGES } from './settingsPageMeta';

const useStyles = makeStyles({
  sidebar: {
    width: '240px',
    flexShrink: 0,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalS,
    alignSelf: 'flex-start',
    position: 'sticky',
    top: tokens.spacingVerticalL
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    ...shorthands.border('none'),
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    '& svg': {
      color: tokens.colorNeutralForeground3,
      flexShrink: 0
    },
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorNeutralForeground1,
      '& svg': {
        color: tokens.colorNeutralForeground2
      }
    }
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    width: '100%',
    justifyContent: 'flex-start',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    marginBottom: '2px'
  },
  navItemActive: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold
  },
  sectionBlock: {
    marginBottom: tokens.spacingVerticalS
  },
  navIcon: {
    fontSize: '16px',
    flexShrink: 0
  }
});

export interface ISettingsSidebarProps {
  activePage: SettingsPageId;
  onSelect: (page: SettingsPageId) => void;
  showCompliance?: boolean;
  graphEmailNotificationsEnabled?: boolean;
  mailSendStatus?: MailSendApprovalUiStatus;
  mailSendAdminUrl?: string;
  onRefreshMailSendStatus?: () => void;
  refreshingMailSendStatus?: boolean;
}

export const SettingsSidebar: React.FC<ISettingsSidebarProps> = ({
  activePage,
  onSelect,
  showCompliance = true,
  graphEmailNotificationsEnabled = true,
  mailSendStatus,
  mailSendAdminUrl,
  onRefreshMailSendStatus,
  refreshingMailSendStatus
}) => {
  const styles = useStyles();
  const [expanded, setExpanded] = React.useState({ general: true, preferences: true, lookups: true });

  const visibleItems = SETTINGS_PAGES.filter(
    (item) =>
      !isHiddenSettingsPage(item.id) &&
      (item.id !== 'compliance' || showCompliance)
  );

  const sections = [
    { key: 'general' as const, label: 'General' },
    { key: 'preferences' as const, label: 'Preferences' },
    { key: 'lookups' as const, label: 'Lookups' }
  ];

  return (
    <aside className={styles.sidebar}>
      {sections.map((section) => {
        const items = visibleItems.filter((item) => item.section === section.key);
        const isExpanded = expanded[section.key];
        return (
          <div key={section.key} className={styles.sectionBlock}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setExpanded((prev) => ({ ...prev, [section.key]: !prev[section.key] }))}
              aria-expanded={isExpanded}
            >
              <span>{section.label}</span>
              {isExpanded ? <ChevronUpRegular /> : <ChevronDownRegular />}
            </button>
            {isExpanded &&
              items.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;
                return (
                  <Button
                    key={item.id}
                    appearance="subtle"
                    className={mergeClasses(styles.navItem, active && styles.navItemActive)}
                    icon={<Icon className={styles.navIcon} />}
                    onClick={() => onSelect(item.id)}
                  >
                    {item.label}
                  </Button>
                );
              })}
          </div>
        );
      })}
      {graphEmailNotificationsEnabled && mailSendStatus && mailSendAdminUrl ? (
        <div style={{ padding: tokens.spacingHorizontalM, paddingTop: tokens.spacingVerticalS }}>
          <MailSendApprovalPanel
            status={mailSendStatus}
            adminUrl={mailSendAdminUrl}
            variant="compact"
            onRefresh={onRefreshMailSendStatus}
            refreshing={refreshingMailSendStatus}
          />
        </div>
      ) : null}
    </aside>
  );
};
