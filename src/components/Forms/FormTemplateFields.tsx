import * as React from 'react';
import {
  Field,
  Input,
  Switch,
  Text,
  Textarea,
  mergeClasses
} from '@fluentui/react-components';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { Option } from '@fluentui/react-components';
import { PeoplePickerField } from '../PeoplePicker/PeoplePickerField';
import { UserCell } from '../PeoplePicker/UserAvatar';
import { IPersonPickerItem } from '../../models/IPersonPickerItem';
import { AssetService } from '../../services/AssetService';
import type { FormTemplateField, TemplateFieldValue, TemplateValues } from '../../lib/form-templates/types';
import { useFormStyles } from './formStyles';

function isFullWidthField(field: FormTemplateField): boolean {
  return field.type === 'textarea';
}

function formatReadonlyValue(field: FormTemplateField, value: TemplateFieldValue | undefined): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }
  if (field.type === 'checkbox') {
    return value ? 'Yes' : 'No';
  }
  if (field.type === 'user_lookup' || field.type === 'user_multi') {
    const users = Array.isArray(value) ? value : [];
    if (users.length === 0) {
      return '—';
    }
    if (users.length === 1) {
      return users[0].title;
    }
    return users.map((user) => user.title).join(', ');
  }
  return String(value);
}

export interface IFormTemplateFieldsProps {
  fields: FormTemplateField[];
  values: TemplateValues;
  readOnly?: boolean;
  disabled?: boolean;
  riskService: AssetService;
  onChange: (next: TemplateValues) => void;
}

export const FormTemplateFields: React.FC<IFormTemplateFieldsProps> = ({
  fields,
  values,
  readOnly = false,
  disabled = false,
  riskService,
  onChange
}) => {
  const styles = useFormStyles();

  const setFieldValue = (fieldId: string, value: TemplateFieldValue): void => {
    onChange({ ...values, [fieldId]: value });
  };

  const handleSearchPeople = React.useCallback(
    (query: string) => riskService.searchPeople(query),
    [riskService]
  );
  const handleResolvePerson = React.useCallback(
    (key: string) => riskService.resolvePerson(key),
    [riskService]
  );

  if (fields.length === 0) {
    return (
      <Text className={styles.readonlyEmpty}>
        No additional fields are configured for this category template.
      </Text>
    );
  }

  return (
    <div className={styles.grid}>
      {fields.map((field) => {
        const current = values[field.id];
        const fullWidth = isFullWidthField(field);

        if (readOnly) {
          if (field.type === 'user_lookup' || field.type === 'user_multi') {
            const users = Array.isArray(current) ? (current as IPersonPickerItem[]) : [];
            return (
              <div key={field.id} className={fullWidth ? styles.fullWidth : undefined}>
                <Field label={field.label}>
                  {users.length === 0 ? (
                    <Text className={styles.readonlyEmpty}>—</Text>
                  ) : users.length === 1 ? (
                    <UserCell name={users[0].title} email={users[0].email} />
                  ) : (
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {users.map((user) => (
                        <UserCell key={user.id} name={user.title} email={user.email} />
                      ))}
                    </span>
                  )}
                </Field>
              </div>
            );
          }

          return (
            <div key={field.id} className={fullWidth ? styles.fullWidth : undefined}>
              <Field label={field.label}>
                <Text
                  className={
                    formatReadonlyValue(field, current) === '—'
                      ? styles.readonlyEmpty
                      : styles.readonlyValue
                  }
                >
                  {formatReadonlyValue(field, current)}
                </Text>
              </Field>
            </div>
          );
        }

        const fieldNode = (() => {
          if (field.type === 'textarea') {
            return (
              <Textarea
                rows={3}
                resize="vertical"
                placeholder={field.placeholder}
                value={String(current || '')}
                disabled={disabled}
                onChange={(_, data) => setFieldValue(field.id, data.value)}
              />
            );
          }

          if (field.type === 'dropdown') {
            const options = field.options || [];
            return (
              <AppDropdown
                placeholder={field.placeholder || 'Select...'}
                value={String(current || '')}
                selectedOptions={current ? [String(current)] : []}
                disabled={disabled}
                onOptionSelect={(_, data) => setFieldValue(field.id, data.optionValue || '')}
              >
                {!field.required && <Option value="">None</Option>}
                {options.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </AppDropdown>
            );
          }

          if (field.type === 'checkbox') {
            return (
              <Switch
                checked={Boolean(current)}
                disabled={disabled}
                onChange={(_, data) => setFieldValue(field.id, data.checked)}
              />
            );
          }

          if (field.type === 'date') {
            const dateValue =
              typeof current === 'string' && current.includes('T')
                ? current.split('T')[0]
                : String(current || '');
            return (
              <Input
                type="date"
                value={dateValue}
                disabled={disabled}
                onChange={(_, data) => setFieldValue(field.id, data.value)}
              />
            );
          }

          if (field.type === 'number' || field.type === 'currency') {
            return (
              <Input
                type="number"
                placeholder={field.placeholder}
                value={String(current ?? '')}
                disabled={disabled}
                onChange={(_, data) => setFieldValue(field.id, data.value)}
              />
            );
          }

          if (field.type === 'email') {
            return (
              <Input
                type="email"
                placeholder={field.placeholder}
                value={String(current ?? '')}
                disabled={disabled}
                onChange={(_, data) => setFieldValue(field.id, data.value)}
              />
            );
          }

          if (field.type === 'url') {
            return (
              <Input
                type="url"
                placeholder={field.placeholder}
                value={String(current ?? '')}
                disabled={disabled}
                onChange={(_, data) => setFieldValue(field.id, data.value)}
              />
            );
          }

          if (field.type === 'user_lookup' || field.type === 'user_multi') {
            const selectedUsers = Array.isArray(current) ? (current as IPersonPickerItem[]) : [];
            return (
              <PeoplePickerField
                required={field.required}
                disabled={disabled}
                multi={field.type === 'user_multi'}
                value={selectedUsers}
                onChange={(nextUsers) => setFieldValue(field.id, nextUsers)}
                onSearch={handleSearchPeople}
                onResolve={handleResolvePerson}
              />
            );
          }

          return (
            <Input
              placeholder={field.placeholder}
              value={String(current ?? '')}
              disabled={disabled}
              onChange={(_, data) => setFieldValue(field.id, data.value)}
            />
          );
        })();

        return (
          <div
            key={field.id}
            className={mergeClasses(fullWidth && styles.fullWidth)}
          >
            <Field label={field.label} required={field.required && !readOnly}>
              {fieldNode}
            </Field>
          </div>
        );
      })}
    </div>
  );
};
