export type AppPage =
  | 'dashboard'
  | 'allAssets'
  | 'assignedToMe'
  | 'available'
  | 'inRepair'
  | 'retired'
  | 'deletedAssets'
  | 'assignAsset'
  | 'returnAsset'
  | 'bulkAssign'
  | 'bulkReturn'
  | 'bookAsset'
  | 'bookingDetails'
  | 'software'
  | 'inventory'
  | 'maintenance'
  | 'requestAsset'
  | 'myRequests'
  | 'manageRequests'
  | 'scanAsset'
  | 'reports'
  | 'depreciation'
  | 'auditLog'
  | 'categories'
  | 'subCategories'
  | 'vendors'
  | 'locations'
  | 'projects'
  | 'settings';

export type {
  IAppSettings,
  ILookupItem,
  ILookupValue,
  IUserValue,
  IAsset,
  IAssignment,
  ISoftwareLicense,
  IInventoryItem,
  IAssetRequest,
  IAppAdministrator,
  IProvisioningStep,
  IProvisioningStatus,
  IClearSeedDataResult,
  IHeatmapDrillDownFilter,
  AssetStatus
} from './IAsset';

/** @deprecated Use AssetStatus */
export type RiskStatus = import('./IAsset').AssetStatus;
