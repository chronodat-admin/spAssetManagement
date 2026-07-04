import * as React from 'react';
import { WeatherMoonRegular, WeatherSunnyRegular } from '@fluentui/react-icons';
import { useAppearanceTheme } from '../../contexts/AppearanceThemeContext';
import { AccentBarButton } from './AccentBarButton';

export interface IThemeModeToggleProps {
  compact?: boolean;
}

export const ThemeModeToggle: React.FC<IThemeModeToggleProps> = ({ compact }) => {
  const { isDark, toggleThemeMode } = useAppearanceTheme();

  return (
    <AccentBarButton
      variant="ghost"
      icon={isDark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
      onClick={toggleThemeMode}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      size={compact ? 'small' : 'medium'}
    >
      {compact ? undefined : isDark ? 'Light mode' : 'Dark mode'}
    </AccentBarButton>
  );
};
