import * as React from 'react';
import { Input, Option, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { ChevronDownRegular, SearchRegular } from '@fluentui/react-icons';

export interface SearchableSelectOption {
  value: string;
  label: string;
  searchText?: string;
}

export interface SearchableSelectProps {
  placeholder?: string;
  searchPlaceholder?: string;
  value?: string;
  selectedOptions?: string[];
  disabled?: boolean;
  className?: string;
  options?: SearchableSelectOption[];
  onOptionSelect?: (
    event: React.SyntheticEvent,
    data: { optionValue?: string; optionText?: string }
  ) => void;
  children?: React.ReactNode;
}

const useStyles = makeStyles({
  root: {
    position: 'relative',
    width: '100%',
    minWidth: 0
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    width: '100%',
    minHeight: '32px',
    boxSizing: 'border-box',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalS,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    cursor: 'pointer',
    textAlign: 'left',
    ':focus-visible': {
      outlineWidth: '2px',
      outlineStyle: 'solid',
      outlineColor: tokens.colorBrandStroke1,
      outlineOffset: '1px'
    },
    ':disabled': {
      cursor: 'not-allowed',
      color: tokens.colorNeutralForegroundDisabled,
      backgroundColor: tokens.colorNeutralBackground3
    }
  },
  triggerLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: '1 1 auto',
    minWidth: 0
  },
  triggerPlaceholder: {
    color: tokens.colorNeutralForeground3
  },
  chevron: {
    flexShrink: 0,
    color: tokens.colorNeutralForeground3
  },
  panel: {
    position: 'absolute',
    top: 'calc(100% + 2px)',
    left: 0,
    right: 0,
    zIndex: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalXS,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow8
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '240px',
    overflowY: 'auto',
    margin: 0,
    padding: 0,
    listStyle: 'none'
  },
  option: {
    display: 'block',
    width: '100%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover
    }
  },
  optionSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    fontWeight: tokens.fontWeightSemibold,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover
    }
  },
  empty: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200
  }
});

function parseOptions(children: React.ReactNode): SearchableSelectOption[] {
  const options: SearchableSelectOption[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<{ value?: string; children?: React.ReactNode; text?: string }>(child)) {
      return;
    }

    if (child.type !== Option) {
      return;
    }

    const value = child.props.value !== undefined ? String(child.props.value) : '';
    const label =
      typeof child.props.children === 'string'
        ? child.props.children
        : child.props.text !== undefined
          ? String(child.props.text)
          : value;

    options.push({
      value,
      label,
      searchText: child.props.text !== undefined ? String(child.props.text) : undefined
    });
  });

  return options;
}

function matchesQuery(option: SearchableSelectOption, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  const haystack = `${option.label} ${option.searchText || ''}`.toLowerCase();
  return haystack.includes(normalized);
}

/**
 * SPFx-safe searchable select. Uses an inline panel (no Fluent portal) so it works
 * inside SharePoint web parts, modals, and slide-out panels.
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  placeholder,
  searchPlaceholder = 'Search…',
  value: displayValue,
  selectedOptions,
  disabled,
  className,
  options: optionsProp,
  onOptionSelect,
  children
}) => {
  const styles = useStyles();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const options = React.useMemo(
    () => optionsProp ?? parseOptions(children),
    [optionsProp, children]
  );

  const selectedValue =
    selectedOptions?.[0] !== undefined && selectedOptions[0] !== ''
      ? selectedOptions[0]
      : options.some((option) => option.value === displayValue)
        ? String(displayValue)
        : '';

  const selectedOption = options.find((option) => option.value === selectedValue);
  const filteredOptions = React.useMemo(
    () => options.filter((option) => matchesQuery(option, query)),
    [options, query]
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  React.useEffect(() => {
    if (open) {
      window.setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = (option: SearchableSelectOption): void => {
    onOptionSelect?.({} as React.SyntheticEvent, {
      optionValue: option.value,
      optionText: option.label
    });
    setOpen(false);
    setQuery('');
  };

  const toggleOpen = (): void => {
    if (disabled) {
      return;
    }
    setOpen((prev) => !prev);
    if (open) {
      setQuery('');
    }
  };

  return (
    <div ref={rootRef} className={mergeClasses('asset-mgmt-searchable-select', styles.root, className)}>
      <button
        type="button"
        className={styles.trigger}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        <span
          className={mergeClasses(
            styles.triggerLabel,
            !selectedOption && placeholder && styles.triggerPlaceholder
          )}
        >
          {selectedOption?.label || placeholder || 'Select…'}
        </span>
        <ChevronDownRegular className={styles.chevron} />
      </button>

      {open ? (
        <div className={styles.panel}>
          <div className={styles.searchWrap}>
            <SearchRegular className={styles.searchIcon} fontSize={16} />
            <Input
              ref={searchRef}
              className={styles.searchInput}
              value={query}
              placeholder={searchPlaceholder}
              onChange={(_, data) => setQuery(data.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setOpen(false);
                  setQuery('');
                }
              }}
            />
          </div>
          <ul className={styles.list} role="listbox">
            {filteredOptions.length === 0 ? (
              <li className={styles.empty}>No matching items</li>
            ) : (
              filteredOptions.map((option) => (
                <li key={`${option.value}-${option.label}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === selectedValue}
                    className={mergeClasses(
                      styles.option,
                      option.value === selectedValue && styles.optionSelected
                    )}
                    onClick={() => handleSelect(option)}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
