import * as React from 'react';
import { Field, Option } from '@fluentui/react-components';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { SUPPORTED_LOCALES } from '../../i18n/types';
import { useLocale } from '../../i18n/LocaleContext';
import { SettingsPageHeader } from './SettingsPageHeader';

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
          {SUPPORTED_LOCALES.map((item) => (
            <Option key={item.code} value={item.code} text={item.label}>
              {item.label}
            </Option>
          ))}
        </AppDropdown>
      </Field>
    </>
  );
};
