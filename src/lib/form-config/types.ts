export type EntityKey = 'risks' | 'business' | 'lookups' | 'projects' | 'subCategories';

export type FormMode = 'create' | 'edit' | 'view';

export type FieldRule = {
  label: string;
  type?: string;
  create: boolean;
  createRequired: boolean;
  edit: boolean;
  editRequired: boolean;
  view: boolean;
  options?: string[];
};

export type CustomFieldDefinition = {
  key: string;
  label: string;
  type:
    | 'text'
    | 'note'
    | 'number'
    | 'currency'
    | 'dropdown'
    | 'multichoice'
    | 'date'
    | 'boolean'
    | 'lookup'
    | 'lookup_multi'
    | 'user'
    | 'user_multi'
    | 'url'
    | 'email';
  required?: boolean;
  createRequired?: boolean;
  editRequired?: boolean;
  tab?: string;
  options?: string[];
  placeholder?: string;
  /** Target list for lookup custom fields. */
  lookupListTitle?: string;
  /** Lookup column to display (defaults to Title). */
  lookupField?: string;
  /** When true, date fields store date-only values. */
  dateOnly?: boolean;
  userSelectionMode?: 'PeopleOnly' | 'PeopleAndGroups';
};

export type EntityFormSettings = {
  fields: Record<string, FieldRule>;
  order?: string[];
  tabs?: Array<{ key: string; label: string; fields: string[] }>;
  tabsByMode?: {
    create?: Array<{ key: string; label: string; fields: string[] }>;
    edit?: Array<{ key: string; label: string; fields: string[] }>;
  };
  customFields?: CustomFieldDefinition[];
};

export type FormSettings = {
  risks: EntityFormSettings;
  business: EntityFormSettings;
  lookups: EntityFormSettings;
  projects: EntityFormSettings;
  subCategories: EntityFormSettings;
};

export type BuiltFieldConfig = {
  label: string;
  type?: string;
  visible: boolean;
  required: boolean;
  options?: string[];
};

export type BuiltFormConfig = {
  entity: EntityKey;
  mode: FormMode;
  fields: Record<string, BuiltFieldConfig>;
  orderedKeys: string[];
  tabs?: Array<{ key: string; label: string; fields: string[] }>;
  customFields?: Array<CustomFieldDefinition & { required: boolean }>;
};
