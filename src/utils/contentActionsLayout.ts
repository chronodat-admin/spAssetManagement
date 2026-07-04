import type { IAppearanceSettings } from '../models/IAppearanceSettings';

/** True when global shell actions render in the page header instead of the colored app bar. */
export function isContentActionsLayoutEnabled(
  appearance: IAppearanceSettings,
  isTeamsHost = false
): boolean {
  return isTeamsHost || appearance.hideAppTopBar;
}
