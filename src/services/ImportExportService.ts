import { SPHttpClient } from '@microsoft/sp-http';
import { IAsset } from '../models/IAsset';
import { ASSETS_LIST_TITLE } from '../models/IListDefinitions';
import { SharePointFieldValue } from '../utils/sharePointFieldPayload';
import { SharePointRestService } from './SharePointRestService';

export interface IAssetImportRow {
  Title: string;
  AM_AssetId?: string;
  AM_SerialNumber?: string;
  AM_Barcode?: string;
  AM_Cost?: number;
  AM_PurchaseDate?: string;
  AM_Notes?: string;
}

const EXPORT_COLUMNS: Array<keyof IAssetImportRow> = [
  'Title',
  'AM_AssetId',
  'AM_SerialNumber',
  'AM_Barcode',
  'AM_Cost',
  'AM_PurchaseDate',
  'AM_Notes'
];

export class ImportExportService {
  private readonly rest: SharePointRestService;

  public constructor(spHttpClient: SPHttpClient, webUrl: string) {
    this.rest = new SharePointRestService(spHttpClient, webUrl);
  }

  public async getExportRows(): Promise<IAssetImportRow[]> {
    const assets = await this.rest.getAllItems<IAsset>(
      ASSETS_LIST_TITLE,
      'Id,Title,AM_AssetId,AM_SerialNumber,AM_Barcode,AM_Cost,AM_PurchaseDate,AM_Notes',
      undefined,
      'AM_IsDeleted eq false',
      'Title asc'
    );
    return assets.map((asset) => ({
      Title: asset.Title,
      AM_AssetId: asset.AM_AssetId,
      AM_SerialNumber: asset.AM_SerialNumber,
      AM_Barcode: asset.AM_Barcode,
      AM_Cost: asset.AM_Cost,
      AM_PurchaseDate: asset.AM_PurchaseDate,
      AM_Notes: asset.AM_Notes
    }));
  }

  public async exportAssetsCsv(): Promise<string> {
    return this.toCsv(await this.getExportRows());
  }

  public async importAssetRows(rows: IAssetImportRow[]): Promise<number[]> {
    const validRows = rows.filter((row) => row.Title?.trim());
    const createdIds: number[] = [];
    for (const row of validRows) {
      const itemId = await this.rest.addListItem(ASSETS_LIST_TITLE, this.toPayload(row));
      createdIds.push(itemId);
    }
    return createdIds;
  }

  private toPayload(row: IAssetImportRow): Record<string, SharePointFieldValue> {
    return {
      Title: row.Title.trim(),
      AM_AssetId: row.AM_AssetId?.trim() || '',
      AM_SerialNumber: row.AM_SerialNumber?.trim() || '',
      AM_Barcode: row.AM_Barcode?.trim() || '',
      AM_Cost: row.AM_Cost ?? 0,
      AM_PurchaseDate: row.AM_PurchaseDate || '',
      AM_Notes: row.AM_Notes || ''
    };
  }

  private toCsv(rows: IAssetImportRow[]): string {
    const escape = (value: unknown): string => {
      const text = value === null || value === undefined ? '' : String(value);
      return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const lines = [
      EXPORT_COLUMNS.join(','),
      ...rows.map((row) => EXPORT_COLUMNS.map((column) => escape(row[column])).join(','))
    ];
    return `${lines.join('\r\n')}\r\n`;
  }
}
