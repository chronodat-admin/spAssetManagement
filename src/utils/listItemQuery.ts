import type { IListFieldDefinition } from '../models/IListDefinitions';

export interface ListItemQuery {
  select: string;
  expand?: string;
}

/** Build OData $select / $expand for list rows from provisioning field metadata. */
export function buildListItemQuery(fields: IListFieldDefinition[]): ListItemQuery {
  const selectParts: string[] = ['Id', 'Title'];
  const expandSet = new Set<string>();

  for (const field of fields) {
    if (field.type === 'User' || field.type === 'UserMulti') {
      expandSet.add(field.internalName);
      selectParts.push(`${field.internalName}/Id`, `${field.internalName}/Title`);
      // EMail projection is only valid on single-value person fields. Expanding a
      // multi-value (UserMulti) field and selecting /EMail returns HTTP 400 on
      // SharePoint, so only request it for single-value User fields.
      if (field.type === 'User') {
        selectParts.push(`${field.internalName}/EMail`);
      }
      continue;
    }

    if (field.type === 'Lookup' || field.type === 'LookupMulti') {
      expandSet.add(field.internalName);
      selectParts.push(`${field.internalName}/Id`, `${field.internalName}/Title`);
      continue;
    }

    selectParts.push(field.internalName);
  }

  const expand = expandSet.size > 0 ? Array.from(expandSet).join(',') : undefined;
  return { select: selectParts.join(','), expand };
}

export function parseSelectFieldBases(select: string): Set<string> {
  const result = new Set<string>();
  for (const part of select.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    result.add(trimmed.split('/')[0]);
  }
  return result;
}

/** Returns internal names (or expand reasons) missing from a list item query. */
export function findMissingListItemQueryFields(
  select: string,
  expand: string | undefined,
  fields: IListFieldDefinition[]
): string[] {
  const selectBases = parseSelectFieldBases(select);
  const expandFields = new Set(
    (expand || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );
  const missing: string[] = [];

  for (const field of fields) {
    if (
      field.type === 'Lookup' ||
      field.type === 'LookupMulti' ||
      field.type === 'User' ||
      field.type === 'UserMulti'
    ) {
      if (!expandFields.has(field.internalName)) {
        missing.push(`${field.internalName} ($expand)`);
      }
      if (
        !select.includes(`${field.internalName}/Id`) ||
        !select.includes(`${field.internalName}/Title`)
      ) {
        missing.push(`${field.internalName} (expanded $select)`);
      }
      continue;
    }

    if (!selectBases.has(field.internalName)) {
      missing.push(field.internalName);
    }
  }

  return missing;
}
