import * as React from 'react';
import {
  Field,
  Input,
  InteractionTag,
  InteractionTagPrimary,
  InteractionTagSecondary,
  makeStyles,
  Spinner,
  tokens
} from '@fluentui/react-components';
import { IPersonPickerItem, IPersonPickerSuggestion } from '../../models/IPersonPickerItem';
import { UserAvatar } from './UserAvatar';
import { accountNameFromLoginName } from '../../utils/userPhoto';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box'
  },
  field: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0
  },
  selectedRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    maxWidth: '100%'
  },
  searchWrap: {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0
  },
  input: {
    width: '100%',
    maxWidth: '100%'
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 10,
    marginTop: tokens.spacingVerticalXXS,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow8,
    minWidth: 0,
    maxHeight: '220px',
    overflowY: 'auto'
  },
  suggestionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    width: '100%',
    textAlign: 'left',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover
    }
  },
  suggestionText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: '1 1 auto'
  },
  suggestionTitle: {
    display: 'block',
    fontWeight: tokens.fontWeightSemibold
  },
  suggestionDescription: {
    display: 'block',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3
  },
  searching: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200
  }
});

function isGroupSuggestion(suggestion: IPersonPickerSuggestion): boolean {
  const entityType = (suggestion.entityType || '').toLowerCase();
  return (
    suggestion.isGroup === true ||
    entityType.includes('group') ||
    entityType === 'secgrp' ||
    entityType === 'spgroup'
  );
}

function emailFromSuggestion(suggestion: IPersonPickerSuggestion): string | undefined {
  const description = suggestion.description?.trim();
  if (description && description.indexOf('@') >= 0 && description.indexOf(' ') < 0) {
    return description;
  }
  return accountNameFromLoginName(suggestion.key);
}

export interface IPeoplePickerFieldProps {
  label?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  multi?: boolean;
  placeholder?: string;
  value: IPersonPickerItem[];
  onChange: (value: IPersonPickerItem[]) => void;
  onSearch: (query: string) => Promise<IPersonPickerSuggestion[]>;
  onResolve: (key: string) => Promise<IPersonPickerItem>;
}

export const PeoplePickerField: React.FC<IPeoplePickerFieldProps> = ({
  label,
  hint,
  required,
  disabled,
  multi = true,
  placeholder = 'Search for people or groups',
  value,
  onChange,
  onSearch,
  onResolve
}) => {
  const styles = useStyles();
  const [query, setQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<IPersonPickerSuggestion[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [resolving, setResolving] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState('');
  const searchRequestRef = React.useRef(0);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || disabled) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const requestId = ++searchRequestRef.current;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void onSearch(trimmed)
        .then((results) => {
          if (searchRequestRef.current !== requestId) {
            return;
          }
          const selectedKeys = new Set(
            value.map((person) => person.loginName?.toLowerCase() || String(person.id))
          );
          const filteredResults = results.filter(
            (result) => !selectedKeys.has(result.key.toLowerCase())
          );
          setSuggestions(filteredResults);
          setError('');
          setOpen(true);
        })
        .catch((err) => {
          if (searchRequestRef.current === requestId) {
            setSuggestions([]);
            setError(err instanceof Error ? err.message : 'People search failed. Try again.');
          }
        })
        .then(() => {
          if (searchRequestRef.current === requestId) {
            setSearching(false);
          }
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, disabled, onSearch, value]);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const removePerson = (personId: number): void => {
    onChange(value.filter((person) => person.id !== personId));
  };

  const selectSuggestion = async (suggestion: IPersonPickerSuggestion): Promise<void> => {
    if (disabled || resolving) {
      return;
    }

    setResolving(true);
    setError('');
    try {
      const resolved = await onResolve(suggestion.key);
      const person: IPersonPickerItem = {
        ...resolved,
        isGroup: resolved.isGroup ?? isGroupSuggestion(suggestion)
      };

      if (value.some((entry) => entry.id === person.id)) {
        return;
      }

      onChange(multi ? [...value, person] : [person]);
      setQuery('');
      setSuggestions([]);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resolve selected person or group.');
    } finally {
      setResolving(false);
    }
  };

  const resolveTypedQuery = async (): Promise<void> => {
    const trimmed = query.trim();
    if (!trimmed || disabled || resolving) {
      return;
    }

    // Never resolve raw typed text directly — `ensureUser` only accepts a valid
    // login name/email, not a display-name fragment. Resolve the top search match
    // instead, whose `key` is the proper claims login name.
    if (suggestions.length > 0) {
      await selectSuggestion(suggestions[0]);
      return;
    }

    setSearching(true);
    setError('');
    try {
      const results = await onSearch(trimmed);
      if (results.length === 0) {
        setError(`No people or groups found matching "${trimmed}". Pick a suggestion from the list.`);
        return;
      }
      await selectSuggestion(results[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'People search failed. Try again.');
    } finally {
      setSearching(false);
    }
  };

  const fieldContent = (
    <div ref={rootRef} className={styles.root}>
      {value.length > 0 && (
        <div className={styles.selectedRow}>
          {value.map((person) => (
            <InteractionTag
              key={person.id}
              appearance="filled"
              disabled={disabled}
              shape="rounded"
              size="medium"
            >
              <InteractionTagPrimary
                hasSecondaryAction={!disabled}
                media={
                  <UserAvatar
                    name={person.title}
                    email={person.email}
                    loginName={person.loginName}
                    isGroup={person.isGroup}
                    size={20}
                  />
                }
              >
                {person.title}
                {person.isGroup ? ' (Group)' : ''}
              </InteractionTagPrimary>
              {!disabled && (
                <InteractionTagSecondary
                  aria-label={`Remove ${person.title}`}
                  onClick={() => removePerson(person.id)}
                />
              )}
            </InteractionTag>
          ))}
        </div>
      )}

      <div className={styles.searchWrap}>
        <Input
          className={styles.input}
          value={query}
          disabled={disabled || resolving || (!multi && value.length > 0)}
          placeholder={placeholder}
          onChange={(_, data) => {
            setQuery(data.value);
            setError('');
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setOpen(true);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void resolveTypedQuery();
            }
          }}
        />

        {open && (searching || suggestions.length > 0) && (
          <div className={styles.suggestions} role="listbox">
            {searching && (
              <div className={styles.searching}>
                <Spinner size="tiny" />
                Searching...
              </div>
            )}
            {!searching &&
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.key}
                  type="button"
                  className={styles.suggestionItem}
                  role="option"
                  onClick={() => void selectSuggestion(suggestion)}
                >
                  <UserAvatar
                    name={suggestion.title}
                    email={emailFromSuggestion(suggestion)}
                    loginName={suggestion.key}
                    isGroup={isGroupSuggestion(suggestion)}
                    size={28}
                  />
                  <span className={styles.suggestionText}>
                    <span className={styles.suggestionTitle}>
                      {suggestion.title}
                      {isGroupSuggestion(suggestion) ? ' (Group)' : ''}
                    </span>
                    {suggestion.description && (
                      <span className={styles.suggestionDescription}>{suggestion.description}</span>
                    )}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>

      {error && (
        <span style={{ color: tokens.colorPaletteRedForeground1, fontSize: tokens.fontSizeBase200 }}>
          {error}
        </span>
      )}
    </div>
  );

  if (label) {
    return (
      <Field className={styles.field} label={label} hint={hint} required={required}>
        <div className={styles.field}>{fieldContent}</div>
      </Field>
    );
  }

  return fieldContent;
};
