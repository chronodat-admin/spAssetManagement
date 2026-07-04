export type SharePointFieldValue =
  | string
  | number
  | boolean
  | null
  | number[]
  | string[];

export function toDateOnlyFieldValue(value: string): string | null {
  if (!value) {
    return null;
  }
  return value;
}

// SharePoint REST requests in this service use `odata=nometadata`, which expects
// multi-value fields (UserMulti, LookupMulti, MultiChoice) as plain JSON arrays.
// The verbose `{ results: [...] }` envelope is only valid with `odata=verbose` and
// triggers an "An unexpected 'StartObject' node was found ... A 'StartArray' node was
// expected" error otherwise.
export function toUserMultiFieldValue(userIds: number[]): number[] {
  return userIds;
}

export function buildRiskItemPayload(
  fields: Record<string, SharePointFieldValue | undefined>
): Record<string, SharePointFieldValue> {
  const payload: Record<string, SharePointFieldValue> = {};

  Object.keys(fields).forEach((key) => {
    const value = fields[key];
    if (value !== undefined) {
      payload[key] = value;
    }
  });

  return payload;
}
