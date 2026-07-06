import type { BuiltFormConfig } from '../form-config/types';
import type { IPersonPickerItem } from '../../models/IPersonPickerItem';
import type { ISharePointFormField, SharePointFormValues } from '../../models/ISharePointFormField';
import type { SharePointFieldValue } from '../../utils/sharePointFieldPayload';

function toDateOnlyFieldValue(value: string): string | null {
  if (!value) {
    return null;
  }
  return value;
}

function toUserMultiFieldValue(userIds: number[]): number[] {
  return userIds;
}

/** Merge Title from form values so updates persist even when field visibility config differs. */
export function applyTitleFromFormValues(
  payload: Record<string, SharePointFieldValue>,
  values: SharePointFormValues
): Record<string, SharePointFieldValue> {
  const titleFromValues = String(values.Title ?? '').trim();
  if (titleFromValues) {
    payload.Title = titleFromValues;
  }
  return payload;
}

export function buildListFormPayload(
  fields: ISharePointFormField[],
  values: SharePointFormValues,
  formConfig?: BuiltFormConfig
): Record<string, SharePointFieldValue> {
  const payload: Record<string, SharePointFieldValue> = {};

  fields.forEach((field) => {
    const config = formConfig?.fields[field.InternalName];
    if (formConfig && config && !config.visible) {
      return;
    }
    const required = config?.required || field.Required;
    const raw = values[field.InternalName];

    if (field.TypeAsString === 'Lookup') {
      const idValue = raw ? parseInt(String(raw), 10) : undefined;
      if (idValue) {
        payload[`${field.InternalName}Id`] = idValue;
      } else if (required) {
        throw new Error(`${config?.label || field.Title} is required.`);
      }
      return;
    }

    if (field.TypeAsString === 'User' || field.TypeAsString === 'UserMulti') {
      const users = Array.isArray(raw) ? (raw as IPersonPickerItem[]) : [];
      if (users.length > 0) {
        if (field.TypeAsString === 'UserMulti') {
          payload[`${field.InternalName}Id`] = toUserMultiFieldValue(users.map((user) => user.id));
        } else {
          payload[`${field.InternalName}Id`] = users[0].id;
        }
      } else if (required) {
        throw new Error(`${config?.label || field.Title} is required.`);
      }
      return;
    }

    if (raw === undefined || raw === null || raw === '') {
      if (required) {
        throw new Error(`${config?.label || field.Title} is required.`);
      }
      return;
    }

    if (field.TypeAsString === 'Boolean') {
      payload[field.InternalName] = Boolean(raw);
      return;
    }

    if (field.TypeAsString === 'Number' || field.TypeAsString === 'Currency') {
      payload[field.InternalName] = Number(raw);
      return;
    }

    if (field.TypeAsString === 'DateTime') {
      payload[field.InternalName] = toDateOnlyFieldValue(String(raw));
      return;
    }

    payload[field.InternalName] = String(raw);
  });

  return payload;
}
