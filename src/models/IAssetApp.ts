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
  | 'bookAsset'
  | 'bookingDetails'
  | 'software'
  | 'inventory'
  | 'reports'
  | 'depreciation'
  | 'auditLog'
  | 'categories'
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
  IAppAdministrator,
  IProvisioningStep,
  IProvisioningStatus,
  IClearSeedDataResult,
  IHeatmapDrillDownFilter,
  AssetStatus
} from './IAsset';

/** @deprecated Use AssetStatus */
export type RiskStatus = import('./IAsset').AssetStatus;
