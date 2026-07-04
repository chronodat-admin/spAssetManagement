import { SPHttpClient } from '@microsoft/sp-http';

import { INVENTORY_LIST_TITLE } from '../models/IListDefinitions';
import type { IInventoryItem } from '../models/IAsset';
import { SharePointFieldValue } from '../utils/sharePointFieldPayload';
import { SharePointRestService } from './SharePointRestService';

export interface IInventoryScanInput {
  Title: string;
  AM_LocationId?: number | null;
  AM_ScanDate?: string;
  AM_ScannedById?: number | null;
  AM_AssetId?: number | null;
  AM_Found?: boolean;
  AM_VarianceNotes?: string;
}

export class InventoryService {
  private readonly rest: SharePointRestService;

  public constructor(spHttpClient: SPHttpClient, webUrl: string) {
    this.rest = new SharePointRestService(spHttpClient, webUrl);
  }

  public async getScans(): Promise<IInventoryItem[]> {
    return this.rest.getAllItems<IInventoryItem>(
      INVENTORY_LIST_TITLE,
      'Id,Title,AM_ScanDate,AM_Found,AM_VarianceNotes,AM_Location/Title,AM_Asset/Title,AM_ScannedBy/Title',
      'AM_Location,AM_Asset,AM_ScannedBy',
      undefined,
      'AM_ScanDate desc'
    );
  }

  public async createScan(input: IInventoryScanInput): Promise<number> {
    return this.rest.addListItem(INVENTORY_LIST_TITLE, this.toPayload(input));
  }

  public async updateScan(id: number, input: Partial<IInventoryScanInput>): Promise<void> {
    await this.rest.updateItem(INVENTORY_LIST_TITLE, id, this.toPayload(input));
  }

  public async deleteScan(id: number): Promise<void> {
    await this.rest.deleteItem(INVENTORY_LIST_TITLE, id);
  }

  private toPayload(input: Partial<IInventoryScanInput>): Record<string, SharePointFieldValue> {
    const payload: Record<string, SharePointFieldValue> = {};
    if (input.Title !== undefined) payload.Title = input.Title;
    if (input.AM_LocationId !== undefined) payload.AM_LocationId = input.AM_LocationId;
    if (input.AM_ScanDate !== undefined) payload.AM_ScanDate = input.AM_ScanDate ?? '';
    if (input.AM_ScannedById !== undefined) payload.AM_ScannedById = input.AM_ScannedById;
    if (input.AM_AssetId !== undefined) payload.AM_AssetId = input.AM_AssetId;
    if (input.AM_Found !== undefined) payload.AM_Found = input.AM_Found;
    if (input.AM_VarianceNotes !== undefined) payload.AM_VarianceNotes = input.AM_VarianceNotes ?? '';
    return payload;
  }
}
