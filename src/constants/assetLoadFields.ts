/** Scalar SharePoint columns loaded for asset list queries. */
export const ASSET_SCALAR_LOAD_FIELDS = [
  'AM_AssetId',
  'AM_SerialNumber',
  'AM_Barcode',
  'AM_AssignedDate',
  'AM_Cost',
  'AM_PurchaseDate',
  'AM_PONumber',
  'AM_WarrantyExpiry',
  'AM_DepreciationMethod',
  'AM_UsefulLifeMonths',
  'AM_SalvageValue',
  'AM_ResidualValue',
  'AM_Notes',
  'AM_ImageUrl',
  'AM_QRCodeData',
  'AM_IntuneDeviceId',
  'AM_Manufacturer',
  'AM_OS',
  'AM_OSVersion',
  'AM_CPU',
  'AM_TotalMemory',
  'AM_Storage',
  'AM_IMEI',
  'AM_MACAddress',
  'AM_IsDeleted',
  'AM_CustomJson'
] as const;

export const ASSET_LOOKUP_LOAD_FIELDS = [
  'AM_Status',
  'AM_Category',
  'AM_SubCategory',
  'AM_AssetType',
  'AM_ModelNumber',
  'AM_Vendor',
  'AM_Location',
  'AM_Project'
] as const;

export const ASSET_USER_LOAD_FIELDS = ['AM_AssignedTo', 'AM_DeletedBy'] as const;

export const ASSET_SYSTEM_USER_LOAD_FIELDS = ['Author', 'Editor'] as const;

/** @deprecated Use ASSET_* constants */
export const RISK_SCALAR_LOAD_FIELDS = ASSET_SCALAR_LOAD_FIELDS;
export const RISK_LOOKUP_LOAD_FIELDS = ASSET_LOOKUP_LOAD_FIELDS;
export const RISK_USER_LOAD_FIELDS = ASSET_USER_LOAD_FIELDS;
export const RISK_SYSTEM_USER_LOAD_FIELDS = ASSET_SYSTEM_USER_LOAD_FIELDS;
