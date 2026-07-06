import type { ListColumnMeta, ListViewMode, ListViewPreferences } from './types';
import { isMobileViewport } from '../../utils/useMediaQuery';

const STORAGE_PREFIX = 'asset-mgmt-list-view-v1';

function storageKey(listKey: string): string {
  return `${STORAGE_PREFIX}:${listKey}`;
}

export function getDefaultVisibleColumns(columns: ListColumnMeta[]): string[] {
  return columns
    .filter((column) => column.defaultVisible !== false)
    .map((column) => column.key);
}

export function loadListViewPreferences(
  listKey: string,
  columns: ListColumnMeta[]
): ListViewPreferences {
  const defaults: ListViewPreferences = {
    viewMode: isMobileViewport() ? 'list' : 'table',
    visibleColumns: getDefaultVisibleColumns(columns)
  };

  try {
    const raw = localStorage.getItem(storageKey(listKey));
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw) as Partial<ListViewPreferences>;
    const allowedKeys = new Set(columns.map((column) => column.key));
    const lockedKeys = columns.filter((column) => column.locked).map((column) => column.key);
    const visibleColumns = (parsed.visibleColumns || defaults.visibleColumns).filter((key) =>
      allowedKeys.has(key)
    );

    lockedKeys.forEach((key) => {
      if (!visibleColumns.includes(key)) {
        visibleColumns.unshift(key);
      }
    });

    const viewMode: ListViewMode =
      parsed.viewMode === 'list' || parsed.viewMode === 'card' ? parsed.viewMode : 'table';

    return {
      viewMode,
      visibleColumns: visibleColumns.length > 0 ? visibleColumns : defaults.visibleColumns
    };
  } catch {
    return defaults;
  }
}

export function saveListViewPreferences(listKey: string, preferences: ListViewPreferences): void {
  try {
    localStorage.setItem(storageKey(listKey), JSON.stringify(preferences));
  } catch {
    /* ignore */
  }
}
