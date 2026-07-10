import { SPHttpClient } from '@microsoft/sp-http';
import { IMaintenanceRecord } from '../models/IAsset';
import { MAINTENANCE_LIST_TITLE } from '../models/IListDefinitions';
import { SharePointFieldValue } from '../utils/sharePointFieldPayload';
import { SharePointRestService } from './SharePointRestService';

export interface IMaintenanceRecordInput {
  Title: string;
  AM_AssetId?: number | null;
  AM_Type?: IMaintenanceRecord['AM_Type'] | '';
  AM_ScheduledDate?: string;
  AM_CompletedDate?: string;
  AM_TechnicianId?: number | null;
  AM_Cost?: number | null;
  AM_Notes?: string;
}

export class MaintenanceService {
  private readonly rest: SharePointRestService;

  public constructor(spHttpClient: SPHttpClient, webUrl: string) {
    this.rest = new SharePointRestService(spHttpClient, webUrl);
  }

  public async getRecords(): Promise<IMaintenanceRecord[]> {
    return this.rest.getAllItems<IMaintenanceRecord>(
      MAINTENANCE_LIST_TITLE,
      'Id,Title,AM_Type,AM_ScheduledDate,AM_CompletedDate,AM_Cost,AM_Notes,AM_Asset/Title,AM_Technician/Title,AM_Technician/EMail',
      'AM_Asset,AM_Technician',
      undefined,
      'AM_ScheduledDate desc'
    );
  }

  public async createRecord(input: IMaintenanceRecordInput): Promise<number> {
    return this.rest.addListItem(MAINTENANCE_LIST_TITLE, this.toPayload(input));
  }

  public async updateRecord(id: number, input: Partial<IMaintenanceRecordInput>): Promise<void> {
    await this.rest.updateItem(MAINTENANCE_LIST_TITLE, id, this.toPayload(input));
  }

  public async deleteRecord(id: number): Promise<void> {
    await this.rest.deleteItem(MAINTENANCE_LIST_TITLE, id);
  }

  private toPayload(input: Partial<IMaintenanceRecordInput>): Record<string, SharePointFieldValue> {
    const payload: Record<string, SharePointFieldValue> = {};
    if (input.Title !== undefined) payload.Title = input.Title;
    if (input.AM_AssetId !== undefined) payload.AM_AssetId = input.AM_AssetId;
    if (input.AM_Type !== undefined) payload.AM_Type = input.AM_Type || '';
    if (input.AM_ScheduledDate !== undefined) payload.AM_ScheduledDate = input.AM_ScheduledDate ?? '';
    if (input.AM_CompletedDate !== undefined) payload.AM_CompletedDate = input.AM_CompletedDate ?? '';
    if (input.AM_TechnicianId !== undefined) payload.AM_TechnicianId = input.AM_TechnicianId;
    if (input.AM_Cost !== undefined) payload.AM_Cost = input.AM_Cost ?? 0;
    if (input.AM_Notes !== undefined) payload.AM_Notes = input.AM_Notes ?? '';
    return payload;
  }
}
