import * as React from 'react';
import {
  Menu,
  MenuButton,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import type { AppLocale } from '../../i18n/types';
import { getLanguageOptions } from '../../i18n/types';
import { useLocale } from '../../i18n/LocaleContext';

/** Inline SVG flags — emoji flags do not render reliably on Windows. */
const FlagIcon: React.FC<{ locale: AppLocale; size?: number }> = ({ locale, size = 20 }) => {
  const width = size;
  const height = Math.round((size * 2) / 3);
  const commonProps = {
    width,
    height,
    viewBox: '0 0 24 16',
    role: 'img' as const,
    'aria-hidden': true,
    preserveAspectRatio: 'none' as const,
    style: {
      borderRadius: 3,
      display: 'block',
      boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.12)'
    }
  };

  switch (locale) {
    case 'fr':
      return (
        <svg {...commonProps}>
          <rect width="24" height="16" fill="#ffffff" />
          <rect width="8" height="16" fill="#0055a4" />
          <rect x="16" width="8" height="16" fill="#ef4135" />
        </svg>
      );
    case 'de':
      return (
        <svg {...commonProps}>
          <rect width="24" height="16" fill="#ffce00" />
          <rect width="24" height="5.34" fill="#000000" />
          <rect y="5.34" width="24" height="5.33" fill="#dd0000" />
        </svg>
      );
    case 'es':
      return (
        <svg {...commonProps}>
          <rect width="24" height="16" fill="#aa151b" />
          <rect y="4" width="24" height="8" fill="#f1bf00" />
        </svg>
      );
    case 'en':
    default:
      return (
        <svg {...commonProps}>
          <rect width="24" height="16" fill="#b22234" />
          <g fill="#ffffff">
            <rect y="1.23" width="24" height="1.23" />
            <rect y="3.69" width="24" height="1.23" />
            <rect y="6.15" width="24" height="1.23" />
            <rect y="8.62" width="24" height="1.23" />
            <rect y="11.08" width="24" height="1.23" />
            <rect y="13.54" width="24" height="1.23" />
          </g>
          <rect width="10" height="8.62" fill="#3c3b6e" />
        </svg>
      );
  }
};

const LANGUAGE_LABEL_KEYS: Record<AppLocale, 'languageEn' | 'languageEs' | 'languageFr' | 'languageDe'> = {
  en: 'languageEn',
  es: 'languageEs',
  fr: 'languageFr',
  de: 'languageDe'
};

const useStyles = makeStyles({
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    padding: 0,
    borderRadius: tokens.borderRadiusCircular,
    border: '1px solid color-mix(in srgb, var(--asset-topnav-text, #ffffff) 55%, transparent)',
    backgroundColor: 'color-mix(in srgb, var(--asset-topnav-text, #ffffff) 10%, transparent)',
    color: 'var(--asset-topnav-text, #ffffff)',
    flexShrink: 0,
    minWidth: 0,
    ':hover': {
      backgroundColor: 'color-mix(in srgb, var(--asset-topnav-text, #ffffff) 18%, transparent)'
    }
  },
  triggerCompact: {
    width: 'auto',
    minWidth: '34px',
    paddingInline: tokens.spacingHorizontalS,
    gap: tokens.spacingHorizontalS,
    borderRadius: tokens.borderRadiusMedium
  },
  flag: {
    display: 'inline-flex',
    alignItems: 'center',
    lineHeight: 1
  },
  code: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.04em',
    textTransform: 'uppercase'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    minWidth: '168px',
    paddingBlock: tokens.spacingVerticalS
  },
  menuFlag: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    flexShrink: 0
  },
  menuLabel: {
    flex: 1
  }
});

export interface IUserLanguageMenuProps {
  /** Show locale code (EN) beside the flag on wider layouts. */
  showCode?: boolean;
}

export const UserLanguageMenu: React.FC<IUserLanguageMenuProps> = ({ showCode = false }) => {
  const styles = useStyles();
  const { locale, setLocale, t } = useLocale();
  const options = getLanguageOptions();

  const handleSelect = (_: unknown, data: { checkedItems: string[] }): void => {
    const next = data.checkedItems[0] as AppLocale | undefined;
    if (next) {
      setLocale(next);
    }
  };

  const languageLabel = (code: AppLocale): string => {
    const key = LANGUAGE_LABEL_KEYS[code];
    return t('settings', key, code);
  };

  return (
    <Menu checkedValues={{ language: [locale] }} onCheckedValueChange={handleSelect}>
      <MenuTrigger disableButtonEnhancement>
        <MenuButton
          className={showCode ? `${styles.trigger} ${styles.triggerCompact}` : styles.trigger}
          appearance="transparent"
          aria-label={t('user', 'languageAriaLabel', 'Change display language')}
          title={t('user', 'languageLabel', 'Language')}
        >
          {showCode ? (
            <>
              <span className={styles.flag}>
                <FlagIcon locale={locale} size={20} />
              </span>
              <span className={styles.code}>{locale}</span>
            </>
          ) : (
            <span className={styles.flag}>
              <FlagIcon locale={locale} size={20} />
            </span>
          )}
        </MenuButton>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {options.map((code) => (
            <MenuItemRadio key={code} name="language" value={code}>
              <span className={styles.menuItem}>
                <span className={styles.menuFlag}>
                  <FlagIcon locale={code} size={22} />
                </span>
                <span className={styles.menuLabel}>{languageLabel(code)}</span>
              </span>
            </MenuItemRadio>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};
