import * as React from 'react';
import { Field, Option } from '@fluentui/react-components';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { SUPPORTED_LOCALES, type AppLocale } from '../../i18n/types';
import { useLocale } from '../../i18n/LocaleContext';
import { SettingsPageHeader } from './SettingsPageHeader';

const LANGUAGE_LABEL_KEYS: Record<AppLocale, 'languageEn' | 'languageEs' | 'languageFr' | 'languageDe'> = {
  en: 'languageEn',
  es: 'languageEs',
  fr: 'languageFr',
  de: 'languageDe'
};

export interface ILanguageSettingsTabProps {
  pageTitle: string;
  pageDescription?: string;
  pageIcon?: React.ElementType;
}

export const LanguageSettingsTab: React.FC<ILanguageSettingsTabProps> = ({
  pageTitle,
  pageDescription,
  pageIcon
}) => {
  const { locale, setLocale, t } = useLocale();

  return (
    <>
      <SettingsPageHeader title={pageTitle} description={pageDescription} icon={pageIcon} />
      <Field label={t('settings', 'language', 'Language')}>
        <AppDropdown
          selectedOptions={[locale]}
          onOptionSelect={(_, data) => setLocale((data.optionValue || 'en') as typeof locale)}
        >
          {SUPPORTED_LOCALES.map((item) => {
            const label = t('settings', LANGUAGE_LABEL_KEYS[item.code], item.label);
            return (
              <Option key={item.code} value={item.code} text={label}>
                {label}
              </Option>
            );
          })}
        </AppDropdown>
      </Field>
    </>
  );
};
