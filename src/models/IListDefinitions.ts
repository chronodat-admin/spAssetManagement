/** Minimal list title constants — full AM_* schemas in IListDefinitions (task 12+). */
export const BUSINESS_LIST_TITLE = 'AM_Categories';
export const SUB_CATEGORIES_LIST_TITLE = 'AM_SubCategories';
export const PROJECTS_LIST_TITLE = 'AM_Projects';
export const FORM_TEMPLATES_LIST_TITLE = 'AM_CustomColumnDefs';

export interface IListFieldDefinition {
  internalName: string;
  displayName: string;
  type: string;
  required?: boolean;
}

export interface IListDefinition {
  title: string;
  fields: IListFieldDefinition[];
}
