import * as React from 'react';
import {
  Field,
  Option,
  Switch,
  Text,
  makeStyles,
  mergeClasses,
  tokens
} from '@fluentui/react-components';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { IAppearanceSettings } from '../../models/IAppearanceSettings';
import { COLOR_SCHEME_OPTIONS } from '../../utils/dashboardSettings';
import { COLOR_SCHEME_SWATCHES, getColorSchemeSwatch } from '../../utils/appearanceTheme';
import { DEFAULT_APPEARANCE_SETTINGS } from '../../models/IAppearanceSettings';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { isTeamsHostEnvironment, syncSharePointLeftNavVisibility, syncSharePointPageBarVisibility, syncSharePointTopBarVisibility } from '../../utils/loadAssetManagementStyles';

const THEME_MODE_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System default' }
] as const;

const useStyles = makeStyles({
  sectionTitle: {
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalXS,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  sectionHint: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    marginBottom: tokens.spacingVerticalS
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: tokens.spacingHorizontalS
  },
  colorSwatch: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalS,
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    backgroundColor: tokens.colorNeutralBackground1
  },
  colorSwatchActive: {
    border: `2px solid ${tokens.colorBrandStroke1}`,
    boxShadow: tokens.shadow4
  },
  colorBar: {
    width: '100%',
    height: '32px',
    borderRadius: tokens.borderRadiusSmall
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
  customColorRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalS
  },
  colorFieldRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalM
  },
  customColorBar: {
    backgroundImage:
      'linear-gradient(45deg, #d4d4d4 25%, transparent 25%), linear-gradient(-45deg, #d4d4d4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d4 75%), linear-gradient(-45deg, transparent 75%, #d4d4d4 75%)',
    backgroundSize: '12px 12px',
    backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingVerticalXXS
  },
  colorInput: {
    width: '100%',
    minHeight: '36px',
    padding: tokens.spacingVerticalXS,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer'
  },
  previewBar: {
    marginTop: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM
  },
  previewSidebar: {
    marginTop: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'grid',
    gap: tokens.spacingVerticalXS
  },
  previewNavItem: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase300
  },
  previewNavItemActive: {
    fontWeight: tokens.fontWeightSemibold
  },
  previewCtaButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    lineHeight: 1.2,
    border: '1px solid transparent',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.28)',
    flexShrink: 0
  },
  resetLink: {
    marginTop: tokens.spacingVerticalS,
    color: tokens.colorBrandForeground1,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    padding: 0,
    font: 'inherit',
    fontSize: tokens.fontSizeBase200,
    textDecoration: 'underline'
  }
});

const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' }
] as const;

export interface IAppearanceSettingsTabProps {
  value: IAppearanceSettings;
  onChange: (next: IAppearanceSettings) => void;
}

export const AppearanceSettingsTab: React.FC<IAppearanceSettingsTabProps> = ({ value, onChange }) => {
  const styles = useStyles();

  const update = (patch: Partial<IAppearanceSettings>): void => {
    const next = { ...value, ...patch };
    onChange(next);
    if (patch.hideSharePointPageBar !== undefined && !isTeamsHostEnvironment()) {
      syncSharePointPageBarVisibility(next.hideSharePointPageBar);
    }
    if (patch.hideSharePointTopBar !== undefined && !isTeamsHostEnvironment()) {
      syncSharePointTopBarVisibility(next.hideSharePointTopBar);
    }
    if (patch.hideSharePointLeftNav !== undefined && !isTeamsHostEnvironment()) {
      syncSharePointLeftNavVisibility(next.hideSharePointLeftNav);
    }
  };

  const topNavPreviewStyle: React.CSSProperties = {
    background: value.enableTopNavColor ? value.topBarColor : getColorSchemeSwatch(value),
    color: value.enableTopNavColor ? value.topNavFontColor : '#ffffff'
  };

  const topNavCtaPreviewStyle: React.CSSProperties = {
    backgroundColor: value.topNavCtaBackground,
    color: value.topNavCtaText,
    borderColor: value.topNavCtaBorder
  };

  const getSwatchBackground = (color: (typeof COLOR_SCHEME_OPTIONS)[number]): string => {
    if (color === 'Custom') {
      return getColorSchemeSwatch({ colorScheme: 'Custom', customBrandColor: value.customBrandColor });
    }
    return COLOR_SCHEME_SWATCHES[color];
  };

  const sidebarPreviewStyle: React.CSSProperties = value.enableSidebarColor
    ? {
        backgroundColor: value.sidebarColor,
        color: value.sidebarFontColor
      }
    : {
        backgroundColor: tokens.colorNeutralBackground2,
        color: tokens.colorNeutralForeground1
      };

  const activeNavStyle: React.CSSProperties = value.enableSidebarColor
    ? {
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        color: value.sidebarFontColor
      }
    : {
        backgroundColor: tokens.colorBrandBackground2,
        color: tokens.colorBrandForeground1
      };

  return (
    <>
      <div className={styles.sectionTitle}>Theme mode</div>
      <Text className={styles.sectionHint}>
        Default appearance for all users. Each person can override light or dark from the top bar toggle; that choice is saved on their device.
      </Text>
      <Field label="Default theme">
        <AppDropdown
          value={value.themeMode}
          selectedOptions={[value.themeMode]}
          onOptionSelect={(_, data) => {
            const next = data.optionValue as IAppearanceSettings['themeMode'] | undefined;
            if (next) {
              update({ themeMode: next });
            }
          }}
        >
          {THEME_MODE_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </AppDropdown>
      </Field>

      <div className={styles.sectionTitle}>Color scheme</div>
      <Text className={styles.sectionHint}>
        Sets the brand color for primary buttons, active tabs, links, and the default top navigation bar.
      </Text>
      <div className={styles.colorGrid}>
        {COLOR_SCHEME_OPTIONS.map((color) => (
          <button
            key={color}
            type="button"
            className={mergeClasses(
              styles.colorSwatch,
              value.colorScheme === color && styles.colorSwatchActive
            )}
            onClick={() => update({ colorScheme: color })}
            aria-pressed={value.colorScheme === color}
          >
            <span
              className={styles.colorBar}
              style={{ background: getSwatchBackground(color) }}
            />
            {color}
          </button>
        ))}
      </div>
      {value.colorScheme === 'Custom' && (
        <div className={styles.customColorRow}>
          <Field label="Custom brand color">
            <div className={styles.customColorBar}>
              <input
                type="color"
                className={styles.colorInput}
                value={value.customBrandColor}
                onChange={(e) => update({ customBrandColor: e.target.value })}
                aria-label="Custom brand color"
              />
            </div>
          </Field>
        </div>
      )}

      <div className={styles.sectionTitle}>Top navigation bar</div>
      <Text className={styles.sectionHint}>
        Customize the accent bar at the top of the app where New Asset and quick actions appear.
      </Text>
      {!isTeamsHostEnvironment() ? (
        <div className={styles.settingRow}>
          <div className={styles.settingCopy}>
            <strong>Remove top bar (actions in content)</strong>
            <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
              Hide the colored app top bar and move Procedure, theme toggle, dashboard actions,
              and New Asset to the top-right of the page header. Always on in Microsoft
              Teams, which has its own header.
            </div>
          </div>
          <Switch
            checked={value.hideAppTopBar}
            onChange={(_, data) => update({ hideAppTopBar: data.checked })}
          />
        </div>
      ) : (
        <Text className={styles.sectionHint}>
          In Microsoft Teams the app top bar is always hidden and its actions appear in the
          top-right of the page header, since Teams provides its own header.
        </Text>
      )}
      <div className={styles.settingRow}>
        <div className={styles.settingCopy}>
          <strong>Use custom top bar color</strong>
          <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
            Override the scheme gradient with a solid background and text color.
          </div>
        </div>
        <Switch
          checked={value.enableTopNavColor}
          onChange={(_, data) => update({ enableTopNavColor: data.checked })}
        />
      </div>
      {value.enableTopNavColor && (
        <div className={styles.colorFieldRow}>
          <Field label="Top bar background">
            <input
              type="color"
              className={styles.colorInput}
              value={value.topBarColor}
              onChange={(e) => update({ topBarColor: e.target.value })}
              aria-label="Top bar background color"
            />
          </Field>
          <Field label="Top bar text">
            <input
              type="color"
              className={styles.colorInput}
              value={value.topNavFontColor}
              onChange={(e) => update({ topNavFontColor: e.target.value })}
              aria-label="Top bar text color"
            />
          </Field>
        </div>
      )}
      <div className={styles.previewBar} style={topNavPreviewStyle}>
        <Text weight="semibold">{DEFAULT_APP_TITLE}</Text>
        <span className={styles.previewCtaButton} style={topNavCtaPreviewStyle}>
          + New Asset
        </span>
      </div>

      <div className={styles.sectionTitle}>Primary action button</div>
      <Text className={styles.sectionHint}>
        Colors for the + New Asset button in the top accent bar.
      </Text>
      <div className={styles.colorFieldRow}>
        <Field label="Button background">
          <input
            type="color"
            className={styles.colorInput}
            value={value.topNavCtaBackground}
            onChange={(e) => update({ topNavCtaBackground: e.target.value })}
            aria-label="Primary action button background color"
          />
        </Field>
        <Field label="Button text">
          <input
            type="color"
            className={styles.colorInput}
            value={value.topNavCtaText}
            onChange={(e) => update({ topNavCtaText: e.target.value })}
            aria-label="Primary action button text color"
          />
        </Field>
        <Field label="Button border">
          <input
            type="color"
            className={styles.colorInput}
            value={value.topNavCtaBorder}
            onChange={(e) => update({ topNavCtaBorder: e.target.value })}
            aria-label="Primary action button border color"
          />
        </Field>
      </div>
      <button
        type="button"
        className={styles.resetLink}
        onClick={() =>
          update({
            topNavCtaBackground: DEFAULT_APPEARANCE_SETTINGS.topNavCtaBackground,
            topNavCtaText: DEFAULT_APPEARANCE_SETTINGS.topNavCtaText,
            topNavCtaBorder: DEFAULT_APPEARANCE_SETTINGS.topNavCtaBorder
          })
        }
      >
        Reset primary button colors to default
      </button>

      <div className={styles.sectionTitle}>Sidebar navigation</div>
      <Text className={styles.sectionHint}>
        Adjust sidebar background and text colors for main navigation items.
      </Text>
      <div className={styles.settingRow}>
        <div className={styles.settingCopy}>
          <strong>Use custom sidebar colors</strong>
          <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
            Override the default sidebar background and label colors.
          </div>
        </div>
        <Switch
          checked={value.enableSidebarColor}
          onChange={(_, data) => update({ enableSidebarColor: data.checked })}
        />
      </div>
      {value.enableSidebarColor && (
        <div className={styles.colorFieldRow}>
          <Field label="Sidebar background">
            <input
              type="color"
              className={styles.colorInput}
              value={value.sidebarColor}
              onChange={(e) => update({ sidebarColor: e.target.value })}
              aria-label="Sidebar background color"
            />
          </Field>
          <Field label="Sidebar text">
            <input
              type="color"
              className={styles.colorInput}
              value={value.sidebarFontColor}
              onChange={(e) => update({ sidebarFontColor: e.target.value })}
              aria-label="Sidebar text color"
            />
          </Field>
        </div>
      )}
      <div className={styles.previewSidebar} style={sidebarPreviewStyle}>
        <div className={styles.previewNavItem}>Dashboard</div>
        <div className={mergeClasses(styles.previewNavItem, styles.previewNavItemActive)} style={activeNavStyle}>
          All Assets
        </div>
        <div className={styles.previewNavItem}>Settings</div>
      </div>

      <div className={styles.sectionTitle}>Asset list views</div>
      <Text className={styles.sectionHint}>
        Control which columns appear in asset tables and lists across the app.
      </Text>
      <div className={styles.settingRow}>
        <div className={styles.settingCopy}>
          <strong>Show image column</strong>
          <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
            Display the thumbnail image column in All Assets and filtered asset list views.
          </div>
        </div>
        <Switch
          checked={value.showAssetImageColumn}
          onChange={(_, data) => update({ showAssetImageColumn: data.checked })}
        />
      </div>

      <div className={styles.sectionTitle}>Layout and typography</div>
      <Text className={styles.sectionHint}>
        Control spacing, corner radius, and base font size across buttons, tabs, cards, and forms.
      </Text>
      {!isTeamsHostEnvironment() ? (
        <div className={styles.settingRow}>
          <div className={styles.settingCopy}>
            <strong>Hide SharePoint page header and toolbar</strong>
            <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
              Hide the SharePoint page title area plus New, Edit, Share, and page actions above the app.
            </div>
          </div>
          <Switch
            checked={value.hideSharePointPageBar}
            onChange={(_, data) => update({ hideSharePointPageBar: data.checked })}
          />
        </div>
      ) : null}
      {!isTeamsHostEnvironment() ? (
        <div className={styles.settingRow}>
          <div className={styles.settingCopy}>
            <strong>Hide SharePoint top toolbar</strong>
            <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
              Hide the Microsoft 365 bar with app launcher, search, and profile. Shows your profile
              photo in the app header when enabled.
            </div>
          </div>
          <Switch
            checked={value.hideSharePointTopBar}
            onChange={(_, data) => update({ hideSharePointTopBar: data.checked })}
          />
        </div>
      ) : null}
      {!isTeamsHostEnvironment() ? (
        <div className={styles.settingRow}>
          <div className={styles.settingCopy}>
            <strong>Hide SharePoint left navigation</strong>
            <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
              Hide the SharePoint app bar, site header, and left navigation panel beside the app.
            </div>
          </div>
          <Switch
            checked={value.hideSharePointLeftNav}
            onChange={(_, data) => update({ hideSharePointLeftNav: data.checked })}
          />
        </div>
      ) : null}
      <Field label="Base font size">
        <AppDropdown
          value={value.fontSize}
          selectedOptions={[value.fontSize]}
          onOptionSelect={(_, data) => {
            const next = data.optionValue as IAppearanceSettings['fontSize'] | undefined;
            if (next) {
              update({ fontSize: next });
            }
          }}
        >
          {FONT_SIZE_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </AppDropdown>
      </Field>
      <div className={styles.settingRow}>
        <div className={styles.settingCopy}>
          <strong>Rounded corners</strong>
          <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
            Apply softer corners to buttons, tabs, cards, and inputs.
          </div>
        </div>
        <Switch
          checked={value.roundedCorners}
          onChange={(_, data) => update({ roundedCorners: data.checked })}
        />
      </div>
      <div className={styles.settingRow}>
        <div className={styles.settingCopy}>
          <strong>Compact mode</strong>
          <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
            Reduce padding and spacing for a denser layout.
          </div>
        </div>
        <Switch
          checked={value.compactMode}
          onChange={(_, data) => update({ compactMode: data.checked })}
        />
      </div>
    </>
  );
};
