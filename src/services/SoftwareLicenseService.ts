import { SPHttpClient } from '@microsoft/sp-http';

import { SOFTWARE_LICENSES_LIST_TITLE } from '../models/IListDefinitions';
import type { ISoftwareLicense } from '../models/IAsset';
import { SharePointFieldValue } from '../utils/sharePointFieldPayload';
import { SharePointRestService } from './SharePointRestService';

export interface ISoftwareLicenseInput {
  Title: string;
  AM_ProductName?: string;
  AM_LicenseKey?: string;
  AM_VendorId?: number | null;
  AM_TotalSeats?: number;
  AM_UsedSeats?: number;
  AM_ExpiryDate?: string;
  AM_Cost?: number;
  AM_Notes?: string;
  AM_IsActive?: boolean;
}

export class SoftwareLicenseService {
  private readonly rest: SharePointRestService;

  public constructor(spHttpClient: SPHttpClient, webUrl: string) {
    this.rest = new SharePointRestService(spHttpClient, webUrl);
  }

  public async getLicenses(): Promise<ISoftwareLicense[]> {
    return this.rest.getAllItems<ISoftwareLicense>(
      SOFTWARE_LICENSES_LIST_TITLE,
      'Id,Title,AM_ProductName,AM_LicenseKey,AM_TotalSeats,AM_UsedSeats,AM_AvailableSeats,AM_ExpiryDate,AM_Cost,AM_Notes,AM_IsActive,AM_Vendor/Title',
      'AM_Vendor',
      undefined,
      'Title asc'
    );
  }

  public async createLicense(input: ISoftwareLicenseInput): Promise<number> {
    return this.rest.addListItem(SOFTWARE_LICENSES_LIST_TITLE, this.toPayload(input));
  }

  public async updateLicense(id: number, input: Partial<ISoftwareLicenseInput>): Promise<void> {
    await this.rest.updateItem(SOFTWARE_LICENSES_LIST_TITLE, id, this.toPayload(input));
  }

  public async deleteLicense(id: number): Promise<void> {
    await this.rest.deleteItem(SOFTWARE_LICENSES_LIST_TITLE, id);
  }

  private toPayload(input: Partial<ISoftwareLicenseInput>): Record<string, SharePointFieldValue> {
    const payload: Record<string, SharePointFieldValue> = {};
    if (input.Title !== undefined) payload.Title = input.Title;
    if (input.AM_ProductName !== undefined) payload.AM_ProductName = input.AM_ProductName ?? '';
    if (input.AM_LicenseKey !== undefined) payload.AM_LicenseKey = input.AM_LicenseKey ?? '';
    if (input.AM_VendorId !== undefined) payload.AM_VendorId = input.AM_VendorId;
    if (input.AM_TotalSeats !== undefined) payload.AM_TotalSeats = input.AM_TotalSeats ?? 0;
    if (input.AM_UsedSeats !== undefined) payload.AM_UsedSeats = input.AM_UsedSeats ?? 0;
    if (input.AM_ExpiryDate !== undefined) payload.AM_ExpiryDate = input.AM_ExpiryDate ?? '';
    if (input.AM_Cost !== undefined) payload.AM_Cost = input.AM_Cost ?? 0;
    if (input.AM_Notes !== undefined) payload.AM_Notes = input.AM_Notes ?? '';
    if (input.AM_IsActive !== undefined) payload.AM_IsActive = input.AM_IsActive ?? true;
    return payload;
  }
}
