import { Option, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import * as React from 'react';
import { SearchableSelect } from './SearchableSelect';

export interface AppDropdownProps {
  placeholder?: string;
  value?: string;
  selectedOptions?: string[];
  disabled?: boolean;
  className?: string;
  /** When true, renders a searchable inline panel instead of a native select. */
  searchable?: boolean;
  searchPlaceholder?: string;
  onOptionSelect?: (
    event: React.SyntheticEvent,
    data: { optionValue?: string; optionText?: string }
  ) => void;
  children?: React.ReactNode;
}

interface ParsedOption {
  value: string;
  label: string;
}

const useStyles = makeStyles({
  select: {
    display: 'block',
    width: '100%',
    minHeight: '32px',
    boxSizing: 'border-box',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalXL,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage:
      'linear-gradient(45deg, transparent 50%, var(--colorNeutralStrokeAccessible) 50%), linear-gradient(135deg, var(--colorNeutralStrokeAccessible) 50%, transparent 50%)',
    backgroundPosition: 'calc(100% - 18px) calc(50% - 2px), calc(100% - 13px) calc(50% - 2px)',
    backgroundSize: '5px 5px, 5px 5px',
    backgroundRepeat: 'no-repeat',
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
    },
    '& option': {
      backgroundColor: tokens.colorNeutralBackground1,
      color: tokens.colorNeutralForeground1
    }
  }
});

function parseOptions(children: React.ReactNode): ParsedOption[] {
  const options: ParsedOption[] = [];

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

    options.push({ value, label });
  });

  return options;
}

/**
 * SPFx-safe select control. Uses a native `<select>` (not Fluent Dropdown/Combobox portals)
 * so choices work inside SharePoint, modal dialogs, and slide-out panels.
 */
const NativeAppSelect: React.FC<Omit<AppDropdownProps, 'searchable' | 'searchPlaceholder'>> = ({
  placeholder,
  value: displayValue,
  selectedOptions,
  disabled,
  className,
  onOptionSelect,
  children
}) => {
  const styles = useStyles();
  const options = React.useMemo(() => parseOptions(children), [children]);
  const selectedValue = selectedOptions?.[0];
  const selectValue =
    selectedValue !== undefined && selectedValue !== ''
      ? selectedValue
      : options.some((option) => option.value === displayValue)
        ? String(displayValue)
        : '';

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const nextValue = event.target.value;
    onOptionSelect?.(event, {
      optionValue: nextValue,
      optionText: options.find((option) => option.value === nextValue)?.label
    });
  };

  const hasEmptyOption = options.some((option) => option.value === '');

  return (
    <select
      className={mergeClasses('asset-mgmt-native-select', styles.select, className)}
      disabled={disabled}
      value={selectValue}
      onChange={handleChange}
    >
      {placeholder && !hasEmptyOption && (
        <option value="">{placeholder}</option>
      )}
      {options.map((option) => (
        <option key={`${option.value}-${option.label}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export const AppDropdown: React.FC<AppDropdownProps> = ({
  searchable = false,
  searchPlaceholder,
  ...props
}) => {
  if (searchable) {
    return (
      <SearchableSelect
        placeholder={props.placeholder}
        searchPlaceholder={searchPlaceholder}
        value={props.value}
        selectedOptions={props.selectedOptions}
        disabled={props.disabled}
        className={props.className}
        onOptionSelect={props.onOptionSelect}
      >
        {props.children}
      </SearchableSelect>
    );
  }

  return <NativeAppSelect {...props} />;
};
