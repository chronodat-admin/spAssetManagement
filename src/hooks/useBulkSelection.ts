import * as React from 'react';

export interface IBulkSelectionState {
  selectedKeys: Set<string | number>;
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;
  toggleItem: (key: string | number, selected: boolean) => void;
  toggleAll: (selected: boolean) => void;
  clearSelection: () => void;
}

export function useBulkSelection<T>(
  items: T[],
  getItemKey: (item: T) => string | number
): IBulkSelectionState {
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string | number>>(() => new Set());

  const itemKeys = React.useMemo(() => items.map(getItemKey), [items, getItemKey]);

  React.useEffect(() => {
    setSelectedKeys((current) => {
      const visible = new Set(itemKeys);
      const next = new Set<string | number>();
      current.forEach((key) => {
        if (visible.has(key)) {
          next.add(key);
        }
      });
      return next;
    });
  }, [itemKeys]);

  const toggleItem = React.useCallback((key: string | number, selected: boolean): void => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }, []);

  const toggleAll = React.useCallback(
    (selected: boolean): void => {
      if (!selected) {
        setSelectedKeys(new Set());
        return;
      }
      setSelectedKeys(new Set(itemKeys));
    },
    [itemKeys]
  );

  const clearSelection = React.useCallback((): void => {
    setSelectedKeys(new Set());
  }, []);

  const selectedCount = selectedKeys.size;
  const allSelected = itemKeys.length > 0 && itemKeys.every((key) => selectedKeys.has(key));
  const someSelected = itemKeys.some((key) => selectedKeys.has(key)) && !allSelected;

  return {
    selectedKeys,
    selectedCount,
    allSelected,
    someSelected,
    toggleItem,
    toggleAll,
    clearSelection
  };
}
