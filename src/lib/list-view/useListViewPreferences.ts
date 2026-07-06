import * as React from 'react';
import { loadListViewPreferences, saveListViewPreferences } from './storage';
import type { ListColumnMeta, ListViewMode } from './types';

export function useListViewPreferences(listKey: string, columns: ListColumnMeta[]) {
  const columnKeys = React.useMemo(() => columns.map((column) => column.key).join('|'), [columns]);
  const [viewMode, setViewModeState] = React.useState<ListViewMode>('table');
  const [visibleColumns, setVisibleColumnsState] = React.useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const loaded = loadListViewPreferences(listKey, columns);
    setViewModeState(loaded.viewMode);
    setVisibleColumnsState(loaded.visibleColumns);
    setReady(true);
  }, [listKey, columnKeys, columns]);

  const persist = React.useCallback(
    (mode: ListViewMode, visible: string[]) => {
      saveListViewPreferences(listKey, { viewMode: mode, visibleColumns: visible });
    },
    [listKey]
  );

  const setViewMode = React.useCallback(
    (mode: ListViewMode) => {
      setViewModeState(mode);
      setVisibleColumnsState((current) => {
        persist(mode, current);
        return current;
      });
    },
    [persist]
  );

  const setVisibleColumns = React.useCallback(
    (next: string[]) => {
      const locked = columns.filter((column) => column.locked).map((column) => column.key);
      const merged = [...new Set([...locked, ...next])];
      setVisibleColumnsState(merged);
      setViewModeState((currentMode) => {
        persist(currentMode, merged);
        return currentMode;
      });
    },
    [columns, persist]
  );

  const toggleColumn = React.useCallback(
    (key: string, enabled: boolean) => {
      const column = columns.find((entry) => entry.key === key);
      if (column?.locked) {
        return;
      }

      setVisibleColumnsState((current) => {
        const next = enabled ? [...current, key] : current.filter((entry) => entry !== key);
        const locked = columns.filter((entry) => entry.locked).map((entry) => entry.key);
        const merged = [...new Set([...locked, ...next])];
        setViewModeState((currentMode) => {
          persist(currentMode, merged);
          return currentMode;
        });
        return merged;
      });
    },
    [columns, persist]
  );

  return {
    ready,
    viewMode,
    visibleColumns,
    settingsOpen,
    setViewMode,
    setVisibleColumns,
    toggleColumn,
    setSettingsOpen
  };
}
