import * as React from 'react';
import {
  Button,
  Checkbox,
  Input,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { SearchRegular } from '@fluentui/react-icons';

export interface SearchableCheckboxListItem {
  id: number;
  label: string;
  searchText?: string;
}

export interface SearchableCheckboxListProps {
  items: SearchableCheckboxListItem[];
  selectedIds: Set<number>;
  onToggle: (id: number, checked: boolean) => void;
  onSelectionChange?: (next: Set<number>) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  noResultsMessage?: string;
  selectAllLabel?: string;
  clearLabel?: string;
  maxHeight?: number;
  disabled?: boolean;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    width: '100%',
    minWidth: 0
  },
  searchWrap: {
    position: 'relative',
    width: '100%'
  },
  searchIcon: {
    position: 'absolute',
    left: tokens.spacingHorizontalS,
    top: '50%',
    transform: 'translateY(-50%)',
    color: tokens.colorNeutralForeground3,
    pointerEvents: 'none'
  },
  searchInput: {
    width: '100%',
    paddingLeft: tokens.spacingHorizontalXXL
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    overflowY: 'auto',
    paddingRight: tokens.spacingHorizontalXXS
  },
  empty: {
    color: tokens.colorNeutralForeground3
  }
});

function matchesQuery(item: SearchableCheckboxListItem, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  const haystack = `${item.label} ${item.searchText || ''}`.toLowerCase();
  return haystack.includes(normalized);
}

export const SearchableCheckboxList: React.FC<SearchableCheckboxListProps> = ({
  items,
  selectedIds,
  onToggle,
  onSelectionChange,
  searchPlaceholder = 'Search assets…',
  emptyMessage = 'No items available.',
  noResultsMessage = 'No matching items.',
  selectAllLabel = 'Select all shown',
  clearLabel = 'Clear selection',
  maxHeight = 280,
  disabled = false
}) => {
  const styles = useStyles();
  const [query, setQuery] = React.useState('');

  const filteredItems = React.useMemo(
    () => items.filter((item) => matchesQuery(item, query)),
    [items, query]
  );

  const handleSelectAllFiltered = (): void => {
    if (onSelectionChange) {
      const next = new Set(selectedIds);
      filteredItems.forEach((item) => next.add(item.id));
      onSelectionChange(next);
      return;
    }
    filteredItems.forEach((item) => {
      if (!selectedIds.has(item.id)) {
        onToggle(item.id, true);
      }
    });
  };

  const handleClearSelection = (): void => {
    if (onSelectionChange) {
      onSelectionChange(new Set());
      return;
    }
    selectedIds.forEach((id) => onToggle(id, false));
  };

  if (items.length === 0) {
    return <Text className={styles.empty}>{emptyMessage}</Text>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.searchWrap}>
        <SearchRegular className={styles.searchIcon} fontSize={16} />
        <Input
          className={styles.searchInput}
          value={query}
          disabled={disabled}
          placeholder={searchPlaceholder}
          onChange={(_, data) => setQuery(data.value)}
        />
      </div>

      <div className={styles.toolbar}>
        <Button
          appearance="subtle"
          size="small"
          disabled={disabled || filteredItems.length === 0}
          onClick={handleSelectAllFiltered}
        >
          {selectAllLabel}
        </Button>
        <Button
          appearance="subtle"
          size="small"
          disabled={disabled || selectedIds.size === 0}
          onClick={handleClearSelection}
        >
          {clearLabel}
        </Button>
      </div>

      <div className={styles.list} style={{ maxHeight }}>
        {filteredItems.length === 0 ? (
          <Text className={styles.empty}>{noResultsMessage}</Text>
        ) : (
          filteredItems.map((item) => (
            <Checkbox
              key={item.id}
              label={item.label}
              disabled={disabled}
              checked={selectedIds.has(item.id)}
              onChange={(_, data) => onToggle(item.id, Boolean(data.checked))}
            />
          ))
        )}
      </div>
    </div>
  );
};
