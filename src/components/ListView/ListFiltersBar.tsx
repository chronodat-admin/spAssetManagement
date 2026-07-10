import * as React from 'react';
import {
  Button,
  Input,
  makeStyles,
  Option,
  tokens
} from '@fluentui/react-components';
import { DismissRegular, SearchRegular } from '@fluentui/react-icons';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { useTranslation } from '../../i18n/LocaleContext';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingHorizontalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    '@media (max-width: 768px)': {
      padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`
    }
  },
  searchField: {
    flex: '1 1 280px',
    minWidth: '200px',
    maxWidth: '100%',
    '@media (max-width: 768px)': {
      flex: '1 1 100%',
      minWidth: 0
    }
  },
  searchInput: {
    width: '100%'
  },
  dropdown: {
    flex: '0 1 170px',
    minWidth: '150px',
    maxWidth: '100%',
    '@media (max-width: 768px)': {
      flex: '1 1 100%',
      minWidth: 0
    }
  },
  clearButton: {
    flexShrink: 0
  }
});

export interface IListFilterDropdownConfig {
  key: string;
  placeholder: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

export interface IListFiltersBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  dropdowns?: IListFilterDropdownConfig[];
  onClear?: () => void;
  showClear?: boolean;
}

export const ListFiltersBar: React.FC<IListFiltersBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  dropdowns = [],
  onClear,
  showClear = false
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('listView', 'searchPlaceholder', 'Search...');

  return (
    <div className={styles.root}>
      <div className={styles.searchField}>
        <Input
          className={styles.searchInput}
          value={searchValue}
          onChange={(_, data) => onSearchChange(data.value)}
          placeholder={resolvedSearchPlaceholder}
          contentBefore={<SearchRegular />}
          aria-label={t('listView', 'searchAria', 'Search list')}
        />
      </div>

      {dropdowns.map((dropdown) => (
        <AppDropdown
          key={dropdown.key}
          className={styles.dropdown}
          placeholder={dropdown.placeholder}
          selectedOptions={[dropdown.value]}
          onOptionSelect={(_event: unknown, data: { optionValue?: string }) =>
            dropdown.onChange(data.optionValue ?? '')
          }
        >
          {dropdown.options.map((option) => (
            <Option key={`${dropdown.key}-${option.value}`} value={option.value}>
              {option.label}
            </Option>
          ))}
        </AppDropdown>
      ))}

      {onClear && (
        <Button
          className={styles.clearButton}
          appearance="subtle"
          icon={<DismissRegular />}
          disabled={!showClear}
          onClick={onClear}
        >
          {t('listView', 'clearFilters', 'Clear filters')}
        </Button>
      )}
    </div>
  );
};
