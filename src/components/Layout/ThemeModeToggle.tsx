import * as React from 'react';
import { WeatherMoonRegular, WeatherSunnyRegular } from '@fluentui/react-icons';
import { useAppearanceTheme } from '../../contexts/AppearanceThemeContext';
import { useTranslation } from '../../i18n/LocaleContext';
import { AccentBarButton } from './AccentBarButton';

export interface IThemeModeToggleProps {
  compact?: boolean;
}

export const ThemeModeToggle: React.FC<IThemeModeToggleProps> = ({ compact }) => {
  const { isDark, toggleThemeMode } = useAppearanceTheme();
  const { t } = useTranslation();
  const lightLabel = t('shell', 'lightMode', 'Light mode');
  const darkLabel = t('shell', 'darkMode', 'Dark mode');

  return (
    <AccentBarButton
      variant="ghost"
      icon={isDark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
      onClick={toggleThemeMode}
      aria-label={isDark ? lightLabel : darkLabel}
      size={compact ? 'small' : 'medium'}
    >
      {compact ? undefined : isDark ? lightLabel : darkLabel}
    </AccentBarButton>
  );
};
