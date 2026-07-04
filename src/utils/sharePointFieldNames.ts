/** SharePoint encodes spaces in auto-generated internal field names. */
export function toSharePointEncodedFieldName(displayName: string): string {
  return displayName.trim().replace(/ /g, '_x0020_');
}

export interface ISharePointFieldMeta {
  InternalName: string;
  Title: string;
  TypeAsString?: string;
  FromBaseType?: boolean;
  Sealed?: boolean;
  ReadOnlyField?: boolean;
}

/** Built-in list columns that must never be deleted by provisioning repair logic. */
const SYSTEM_FIELD_NAMES = new Set([
  'Attachments',
  'Author',
  'BaseName',
  'CheckoutUser',
  'Combine',
  'ComplianceAssetId',
  'ContentType',
  'ContentTypeId',
  'Created',
  'DocIcon',
  'Edit',
  'Editor',
  'FileDirRef',
  'FileLeafRef',
  'FolderChildCount',
  'GUID',
  'ID',
  'Id',
  'InstanceID',
  'ItemChildCount',
  'LinkFilename',
  'LinkFilenameNoMenu',
  'LinkTitle',
  'LinkTitleNoMenu',
  'MetaInfo',
  'Modified',
  'Order',
  'ParentVersion',
  'ProgId',
  'SelectTitle',
  'SortBehavior',
  'SyncClientId',
  'TaxCatchAllLabel',
  'TaxCatchAllTerm',
  'TemplateUrl',
  'Title',
  'UniqueId',
  'WorkflowInstanceID',
  'WorkflowVersion',
  '_ColorHex',
  '_ColorTag',
  '_ComplianceFlags',
  '_ComplianceTag',
  '_ComplianceTagUserId',
  '_ComplianceTagWrittenTime',
  '_IsRecord',
  '_UIVersion',
  '_UIVersionString'
]);

export function isSharePointSystemFieldName(internalName: string): boolean {
  return SYSTEM_FIELD_NAMES.has(internalName);
}

export function isCustomDeletableField(field: ISharePointFieldMeta): boolean {
  if (isSharePointSystemFieldName(field.InternalName)) {
    return false;
  }

  if (field.FromBaseType || field.Sealed || field.ReadOnlyField) {
    return false;
  }

  return true;
}

/** True when the resolved field corresponds to the display/internal name we searched for. */
export function isVerifiedFieldMatch(
  field: ISharePointFieldMeta,
  internalName: string,
  searchedName: string,
  displayName?: string
): boolean {
  if (field.InternalName === internalName) {
    return true;
  }

  if (field.InternalName === searchedName) {
    return true;
  }

  if (displayName && field.Title === displayName) {
    return true;
  }

  if (displayName && field.InternalName === toSharePointEncodedFieldName(displayName)) {
    return true;
  }

  return false;
}

/** Lookup search terms for resolving a custom field by display label. */
export function buildFieldLookupTerms(internalName: string, displayName?: string): string[] {
  const terms: string[] = [];

  if (displayName?.trim()) {
    terms.push(displayName.trim());

    const encoded = toSharePointEncodedFieldName(displayName);
    if (encoded !== displayName.trim()) {
      terms.push(encoded);
    }
  }

  if (internalName.trim()) {
    terms.push(internalName.trim());
  }

  return Array.from(new Set(terms));
}
