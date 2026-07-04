import { IAsset } from '../models/IAsset';

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function lookupTitle(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'Title' in value) {
    return String((value as { Title?: string }).Title || '');
  }
  return String(value);
}

export function exportAssetsToCsv(assets: IAsset[], filename = 'assets-export.csv'): void {
  const headers = [
    'Asset ID',
    'Title',
    'Status',
    'Category',
    'Serial Number',
    'Barcode',
    'Vendor',
    'Location',
    'Assigned To',
    'Cost',
    'Purchase Date',
    'Warranty Expiry'
  ];

  const rows = assets.map((asset) => [
    asset.AM_AssetId || '',
    asset.Title || '',
    lookupTitle(asset.AM_Status),
    lookupTitle(asset.AM_Category),
    asset.AM_SerialNumber || '',
    asset.AM_Barcode || '',
    lookupTitle(asset.AM_Vendor),
    lookupTitle(asset.AM_Location),
    asset.AM_AssignedTo?.Title || asset.AM_AssignedTo?.Email || '',
    asset.AM_Cost != null ? String(asset.AM_Cost) : '',
    asset.AM_PurchaseDate || '',
    asset.AM_WarrantyExpiry || ''
  ]);

  const csv = [headers, ...rows].map((row) => row.map((c) => escapeCsv(c)).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** @deprecated Use exportAssetsToCsv */
export const exportRisksToCsv = exportAssetsToCsv;
