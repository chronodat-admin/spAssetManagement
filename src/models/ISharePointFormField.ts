import { IPersonPickerItem } from './IPersonPickerItem';

export interface ISharePointFormField {
  InternalName: string;
  Title: string;
  TypeAsString: string;
  Required: boolean;
  ReadOnlyField: boolean;
  Hidden: boolean;
  Choices?: string[];
  LookupListId?: string;
  LookupField?: string;
  LookupListTitle?: string;
  Format?: string;
}

export type SharePointFormFieldValue =
  | string
  | number
  | boolean
  | IPersonPickerItem[]
  | undefined;

export type SharePointFormValues = Record<string, SharePointFormFieldValue>;
