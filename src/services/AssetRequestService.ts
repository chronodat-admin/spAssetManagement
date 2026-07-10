import { SPHttpClient } from '@microsoft/sp-http';
import type { AssetRequestStatus, IAssetRequest } from '../models/IAsset';
import { ASSET_REQUESTS_LIST_TITLE } from '../models/IListDefinitions';
import { SharePointFieldValue } from '../utils/sharePointFieldPayload';
import { SharePointRestService } from './SharePointRestService';

export interface IAssetRequestInput {
  Title: string;
  AM_RequestedById: number;
  AM_CategoryId?: number | null;
  AM_Justification?: string;
  AM_Status?: AssetRequestStatus;
  AM_RequestDate?: string;
  AM_ReviewedById?: number | null;
  AM_ReviewNotes?: string;
  AM_FulfilledAssetId?: number | null;
}

const REQUEST_SELECT =
  'Id,Title,AM_Justification,AM_Status,AM_RequestDate,AM_ReviewNotes,AM_RequestedBy/Id,AM_RequestedBy/Title,AM_RequestedBy/EMail,AM_Category/Id,AM_Category/Title,AM_ReviewedBy/Id,AM_ReviewedBy/Title,AM_FulfilledAsset/Id,AM_FulfilledAsset/Title';

export class AssetRequestService {
  private readonly rest: SharePointRestService;

  public constructor(spHttpClient: SPHttpClient, webUrl: string) {
    this.rest = new SharePointRestService(spHttpClient, webUrl);
  }

  public async getRequests(filter?: string): Promise<IAssetRequest[]> {
    return this.rest.getAllItems<IAssetRequest>(
      ASSET_REQUESTS_LIST_TITLE,
      REQUEST_SELECT,
      'AM_RequestedBy,AM_Category,AM_ReviewedBy,AM_FulfilledAsset',
      filter,
      'AM_RequestDate desc'
    );
  }

  public async getMyRequests(userId: number): Promise<IAssetRequest[]> {
    return this.getRequests(`AM_RequestedBy/Id eq ${userId}`);
  }

  public async getPendingRequests(): Promise<IAssetRequest[]> {
    return this.getRequests(`AM_Status eq 'Pending'`);
  }

  public async createRequest(input: IAssetRequestInput): Promise<number> {
    return this.rest.addListItem(ASSET_REQUESTS_LIST_TITLE, this.toPayload(input));
  }

  public async updateRequest(id: number, input: Partial<IAssetRequestInput>): Promise<void> {
    await this.rest.updateItem(ASSET_REQUESTS_LIST_TITLE, id, this.toPayload(input));
  }

  public async deleteRequest(id: number): Promise<void> {
    await this.rest.deleteItem(ASSET_REQUESTS_LIST_TITLE, id);
  }

  private toPayload(input: Partial<IAssetRequestInput>): Record<string, SharePointFieldValue> {
    const payload: Record<string, SharePointFieldValue> = {};
    if (input.Title !== undefined) payload.Title = input.Title;
    if (input.AM_RequestedById !== undefined) payload.AM_RequestedById = input.AM_RequestedById;
    if (input.AM_CategoryId !== undefined) payload.AM_CategoryId = input.AM_CategoryId;
    if (input.AM_Justification !== undefined) payload.AM_Justification = input.AM_Justification || '';
    if (input.AM_Status !== undefined) payload.AM_Status = input.AM_Status;
    if (input.AM_RequestDate !== undefined) payload.AM_RequestDate = input.AM_RequestDate || '';
    if (input.AM_ReviewedById !== undefined) payload.AM_ReviewedById = input.AM_ReviewedById;
    if (input.AM_ReviewNotes !== undefined) payload.AM_ReviewNotes = input.AM_ReviewNotes || '';
    if (input.AM_FulfilledAssetId !== undefined) payload.AM_FulfilledAssetId = input.AM_FulfilledAssetId;
    return payload;
  }
}
