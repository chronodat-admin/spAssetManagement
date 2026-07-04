/** SharePoint stores the display name from custom status configuration. */
export type AssetStatus = string;

export interface ILookupValue {
  Id: number;
  Title: string;
}

export interface IUserValue {
  Id: number;
  Title: string;
  Email?: string;
}

export interface IAppAdministrator {
  Id: number;
  Title: string;
  AM_User?: IUserValue;
  /** @deprecated Use AM_User — retained for Settings migration compatibility. */
  UserName1?: IUserValue;
}

/** Primary asset register item (AM_Assets list). */
export interface IAsset {
  Id: number;
  Title: string;
  AM_AssetId?: string;
  AM_Category?: ILookupValue;
  AM_SubCategory?: ILookupValue;
  AM_AssetType?: ILookupValue;
  AM_Status?: AssetStatus | ILookupValue;
  AM_SerialNumber?: string;
  AM_Barcode?: string;
  AM_ModelNumber?: ILookupValue;
  AM_Vendor?: ILookupValue;
  AM_Location?: ILookupValue;
  AM_Project?: ILookupValue;
  AM_AssignedTo?: IUserValue;
  AM_AssignedDate?: string;
  AM_Cost?: number;
  AM_PurchaseDate?: string;
  AM_PONumber?: string;
  AM_WarrantyExpiry?: string;
  AM_DepreciationMethod?: 'StraightLine' | 'DecliningBalance';
  AM_UsefulLifeMonths?: number;
  AM_SalvageValue?: number;
  AM_ResidualValue?: number;
  AM_Notes?: string;
  AM_ImageUrl?: string;
  AM_QRCodeData?: string;
  AM_IntuneDeviceId?: string;
  AM_Manufacturer?: string;
  AM_OS?: string;
  AM_OSVersion?: string;
  AM_CPU?: string;
  AM_TotalMemory?: string;
  AM_Storage?: string;
  AM_IMEI?: string;
  AM_MACAddress?: string;
  AM_IsDeleted?: boolean;
  AM_DeletedDate?: string;
  AM_DeletedBy?: IUserValue;
  AM_CustomJson?: string;
  Created?: string;
  Modified?: string;
  Author?: IUserValue;
  /** Legacy risk-register fields retained for Dashboard/Settings migration compatibility. */
  Riskstatus?: AssetStatus;
  RiskDescription?: string;
  AssignedTo?: IUserValue[];
  RiskComment?: string;
  RiskID?: string;
  RiskDueDate?: string;
  MitigationPlan?: string;
  RiskResponse?: ILookupValue;
  RiskStrategy?: ILookupValue;
  RiskProfileType?: ILookupValue;
  Likelihood?: string;
  Consequence?: string;
  PotentialLikelihood?: string;
  PotentialConsequence?: string;
  potentialcost?: string;
  Assesstheeffectivenessofcontrols?: string;
  Implementationreviewdate?: string;
  DateRiskIdentified?: string;
  RiskCategory?: ILookupValue;
  RiskSubCategory?: ILookupValue;
  riskBusiness?: ILookupValue;
  RiskProject?: ILookupValue;
  ProjectName?: string;
  Causes?: string;
  RiskConsequences?: string;
  ExistingControls?: string;
  TemplateData?: string;
}

export interface IAssignment {
  Id: number;
  Title: string;
  AM_Asset?: ILookupValue;
  AM_Action?: 'Assign' | 'Return' | 'Book' | 'CancelBook';
  AM_AssignedTo?: IUserValue;
  AM_AssignedBy?: IUserValue;
  AM_AssignmentDate?: string;
  AM_ExpectedReturnDate?: string;
  AM_ActualReturnDate?: string;
  AM_Notes?: string;
  AM_AcknowledgementSent?: boolean;
  AM_AcknowledgementPdfUrl?: string;
}

export interface ISoftwareLicense {
  Id: number;
  Title: string;
  AM_ProductName?: string;
  AM_LicenseKey?: string;
  AM_Vendor?: ILookupValue;
  AM_TotalSeats?: number;
  AM_UsedSeats?: number;
  AM_AvailableSeats?: number;
  AM_ExpiryDate?: string;
  AM_Cost?: number;
  AM_Notes?: string;
  AM_IsActive?: boolean;
}

export interface IMaintenanceRecord {
  Id: number;
  Title: string;
  AM_Asset?: ILookupValue;
  AM_Type?: 'Preventive' | 'Corrective' | 'Inspection';
  AM_ScheduledDate?: string;
  AM_CompletedDate?: string;
  AM_Technician?: IUserValue;
  AM_Cost?: number;
  AM_Notes?: string;
}

export interface IInventoryItem {
  Id: number;
  Title: string;
  AM_Location?: ILookupValue;
  AM_ScanDate?: string;
  AM_ScannedBy?: IUserValue;
  AM_Asset?: ILookupValue;
  AM_Found?: boolean;
  AM_VarianceNotes?: string;
}

export interface IAuditLogEntry {
  Id: number;
  Title: string;
  AM_EntityType?: string;
  AM_EntityId?: string;
  AM_Action?: string;
  AM_FieldName?: string;
  AM_OldValue?: string;
  AM_NewValue?: string;
  AM_User?: IUserValue;
  AM_Timestamp?: string;
  AM_IpAddress?: string;
}

export interface ICustomColumnDef {
  Id: number;
  Title: string;
  AM_InternalName?: string;
  AM_DisplayName?: string;
  AM_FieldType?: 'Text' | 'Number' | 'Date' | 'Choice' | 'Boolean' | 'User';
  AM_Choices?: string;
  AM_Required?: boolean;
  AM_ShowInList?: boolean;
  AM_ShowInForm?: boolean;
  AM_SortOrder?: number;
}

export interface ILookupItem {
  Id: number;
  Title: string;
  AM_SortOrder?: number;
  AM_IsActive?: boolean;
  AM_ParentCategory?: ILookupValue;
  AM_ParentCategoryId?: number;
  ParentCategoryId?: number;
  ParentCategory?: ILookupValue;
  AM_ColorHex?: string;
  AM_IsAssignable?: boolean;
  AM_IconName?: string;
  AM_DefaultUsefulLifeMonths?: number;
  AM_ContactName?: string;
  AM_Email?: string;
  AM_Phone?: string;
  AM_Website?: string;
  AM_Vendor?: ILookupValue;
  AM_AssetType?: ILookupValue;
  AM_Address?: string;
  AM_Building?: string;
  AM_Floor?: string;
  AM_Room?: string;
  AM_Code?: string;
  AM_Status?: string;
  AM_Owner?: IUserValue;
  Code?: string;
  BusinessCode?: string;
  Description?: string;
  /** Legacy risk / report-builder lookup fields (optional). */
  BusinessId?: number | string;
  Rating?: string;
  Industry?: string;
  GeographicRegion?: string;
  BusinessCriticality?: string;
  Owner?: IUserValue;
  Business?: ILookupValue;
  ProjectStatus?: string;
  Priority?: string;
  ProjectType?: string;
  ProjectManager?: IUserValue;
}

export interface IRole {
  Id: number;
  Title: string;
}

export interface IUserRole {
  Id: number;
  Title: string;
  AM_User?: IUserValue;
  AM_Role?: ILookupValue;
}

export interface INumberingSettings {
  prefix?: string;
  nextSequence?: number;
  padLength?: number;
}

export interface IDashboardSettings {
  name?: string;
  dynamicNaming?: boolean;
  hoverEnabled?: boolean;
  financialExposureEnabled?: boolean;
}

export interface IEmailIntegrationSettings {
  deliveryMode?: 'graph' | 'powerAutomate' | 'both';
  powerAutomateWebhookUrl?: string;
}

export interface IFormFieldVisibility {
  [entity: string]: {
    fields: Record<string, { create?: boolean; edit?: boolean; view?: boolean }>;
  };
}

export interface IIntuneDeviceMapping {
  deviceId: string;
  assetId?: number;
  serialNumber?: string;
}

export interface IEmailNotificationSettings {
  OpenNote?: string;
  OpenEmailSubject?: string;
  OpenEmailBody?: string;
  IncompleteNote?: string;
  IncompleteEmailSubject?: string;
  IncompleteEmailBody?: string;
  ClosedNote?: string;
  ClosedEmailSubject?: string;
  ClosedEmailBody?: string;
  OnHoldNote?: string;
  OnHoldEmailSubject?: string;
  OnHoldEmailBody?: string;
  AssignedToNote?: string;
  AssignedToEmailSubject?: string;
  AssignedToEmailBody?: string;
}

export interface IAppSettings extends IEmailNotificationSettings {
  Id: number;
  Title: string;
  AM_SupportEmail?: string;
  AM_DefaultCurrency?: string;
  SupportGroup?: string;
  TicketIDPrefix?: string;
  Reviewed?: string;
  SiteLogoURL?: string;
  ColorScheme?: string;
  Version?: string;
  AssetMgmtProc?: string;
  DashboardName?: string;
  DashboardDynamicNaming?: string;
  DashboardHoverEnabled?: string;
  DashboardFinExpEnabled?: string;
  RequestFormTabs?: string;
  RequestNewFormFields?: string;
  WorkflowSettings?: string;
  AppearanceSettings?: string;
  AM_AppearanceSettings?: string;
  AM_DashboardSettings?: string;
  AM_NumberingSettings?: string;
  AM_EmailIntegrationSettings?: string;
  AM_WorkflowSettings?: string;
  AM_FormFieldVisibility?: string;
  AM_FeatureFlags?: string;
  AM_IntuneSyncSettings?: string;
  AM_PowerAutomateWebhookUrl?: string;
  SampleDataSeeded?: string;
  AM_SampleDataSeeded?: string;
}

export interface IAssetManagementContext {
  webUrl: string;
  currentUserId: number;
  currentUserName: string;
  currentUserEmail: string;
  isSiteAdmin: boolean;
}

export interface IProvisioningStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error' | 'complete';
  /** Persistent one-line explanation of what this step does (shown under the label). */
  description?: string;
  /** Transient progress detail, e.g. the list currently being created. */
  message?: string;
}

export interface IProvisioningListStatus {
  title: string;
  exists: boolean;
  ready: boolean;
}

export interface IProvisioningStatus {
  isComplete: boolean;
  missingCount: number;
  existingCount: number;
  totalCount: number;
  lists: IProvisioningListStatus[];
  missingLists: string[];
  complete?: boolean;
  steps?: IProvisioningStep[];
}

export interface IClearSeedDataFailure {
  listTitle: string;
  itemId: number;
  title: string;
  error: string;
}

export interface IClearSeedDataResult {
  deleted: Record<string, number>;
  failed: IClearSeedDataFailure[];
  totalDeleted: number;
}

export interface IHeatmapDrillDownFilter {
  variant: 'inherent' | 'residual';
  likelihoodIdx: number;
  consequenceIdx: number;
  priority: string;
}
