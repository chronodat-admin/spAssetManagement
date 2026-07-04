export type AppPage =
  | 'dashboard'
  | 'allAssets'
  | 'assignedToMe'
  | 'available'
  | 'inRepair'
  | 'retired'
  | 'deletedAssets'
  | 'assignAsset'
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

export interface IProvisioningStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  message?: string;
}

export interface IProvisioningStatus {
  complete: boolean;
  steps: IProvisioningStep[];
}

export interface IAppSettings {
  Id?: number;
  Title?: string;
  SupportGroup?: string;
  ColorScheme?: string;
  DashboardName?: string;
  DashboardDynamicNaming?: string;
  DashboardHoverEnabled?: string;
  DashboardFinExpEnabled?: string;
  AppearanceSettings?: string;
  DashboardSettings?: string;
  SampleDataSeeded?: string;
}

export interface ILookupItem {
  id: number;
  title: string;
}

export interface ILookupValue {
  Id: number;
  Title: string;
}

export interface IUserValue {
  Id: number;
  Title: string;
  Email?: string;
}
