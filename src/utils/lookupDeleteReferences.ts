import {
  PROJECTS_LIST_TITLE,
  SUB_CATEGORIES_LIST_TITLE
} from '../models/IListDefinitions.js';

export interface ILookupReferenceDefinition {
  listTitle: string;
  displayLabel: string;
  lookupIdField: string;
}

export interface ILookupChoiceReferenceDefinition {
  listTitle: string;
  displayLabel: string;
  choiceFields: string[];
}

export interface ILookupDeleteReference {
  listTitle: string;
  displayLabel: string;
  count: number;
}

const ASSETS_LIST_TITLE = 'AM_Assets';

/** Maps lookup list titles to lists/fields that reference them by lookup ID. */
export const LOOKUP_DELETE_REFERENCE_MAP: Record<string, ILookupReferenceDefinition[]> = {
  AM_Categories: [
    { listTitle: ASSETS_LIST_TITLE, displayLabel: 'Assets', lookupIdField: 'AM_CategoryId' },
    {
      listTitle: SUB_CATEGORIES_LIST_TITLE,
      displayLabel: 'Sub-Categories',
      lookupIdField: 'AM_ParentCategoryId'
    }
  ],
  [SUB_CATEGORIES_LIST_TITLE]: [
    { listTitle: ASSETS_LIST_TITLE, displayLabel: 'Assets', lookupIdField: 'AM_SubCategoryId' }
  ],
  AM_Vendors: [
    { listTitle: ASSETS_LIST_TITLE, displayLabel: 'Assets', lookupIdField: 'AM_VendorId' }
  ],
  AM_Locations: [
    { listTitle: ASSETS_LIST_TITLE, displayLabel: 'Assets', lookupIdField: 'AM_LocationId' }
  ],
  [PROJECTS_LIST_TITLE]: [
    { listTitle: ASSETS_LIST_TITLE, displayLabel: 'Assets', lookupIdField: 'AM_ProjectId' }
  ]
};

export const LOOKUP_DELETE_CHOICE_REFERENCE_MAP: Record<
  string,
  ILookupChoiceReferenceDefinition[]
> = {};

export function getLookupReferenceDefinitions(listTitle: string): ILookupReferenceDefinition[] {
  return LOOKUP_DELETE_REFERENCE_MAP[listTitle] ?? [];
}

export function getLookupChoiceReferenceDefinitions(
  listTitle: string
): ILookupChoiceReferenceDefinition[] {
  return LOOKUP_DELETE_CHOICE_REFERENCE_MAP[listTitle] ?? [];
}

export function escapeODataStringValue(value: string): string {
  return value.replace(/'/g, "''");
}

export function buildLookupIdFilter(lookupIdField: string, ids: number[]): string {
  const uniqueIds = [...new Set(ids.filter((id) => id > 0))];
  if (uniqueIds.length === 0) {
    return 'Id eq -1';
  }
  if (uniqueIds.length === 1) {
    return `${lookupIdField} eq ${uniqueIds[0]}`;
  }
  return uniqueIds.map((id) => `${lookupIdField} eq ${id}`).join(' or ');
}

export function buildChoiceFieldFilter(titles: string[], choiceFields: string[]): string {
  const uniqueTitles = [...new Set(titles.map((title) => title.trim()).filter(Boolean))];
  if (uniqueTitles.length === 0 || choiceFields.length === 0) {
    return 'Id eq -1';
  }

  const clauses: string[] = [];
  for (const field of choiceFields) {
    for (const title of uniqueTitles) {
      clauses.push(`${field} eq '${escapeODataStringValue(title)}'`);
    }
  }
  return clauses.join(' or ');
}

export function buildLookupDeleteMessage(
  itemLabel: string,
  references: ILookupDeleteReference[]
): string {
  const referenced = references.filter((entry) => entry.count > 0);
  if (referenced.length === 0) {
    return `Delete ${itemLabel}? This value is not referenced elsewhere.`;
  }

  const total = referenced.reduce((sum, entry) => sum + entry.count, 0);
  return (
    `Delete ${itemLabel}? ${total} record${total === 1 ? '' : 's'} across other lists ` +
    `still reference this value. Update those records first, or confirm to attempt deletion.`
  );
}
