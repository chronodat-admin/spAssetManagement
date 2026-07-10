export const ASSET_ROLE_CHOICES = ['Admin', 'AssetManager', 'User', 'ReadOnly'] as const;

export type AssetRoleChoice = (typeof ASSET_ROLE_CHOICES)[number];

export const PERMISSION_RESOURCES = [
  'dashboard',
  'assets',
  'assignments',
  'bookings',
  'requests',
  'software_licenses',
  'inventory',
  'maintenance',
  'scan',
  'reports',
  'depreciation',
  'audit_log',
  'lookups',
  'settings',
  'intune_sync',
  'bulk_import',
  'reminders'
] as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number];

export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'assign',
  'return',
  'bulk',
  'submit',
  'manage',
  'approve',
  'export',
  'sync',
  'import',
  'run'
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

function slug(role: string, resource: string, action: string): string {
  return `${role}-${resource}-${action}`.toLowerCase().replace(/\s+/g, '_');
}

function rule(
  role: AssetRoleChoice,
  resource: string,
  action: string,
  isAllowed = true
): Record<string, string | boolean> {
  return {
    Title: slug(role, resource, action),
    Role: role,
    Resource: resource,
    Action: action,
    IsAllowed: isAllowed
  };
}

function grants(role: AssetRoleChoice, map: Record<string, string[]>): Record<string, string | boolean>[] {
  const rows: Record<string, string | boolean>[] = [];
  for (const resource of Object.keys(map)) {
    const actions = map[resource];
    for (let i = 0; i < actions.length; i++) {
      rows.push(rule(role, resource, actions[i]));
    }
  }
  return rows;
}

/** Default RolePermissions rows — SPA UX gating; SharePoint list ACLs remain the data boundary. */
export const ROLE_PERMISSIONS_SEED_DATA: Record<string, string | boolean>[] = [
  ...grants('Admin', {
    dashboard: ['view'],
    assets: ['view', 'create', 'edit', 'delete'],
    assignments: ['view', 'assign', 'return', 'bulk'],
    bookings: ['view', 'create', 'edit'],
    requests: ['view', 'submit', 'manage', 'approve'],
    software_licenses: ['view', 'create', 'edit', 'delete'],
    inventory: ['view', 'create', 'edit', 'delete'],
    maintenance: ['view', 'create', 'edit', 'delete'],
    scan: ['view'],
    reports: ['view', 'export'],
    depreciation: ['view'],
    audit_log: ['view'],
    lookups: ['view', 'create', 'edit', 'delete'],
    settings: ['view', 'manage'],
    intune_sync: ['view', 'sync'],
    bulk_import: ['view', 'import'],
    reminders: ['view', 'run']
  }),
  ...grants('AssetManager', {
    dashboard: ['view'],
    assets: ['view', 'create', 'edit', 'delete'],
    assignments: ['view', 'assign', 'return', 'bulk'],
    bookings: ['view', 'create', 'edit'],
    requests: ['view', 'submit', 'manage', 'approve'],
    software_licenses: ['view', 'create', 'edit', 'delete'],
    inventory: ['view', 'create', 'edit', 'delete'],
    maintenance: ['view', 'create', 'edit', 'delete'],
    scan: ['view'],
    reports: ['view', 'export'],
    depreciation: ['view'],
    audit_log: ['view'],
    lookups: ['view', 'create', 'edit', 'delete'],
    intune_sync: ['view', 'sync'],
    bulk_import: ['view', 'import']
  }),
  ...grants('User', {
    dashboard: ['view'],
    assets: ['view'],
    assignments: ['view'],
    bookings: ['view', 'create'],
    requests: ['view', 'submit'],
    scan: ['view']
  }),
  ...grants('ReadOnly', {
    dashboard: ['view'],
    assets: ['view'],
    bookings: ['view'],
    requests: ['view'],
    reports: ['view']
  })
];
