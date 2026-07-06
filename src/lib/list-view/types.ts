export type ListViewMode = 'table' | 'list' | 'card';

export type ListViewPreferences = {
  viewMode: ListViewMode;
  visibleColumns: string[];
};

export type ListColumnMeta = {
  key: string;
  label: string;
  defaultVisible?: boolean;
  locked?: boolean;
};
