export interface IPersonPickerItem {
  id: number;
  title: string;
  email?: string;
  loginName?: string;
  isGroup?: boolean;
}

export interface IPersonPickerSuggestion {
  key: string;
  title: string;
  description?: string;
  entityType?: string;
  isGroup?: boolean;
}
