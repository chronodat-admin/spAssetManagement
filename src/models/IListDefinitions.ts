import { DEFAULT_APP_TITLE } from '../constants/spfxComponents';

export interface IListFieldDefinition {
  internalName: string;
  displayName: string;
  type:
    | 'Text'
    | 'Note'
    | 'Choice'
    | 'DateTime'
    | 'Lookup'
    | 'User'
    | 'UserMulti'
    | 'Boolean'
    | 'LookupMulti'
    | 'Number'
    | 'Currency';
  required?: boolean;
  choices?: string[];
  lookupListTitle?: string;
  lookupField?: string;
  format?: 'DateOnly' | 'DateTime';
  hidden?: boolean;
  defaultValue?: string;
  richText?: boolean;
  appendOnly?: boolean;
  optional?: boolean;
  userSelectionMode?: 'PeopleOnly' | 'PeopleAndGroups';
}

export interface IListDefinition {
  title: string;
  description: string;
  fields: IListFieldDefinition[];
  seedData?: Record<string, string | number | boolean>[];
  titleFieldDisplayName?: string;
}

export const ASSETS_LIST_TITLE = 'AM_Assets';
export const ASSIGNMENTS_LIST_TITLE = 'AM_Assignments';
export const SOFTWARE_LICENSES_LIST_TITLE = 'AM_SoftwareLicenses';
export const MAINTENANCE_LIST_TITLE = 'AM_Maintenance';
export const INVENTORY_LIST_TITLE = 'AM_Inventory';
export const CATEGORIES_LIST_TITLE = 'AM_Categories';
export const SUB_CATEGORIES_LIST_TITLE = 'AM_SubCategories';
export const ASSET_TYPES_LIST_TITLE = 'AM_AssetTypes';
export const ASSET_STATUSES_LIST_TITLE = 'AM_AssetStatuses';
export const VENDORS_LIST_TITLE = 'AM_Vendors';
export const MODEL_NUMBERS_LIST_TITLE = 'AM_ModelNumbers';
export const LOCATIONS_LIST_TITLE = 'AM_Locations';
export const PROJECTS_LIST_TITLE = 'AM_Projects';
export const SETTINGS_LIST_TITLE = 'AppSettings';
export const AUDIT_LOG_LIST_TITLE = 'AM_AuditLog';
export const ROLES_LIST_TITLE = 'AM_Roles';
export const USER_ROLES_LIST_TITLE = 'AM_UserRoles';
export const CUSTOM_COLUMN_DEFS_LIST_TITLE = 'AM_CustomColumnDefs';
export const ADMINISTRATORS_LIST_TITLE = 'AM_Administrators';
export const LICENSES_LIST_TITLE = 'AM_Licenses';
export const FORM_TEMPLATES_LIST_TITLE = 'AM_CustomColumnDefs';

/** Legacy compliance list titles — not provisioned in Asset Management; kept for audit log label mapping. */
export const COMPLIANCE_FRAMEWORKS_LIST_TITLE = 'AM_ComplianceFrameworks';
export const COMPLIANCE_CONTROLS_LIST_TITLE = 'AM_ComplianceControls';
export const COMPLIANCE_ASSESSMENTS_LIST_TITLE = 'AM_ComplianceAssessments';
export const COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE = 'AM_ComplianceAssessmentItems';
export const ASSET_CONTROL_LINKS_LIST_TITLE = 'AM_AssetControlLinks';
/** @deprecated Compliance migration alias */
export const RISK_CONTROL_LINKS_LIST_TITLE = ASSET_CONTROL_LINKS_LIST_TITLE;
export const RISK_CONTROL_LINK_TYPE_CHOICES = [
  'Mitigates',
  'Tests',
  'Detects',
  'Caused By',
  'Monitors'
];

/** Legacy aliases used by lookup delete references and settings. */
export const BUSINESS_LIST_TITLE = CATEGORIES_LIST_TITLE;
export const LEGACY_BUSINESS_LIST_TITLE = 'Business';

export const REQUIRED_LIST_TITLES = [
  CATEGORIES_LIST_TITLE,
  SUB_CATEGORIES_LIST_TITLE,
  ASSET_TYPES_LIST_TITLE,
  ASSET_STATUSES_LIST_TITLE,
  VENDORS_LIST_TITLE,
  MODEL_NUMBERS_LIST_TITLE,
  LOCATIONS_LIST_TITLE,
  PROJECTS_LIST_TITLE,
  ROLES_LIST_TITLE,
  USER_ROLES_LIST_TITLE,
  ADMINISTRATORS_LIST_TITLE,
  LICENSES_LIST_TITLE,
  SETTINGS_LIST_TITLE,
  ASSETS_LIST_TITLE,
  ASSIGNMENTS_LIST_TITLE,
  SOFTWARE_LICENSES_LIST_TITLE,
  MAINTENANCE_LIST_TITLE,
  INVENTORY_LIST_TITLE,
  AUDIT_LOG_LIST_TITLE,
  CUSTOM_COLUMN_DEFS_LIST_TITLE
];

const ASSET_STATUS_SEED = [
  { Title: 'Available', AM_ColorHex: '#16a34a', AM_IsAssignable: true, AM_SortOrder: 1 },
  { Title: 'Assigned', AM_ColorHex: '#0284c7', AM_IsAssignable: false, AM_SortOrder: 2 },
  { Title: 'In Repair', AM_ColorHex: '#f59e0b', AM_IsAssignable: false, AM_SortOrder: 3 },
  { Title: 'Retired', AM_ColorHex: '#64748b', AM_IsAssignable: false, AM_SortOrder: 4 },
  { Title: 'Disposed', AM_ColorHex: '#dc2626', AM_IsAssignable: false, AM_SortOrder: 5 }
];

export const ASSET_MANAGEMENT_LISTS: IListDefinition[] = [
  {
    title: CATEGORIES_LIST_TITLE,
    description: 'Asset categories',
    fields: [
      { internalName: 'AM_SortOrder', displayName: 'Sort Order', type: 'Number', optional: true },
      { internalName: 'AM_IsActive', displayName: 'Is Active', type: 'Boolean', defaultValue: '1', optional: true }
    ],
    seedData: [
      { Title: 'IT Hardware', AM_SortOrder: 1, AM_IsActive: true },
      { Title: 'Software', AM_SortOrder: 2, AM_IsActive: true },
      { Title: 'Furniture', AM_SortOrder: 3, AM_IsActive: true },
      { Title: 'Vehicles', AM_SortOrder: 4, AM_IsActive: true },
      { Title: 'Other', AM_SortOrder: 5, AM_IsActive: true }
    ]
  },
  {
    title: SUB_CATEGORIES_LIST_TITLE,
    description: 'Asset sub-categories',
    fields: [
      {
        internalName: 'AM_ParentCategory',
        displayName: 'Parent Category',
        type: 'Lookup',
        lookupListTitle: CATEGORIES_LIST_TITLE,
        lookupField: 'Title',
        required: true
      },
      { internalName: 'AM_SortOrder', displayName: 'Sort Order', type: 'Number', optional: true }
    ]
  },
  {
    title: ASSET_TYPES_LIST_TITLE,
    description: 'Asset types',
    fields: [
      { internalName: 'AM_IconName', displayName: 'Icon Name', type: 'Text', optional: true },
      { internalName: 'AM_DefaultUsefulLifeMonths', displayName: 'Default Useful Life (Months)', type: 'Number', optional: true }
    ],
    seedData: [
      { Title: 'Laptop', AM_DefaultUsefulLifeMonths: 36 },
      { Title: 'Desktop', AM_DefaultUsefulLifeMonths: 48 },
      { Title: 'Monitor', AM_DefaultUsefulLifeMonths: 60 },
      { Title: 'Phone', AM_DefaultUsefulLifeMonths: 24 },
      { Title: 'Tablet', AM_DefaultUsefulLifeMonths: 36 },
      { Title: 'Server', AM_DefaultUsefulLifeMonths: 60 },
      { Title: 'License', AM_DefaultUsefulLifeMonths: 12 },
      { Title: 'Other', AM_DefaultUsefulLifeMonths: 36 }
    ]
  },
  {
    title: ASSET_STATUSES_LIST_TITLE,
    description: 'Asset statuses',
    fields: [
      { internalName: 'AM_ColorHex', displayName: 'Color', type: 'Text', optional: true },
      { internalName: 'AM_IsAssignable', displayName: 'Is Assignable', type: 'Boolean', defaultValue: '1', optional: true },
      { internalName: 'AM_SortOrder', displayName: 'Sort Order', type: 'Number', optional: true }
    ],
    seedData: ASSET_STATUS_SEED
  },
  {
    title: VENDORS_LIST_TITLE,
    description: 'Vendors',
    fields: [
      { internalName: 'AM_ContactName', displayName: 'Contact Name', type: 'Text', optional: true },
      { internalName: 'AM_Email', displayName: 'Email', type: 'Text', optional: true },
      { internalName: 'AM_Phone', displayName: 'Phone', type: 'Text', optional: true },
      { internalName: 'AM_Website', displayName: 'Website', type: 'Text', optional: true }
    ],
    seedData: [
      { Title: 'Dell Technologies', AM_ContactName: 'Sales', AM_Email: 'sales@dell.com' },
      { Title: 'Microsoft', AM_ContactName: 'Licensing', AM_Email: 'licensing@microsoft.com' },
      { Title: 'Apple', AM_ContactName: 'Enterprise', AM_Email: 'enterprise@apple.com' }
    ]
  },
  {
    title: MODEL_NUMBERS_LIST_TITLE,
    description: 'Model numbers',
    fields: [
      {
        internalName: 'AM_Vendor',
        displayName: 'Vendor',
        type: 'Lookup',
        lookupListTitle: VENDORS_LIST_TITLE,
        lookupField: 'Title',
        optional: true
      },
      {
        internalName: 'AM_AssetType',
        displayName: 'Asset Type',
        type: 'Lookup',
        lookupListTitle: ASSET_TYPES_LIST_TITLE,
        lookupField: 'Title',
        optional: true
      }
    ]
  },
  {
    title: LOCATIONS_LIST_TITLE,
    description: 'Locations',
    fields: [
      { internalName: 'AM_Address', displayName: 'Address', type: 'Note', optional: true },
      { internalName: 'AM_Building', displayName: 'Building', type: 'Text', optional: true },
      { internalName: 'AM_Floor', displayName: 'Floor', type: 'Text', optional: true },
      { internalName: 'AM_Room', displayName: 'Room', type: 'Text', optional: true }
    ],
    seedData: [
      { Title: 'Head Office', AM_Building: 'Main', AM_Floor: '1' },
      { Title: 'Remote / Home', AM_Building: 'N/A' },
      { Title: 'Warehouse', AM_Building: 'Storage', AM_Floor: 'G' }
    ]
  },
  {
    title: PROJECTS_LIST_TITLE,
    description: 'Projects',
    fields: [
      { internalName: 'AM_Code', displayName: 'Code', type: 'Text', optional: true },
      {
        internalName: 'AM_Status',
        displayName: 'Status',
        type: 'Choice',
        choices: ['Active', 'Planning', 'Closed'],
        defaultValue: 'Active',
        optional: true
      },
      { internalName: 'AM_Owner', displayName: 'Owner', type: 'User', optional: true }
    ],
    seedData: [
      { Title: 'Office Refresh 2026', AM_Code: 'PRJ-001', AM_Status: 'Active' },
      { Title: 'Remote Worker Kit', AM_Code: 'PRJ-002', AM_Status: 'Active' },
      { Title: 'Legacy Decommission', AM_Code: 'PRJ-003', AM_Status: 'Planning' }
    ]
  },
  {
    title: ROLES_LIST_TITLE,
    description: 'Application roles',
    fields: [],
    seedData: [
      { Title: 'Admin' },
      { Title: 'AssetManager' },
      { Title: 'User' },
      { Title: 'ReadOnly' }
    ]
  },
  {
    title: USER_ROLES_LIST_TITLE,
    description: 'User role assignments',
    titleFieldDisplayName: 'Assignment',
    fields: [
      { internalName: 'AM_User', displayName: 'User', type: 'User', required: true },
      {
        internalName: 'AM_Role',
        displayName: 'Role',
        type: 'Lookup',
        lookupListTitle: ROLES_LIST_TITLE,
        lookupField: 'Title',
        required: true
      }
    ]
  },
  {
    title: CUSTOM_COLUMN_DEFS_LIST_TITLE,
    description: 'Custom column definitions',
    fields: [
      { internalName: 'AM_InternalName', displayName: 'Internal Name', type: 'Text', required: true },
      { internalName: 'AM_DisplayName', displayName: 'Display Name', type: 'Text', required: true },
      {
        internalName: 'AM_FieldType',
        displayName: 'Field Type',
        type: 'Choice',
        choices: ['Text', 'Number', 'Date', 'Choice', 'Boolean', 'User'],
        required: true
      },
      { internalName: 'AM_Choices', displayName: 'Choices', type: 'Note', optional: true },
      { internalName: 'AM_Required', displayName: 'Required', type: 'Boolean', optional: true },
      { internalName: 'AM_ShowInList', displayName: 'Show In List', type: 'Boolean', defaultValue: '1', optional: true },
      { internalName: 'AM_ShowInForm', displayName: 'Show In Form', type: 'Boolean', defaultValue: '1', optional: true },
      { internalName: 'AM_SortOrder', displayName: 'Sort Order', type: 'Number', optional: true }
    ]
  },
  {
    title: ADMINISTRATORS_LIST_TITLE,
    description: 'Application administrators',
    fields: [{ internalName: 'AM_User', displayName: 'User', type: 'User', required: true }]
  },
  {
    title: LICENSES_LIST_TITLE,
    description: 'License information (schema compatibility; subscription is API-backed)',
    fields: [
      { internalName: 'AM_TrialKey', displayName: 'TrialKey', type: 'Note', hidden: true },
      { internalName: 'AM_ActivationKey', displayName: 'ActivationKey', type: 'Note', hidden: true },
      { internalName: 'AM_IsInitialized', displayName: 'IsInitialized', type: 'Boolean' },
      { internalName: 'AM_IsValid', displayName: 'IsValid', type: 'Boolean', hidden: true },
      { internalName: 'AM_LicenseKey', displayName: 'LicenseKey', type: 'Text', optional: true }
    ]
  },
  {
    // The app reads/writes application settings from a list named "AppSettings" using flat
    // columns (see AssetService.getAppSettings/updateAppSettings and Settings.tsx). These internal
    // names must match those queries exactly, otherwise setup gets a 404 (list) or 400 (fields).
    title: SETTINGS_LIST_TITLE,
    description: 'Application settings',
    fields: [
      { internalName: 'SupportGroup', displayName: 'Support Group', type: 'Text', optional: true },
      { internalName: 'TicketIDPrefix', displayName: 'Ticket ID Prefix', type: 'Text', optional: true },
      { internalName: 'Reviewed', displayName: 'Reviewed', type: 'Text', optional: true },
      { internalName: 'SiteLogoURL', displayName: 'Site Logo URL', type: 'Note', optional: true },
      { internalName: 'ColorScheme', displayName: 'Color Scheme', type: 'Text', optional: true },
      { internalName: 'AppearanceSettings', displayName: 'Appearance Settings', type: 'Note', optional: true },
      { internalName: 'Version', displayName: 'Version', type: 'Text', optional: true },
      { internalName: 'AssetMgmtProc', displayName: 'Asset Mgmt Procedure', type: 'Note', optional: true },
      { internalName: 'DashboardName', displayName: 'Dashboard Name', type: 'Text', optional: true },
      { internalName: 'DashboardDynamicNaming', displayName: 'Dashboard Dynamic Naming', type: 'Text', optional: true },
      { internalName: 'DashboardHoverEnabled', displayName: 'Dashboard Hover Enabled', type: 'Text', optional: true },
      { internalName: 'DashboardFinExpEnabled', displayName: 'Dashboard Fin Exp Enabled', type: 'Text', optional: true },
      { internalName: 'RequestFormTabs', displayName: 'Request Form Tabs', type: 'Note', optional: true },
      { internalName: 'RequestNewFormFields', displayName: 'Request New Form Fields', type: 'Note', optional: true },
      { internalName: 'WorkflowSettings', displayName: 'Workflow Settings', type: 'Note', optional: true },
      { internalName: 'SampleDataSeeded', displayName: 'Sample Data Seeded', type: 'Text', optional: true, hidden: true },
      { internalName: 'OpenNote', displayName: 'Open Note', type: 'Text', optional: true },
      { internalName: 'OpenEmailSubject', displayName: 'Open Email Subject', type: 'Text', optional: true },
      { internalName: 'OpenEmailBody', displayName: 'Open Email Body', type: 'Note', optional: true },
      { internalName: 'IncompleteNote', displayName: 'Incomplete Note', type: 'Text', optional: true },
      { internalName: 'IncompleteEmailSubject', displayName: 'Incomplete Email Subject', type: 'Text', optional: true },
      { internalName: 'IncompleteEmailBody', displayName: 'Incomplete Email Body', type: 'Note', optional: true },
      { internalName: 'ClosedNote', displayName: 'Closed Note', type: 'Text', optional: true },
      { internalName: 'ClosedEmailSubject', displayName: 'Closed Email Subject', type: 'Text', optional: true },
      { internalName: 'ClosedEmailBody', displayName: 'Closed Email Body', type: 'Note', optional: true },
      { internalName: 'OnHoldNote', displayName: 'On Hold Note', type: 'Text', optional: true },
      { internalName: 'OnHoldEmailSubject', displayName: 'On Hold Email Subject', type: 'Text', optional: true },
      { internalName: 'OnHoldEmailBody', displayName: 'On Hold Email Body', type: 'Note', optional: true },
      { internalName: 'AssignedToNote', displayName: 'Assigned To Note', type: 'Text', optional: true },
      { internalName: 'AssignedToEmailSubject', displayName: 'Assigned To Email Subject', type: 'Text', optional: true },
      { internalName: 'AssignedToEmailBody', displayName: 'Assigned To Email Body', type: 'Note', optional: true }
    ],
    seedData: [{ Title: DEFAULT_APP_TITLE, SampleDataSeeded: 'No' }]
  },
  {
    title: ASSETS_LIST_TITLE,
    description: 'Asset register',
    titleFieldDisplayName: 'Asset Name',
    fields: [
      { internalName: 'AM_AssetId', displayName: 'Asset ID', type: 'Text', required: true },
      {
        internalName: 'AM_Category',
        displayName: 'Category',
        type: 'Lookup',
        lookupListTitle: CATEGORIES_LIST_TITLE,
        lookupField: 'Title',
        optional: true
      },
      {
        internalName: 'AM_SubCategory',
        displayName: 'Sub-Category',
        type: 'Lookup',
        lookupListTitle: SUB_CATEGORIES_LIST_TITLE,
        lookupField: 'Title',
        optional: true
      },
      {
        internalName: 'AM_AssetType',
        displayName: 'Asset Type',
        type: 'Lookup',
        lookupListTitle: ASSET_TYPES_LIST_TITLE,
        lookupField: 'Title',
        optional: true
      },
      {
        internalName: 'AM_Status',
        displayName: 'Status',
        type: 'Lookup',
        lookupListTitle: ASSET_STATUSES_LIST_TITLE,
        lookupField: 'Title',
        optional: true
      },
      { internalName: 'AM_SerialNumber', displayName: 'Serial Number', type: 'Text', optional: true },
      { internalName: 'AM_Barcode', displayName: 'Barcode', type: 'Text', optional: true },
      {
        internalName: 'AM_ModelNumber',
        displayName: 'Model Number',
        type: 'Lookup',
        lookupListTitle: MODEL_NUMBERS_LIST_TITLE,
        lookupField: 'Title',
        optional: true
      },
      {
        internalName: 'AM_Vendor',
        displayName: 'Vendor',
        type: 'Lookup',
        lookupListTitle: VENDORS_LIST_TITLE,
        lookupField: 'Title',
        optional: true
      },
      {
        internalName: 'AM_Location',
        displayName: 'Location',
        type: 'Lookup',
        lookupListTitle: LOCATIONS_LIST_TITLE,
        lookupField: 'Title',
        optional: true
      },
      {
        internalName: 'AM_Project',
        displayName: 'Project',
        type: 'Lookup',
        lookupListTitle: PROJECTS_LIST_TITLE,
        lookupField: 'Title',
        optional: true
      },
      { internalName: 'AM_AssignedTo', displayName: 'Assigned To', type: 'User', optional: true },
      { internalName: 'AM_AssignedDate', displayName: 'Assigned Date', type: 'DateTime', format: 'DateOnly', optional: true },
      { internalName: 'AM_Cost', displayName: 'Cost', type: 'Currency', optional: true },
      { internalName: 'AM_PurchaseDate', displayName: 'Purchase Date', type: 'DateTime', format: 'DateOnly', optional: true },
      { internalName: 'AM_PONumber', displayName: 'PO Number', type: 'Text', optional: true },
      { internalName: 'AM_WarrantyExpiry', displayName: 'Warranty Expiry', type: 'DateTime', format: 'DateOnly', optional: true },
      {
        internalName: 'AM_DepreciationMethod',
        displayName: 'Depreciation Method',
        type: 'Choice',
        choices: ['StraightLine', 'DecliningBalance'],
        optional: true
      },
      { internalName: 'AM_UsefulLifeMonths', displayName: 'Useful Life (Months)', type: 'Number', optional: true },
      { internalName: 'AM_SalvageValue', displayName: 'Salvage Value', type: 'Currency', optional: true },
      { internalName: 'AM_ResidualValue', displayName: 'Residual Value', type: 'Currency', optional: true },
      { internalName: 'AM_Notes', displayName: 'Notes', type: 'Note', optional: true },
      { internalName: 'AM_ImageUrl', displayName: 'Image URL', type: 'Text', optional: true },
      { internalName: 'AM_QRCodeData', displayName: 'QR Code Data', type: 'Text', optional: true },
      { internalName: 'AM_IntuneDeviceId', displayName: 'Intune Device ID', type: 'Text', optional: true },
      { internalName: 'AM_Manufacturer', displayName: 'Manufacturer', type: 'Text', optional: true },
      { internalName: 'AM_OS', displayName: 'OS', type: 'Text', optional: true },
      { internalName: 'AM_OSVersion', displayName: 'OS Version', type: 'Text', optional: true },
      { internalName: 'AM_CPU', displayName: 'CPU', type: 'Text', optional: true },
      { internalName: 'AM_TotalMemory', displayName: 'Total Memory', type: 'Text', optional: true },
      { internalName: 'AM_Storage', displayName: 'Storage', type: 'Text', optional: true },
      { internalName: 'AM_IMEI', displayName: 'IMEI', type: 'Text', optional: true },
      { internalName: 'AM_MACAddress', displayName: 'MAC Address', type: 'Text', optional: true },
      { internalName: 'AM_IsDeleted', displayName: 'Is Deleted', type: 'Boolean', defaultValue: '0', optional: true },
      { internalName: 'AM_DeletedDate', displayName: 'Deleted Date', type: 'DateTime', optional: true },
      { internalName: 'AM_DeletedBy', displayName: 'Deleted By', type: 'User', optional: true },
      { internalName: 'AM_CustomJson', displayName: 'Custom JSON', type: 'Note', hidden: true, optional: true }
    ]
  },
  {
    title: ASSIGNMENTS_LIST_TITLE,
    description: 'Assignment transaction log',
    fields: [
      {
        internalName: 'AM_Asset',
        displayName: 'Asset',
        type: 'Lookup',
        lookupListTitle: ASSETS_LIST_TITLE,
        lookupField: 'Title',
        required: true
      },
      {
        internalName: 'AM_Action',
        displayName: 'Action',
        type: 'Choice',
        choices: ['Assign', 'Return', 'Book', 'CancelBook'],
        required: true
      },
      { internalName: 'AM_AssignedTo', displayName: 'Assigned To', type: 'User', optional: true },
      { internalName: 'AM_AssignedBy', displayName: 'Assigned By', type: 'User', optional: true },
      { internalName: 'AM_AssignmentDate', displayName: 'Assignment Date', type: 'DateTime', required: true },
      { internalName: 'AM_ExpectedReturnDate', displayName: 'Expected Return', type: 'DateTime', format: 'DateOnly', optional: true },
      { internalName: 'AM_ActualReturnDate', displayName: 'Actual Return', type: 'DateTime', format: 'DateOnly', optional: true },
      { internalName: 'AM_Notes', displayName: 'Notes', type: 'Note', optional: true },
      { internalName: 'AM_AcknowledgementSent', displayName: 'Acknowledgement Sent', type: 'Boolean', optional: true },
      { internalName: 'AM_AcknowledgementPdfUrl', displayName: 'Acknowledgement PDF URL', type: 'Text', optional: true }
    ]
  },
  {
    title: SOFTWARE_LICENSES_LIST_TITLE,
    description: 'Software license pool',
    fields: [
      { internalName: 'AM_ProductName', displayName: 'Product Name', type: 'Text', required: true },
      { internalName: 'AM_LicenseKey', displayName: 'License Key', type: 'Text', optional: true },
      {
        internalName: 'AM_Vendor',
        displayName: 'Vendor',
        type: 'Lookup',
        lookupListTitle: VENDORS_LIST_TITLE,
        lookupField: 'Title',
        optional: true
      },
      { internalName: 'AM_TotalSeats', displayName: 'Total Seats', type: 'Number', required: true },
      { internalName: 'AM_UsedSeats', displayName: 'Used Seats', type: 'Number', optional: true },
      { internalName: 'AM_AvailableSeats', displayName: 'Available Seats', type: 'Number', optional: true },
      { internalName: 'AM_ExpiryDate', displayName: 'Expiry Date', type: 'DateTime', format: 'DateOnly', optional: true },
      { internalName: 'AM_Cost', displayName: 'Cost', type: 'Currency', optional: true },
      { internalName: 'AM_Notes', displayName: 'Notes', type: 'Note', optional: true },
      { internalName: 'AM_IsActive', displayName: 'Is Active', type: 'Boolean', defaultValue: '1', optional: true }
    ]
  },
  {
    title: MAINTENANCE_LIST_TITLE,
    description: 'Maintenance records',
    fields: [
      {
        internalName: 'AM_Asset',
        displayName: 'Asset',
        type: 'Lookup',
        lookupListTitle: ASSETS_LIST_TITLE,
        lookupField: 'Title',
        required: true
      },
      {
        internalName: 'AM_Type',
        displayName: 'Type',
        type: 'Choice',
        choices: ['Preventive', 'Corrective', 'Inspection'],
        optional: true
      },
      { internalName: 'AM_ScheduledDate', displayName: 'Scheduled Date', type: 'DateTime', format: 'DateOnly', optional: true },
      { internalName: 'AM_CompletedDate', displayName: 'Completed Date', type: 'DateTime', format: 'DateOnly', optional: true },
      { internalName: 'AM_Technician', displayName: 'Technician', type: 'User', optional: true },
      { internalName: 'AM_Cost', displayName: 'Cost', type: 'Currency', optional: true },
      { internalName: 'AM_Notes', displayName: 'Notes', type: 'Note', optional: true }
    ]
  },
  {
    title: INVENTORY_LIST_TITLE,
    description: 'Physical inventory scans',
    fields: [
      {
        internalName: 'AM_Location',
        displayName: 'Location',
        type: 'Lookup',
        lookupListTitle: LOCATIONS_LIST_TITLE,
        lookupField: 'Title',
        optional: true
      },
      { internalName: 'AM_ScanDate', displayName: 'Scan Date', type: 'DateTime', optional: true },
      { internalName: 'AM_ScannedBy', displayName: 'Scanned By', type: 'User', optional: true },
      {
        internalName: 'AM_Asset',
        displayName: 'Asset',
        type: 'Lookup',
        lookupListTitle: ASSETS_LIST_TITLE,
        lookupField: 'Title',
        optional: true
      },
      { internalName: 'AM_Found', displayName: 'Found', type: 'Boolean', optional: true },
      { internalName: 'AM_VarianceNotes', displayName: 'Variance Notes', type: 'Note', optional: true }
    ]
  },
  {
    // The audit trail is written/read by AuditService using flat, self-describing columns
    // (Entity/EntityId/Action + a serialized Details blob and denormalized user display fields).
    // These internal names must match AuditService.write/getLogs exactly; the built-in Created
    // column supplies the timestamp.
    title: AUDIT_LOG_LIST_TITLE,
    description: 'Append-only audit trail',
    titleFieldDisplayName: 'Summary',
    fields: [
      { internalName: 'Entity', displayName: 'Entity', type: 'Text', optional: true },
      { internalName: 'EntityId', displayName: 'Entity ID', type: 'Text', optional: true },
      { internalName: 'Action', displayName: 'Action', type: 'Text', optional: true },
      { internalName: 'UserDisplayName', displayName: 'User', type: 'Text', optional: true },
      { internalName: 'UserEmail', displayName: 'User Email', type: 'Text', optional: true },
      { internalName: 'Details', displayName: 'Details', type: 'Note', optional: true }
    ]
  }
];

export const APP_MANAGED_LIST_TITLES = ASSET_MANAGEMENT_LISTS.map((list) => list.title);
/** @deprecated Compliance migration alias */
export const RISK_MANAGEMENT_LISTS = ASSET_MANAGEMENT_LISTS;
