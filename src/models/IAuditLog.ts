export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SETTINGS_UPDATE';

export interface IAuditLogEntry {
  id: number;
  title: string;
  entity: string;
  entityId: string | null;
  action: AuditAction | string;
  userDisplayName: string | null;
  userEmail: string | null;
  timestamp: string;
  details: string | null;
}

export interface IWriteAuditInput {
  entity: string;
  action: AuditAction | string;
  entityId?: string | number | null;
  details?: string | Record<string, unknown> | null;
  title?: string;
}

export interface IAuditLogFilters {
  action?: string;
  entity?: string;
  entityId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface IAuditLogStats {
  total: number;
  byAction: Record<string, number>;
  byEntity: Record<string, number>;
}
