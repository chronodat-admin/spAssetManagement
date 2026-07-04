import { SPHttpClient } from '@microsoft/sp-http';
import { SharePointRestService } from './SharePointRestService';
import { AUDIT_LOG_LIST_TITLE } from '../models/IListDefinitions';
import {
  IAuditLogEntry,
  IAuditLogFilters,
  IAuditLogStats,
  IWriteAuditInput
} from '../models/IAuditLog';
import {
  buildAuditTitle,
  resolveAuditEntity,
  serializeAuditDetails
} from '../utils/auditLogUtils';
import { ListProvisioningService } from './ListProvisioningService';
import { SharePointFieldValue } from '../utils/sharePointFieldPayload';

interface IAuditLogListItem {
  Id: number;
  Title: string;
  Entity?: string;
  EntityId?: string;
  Action?: string;
  UserDisplayName?: string;
  UserEmail?: string;
  Details?: string;
  Created?: string;
}

type CurrentUser = { Id: number; Title: string; Email: string; IsSiteAdmin: boolean };

export class AuditService {
  private readonly provisioning: ListProvisioningService;
  private ensureReadyPromise: Promise<void> | undefined;
  private cachedUser: CurrentUser | undefined;

  constructor(
    private readonly rest: SharePointRestService,
    private readonly getCurrentUser: () => Promise<CurrentUser>,
    spHttpClient: SPHttpClient,
    webUrl: string
  ) {
    this.provisioning = new ListProvisioningService(spHttpClient, webUrl);
  }

  public async ensureAuditLogReady(): Promise<void> {
    if (!this.ensureReadyPromise) {
      this.ensureReadyPromise = this.provisioning.ensureListFieldsReady(AUDIT_LOG_LIST_TITLE);
    }
    await this.ensureReadyPromise;
  }

  public async write(input: IWriteAuditInput): Promise<void> {
    if (input.entity === 'AuditLog' || input.entity === AUDIT_LOG_LIST_TITLE) {
      return;
    }

    try {
      await this.ensureAuditLogReady();
      const user = await this.resolveCurrentUser();
      const entityId =
        input.entityId === undefined || input.entityId === null ? '' : String(input.entityId);
      const details = serializeAuditDetails(input.details);
      const title = input.title || buildAuditTitle(input.entity, input.action, entityId || undefined);

      const fields: Record<string, SharePointFieldValue> = {
        Title: title,
        Entity: input.entity,
        EntityId: entityId,
        Action: input.action,
        UserDisplayName: user?.Title || 'System',
        UserEmail: user?.Email || ''
      };

      if (details) {
        fields.Details = details;
      }

      await this.rest.addListItem(AUDIT_LOG_LIST_TITLE, fields);
    } catch {
      // Non-blocking — audit failures must not break CRUD operations.
    }
  }

  public async getLogs(filters?: IAuditLogFilters): Promise<IAuditLogEntry[]> {
    try {
      await this.ensureAuditLogReady();
    } catch {
      return [];
    }

    const limit = Math.min(Math.max(filters?.limit ?? 200, 1), 1000);
    const filterParts: string[] = [];

    if (filters?.action) {
      filterParts.push(`Action eq '${escapeODataString(filters.action)}'`);
    }
    if (filters?.entity) {
      filterParts.push(`Entity eq '${escapeODataString(filters.entity)}'`);
    }
    if (filters?.entityId) {
      filterParts.push(`EntityId eq '${escapeODataString(filters.entityId)}'`);
    }
    if (filters?.dateFrom) {
      filterParts.push(`Created ge datetime'${filters.dateFrom}'`);
    }
    if (filters?.dateTo) {
      filterParts.push(`Created le datetime'${filters.dateTo}'`);
    }

    const items = await this.rest.getAllItems<IAuditLogListItem>(
      AUDIT_LOG_LIST_TITLE,
      'Id,Title,Entity,EntityId,Action,UserDisplayName,UserEmail,Details,Created',
      undefined,
      filterParts.length ? filterParts.join(' and ') : undefined,
      'Created desc',
      Math.min(limit, 5000),
      limit
    );

    let entries = items.map((item) => mapAuditLogItem(item));

    if (filters?.search?.trim()) {
      const query = filters.search.trim().toLowerCase();
      entries = entries.filter((entry) => {
        const haystack = [
          entry.title,
          entry.entity,
          entry.entityId,
          entry.action,
          entry.userDisplayName,
          entry.userEmail,
          entry.details
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    return entries;
  }

  public async getStats(): Promise<IAuditLogStats> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const logs = await this.getLogs({ dateFrom: since, limit: 1000 });
    const byAction: Record<string, number> = {};
    const byEntity: Record<string, number> = {};

    logs.forEach((entry) => {
      byAction[entry.action] = (byAction[entry.action] || 0) + 1;
      byEntity[entry.entity] = (byEntity[entry.entity] || 0) + 1;
    });

    return {
      total: logs.length,
      byAction,
      byEntity
    };
  }

  public resolveEntityFromListTitle(listTitle: string): string {
    return resolveAuditEntity(listTitle);
  }

  private async resolveCurrentUser(): Promise<CurrentUser | undefined> {
    if (this.cachedUser) {
      return this.cachedUser;
    }
    try {
      this.cachedUser = await this.getCurrentUser();
      return this.cachedUser;
    } catch {
      return undefined;
    }
  }
}

function mapAuditLogItem(item: IAuditLogListItem): IAuditLogEntry {
  return {
    id: item.Id,
    title: item.Title,
    entity: item.Entity || 'Unknown',
    entityId: item.EntityId || null,
    action: item.Action || 'UNKNOWN',
    userDisplayName: item.UserDisplayName || null,
    userEmail: item.UserEmail || null,
    timestamp: item.Created || new Date().toISOString(),
    details: item.Details || null
  };
}

function escapeODataString(value: string): string {
  return value.replace(/'/g, "''");
}
