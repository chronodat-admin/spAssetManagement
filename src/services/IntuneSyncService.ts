import { SPHttpClient } from '@microsoft/sp-http';
import { IAsset } from '../models/IAsset';
import { ASSETS_LIST_TITLE } from '../models/IListDefinitions';
import { SharePointFieldValue } from '../utils/sharePointFieldPayload';
import { SharePointRestService } from './SharePointRestService';

export interface IIntuneManagedDevice {
  id: string;
  deviceName?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  operatingSystem?: string;
  osVersion?: string;
  imei?: string;
  wiFiMacAddress?: string;
  ethernetMacAddress?: string;
  totalStorageSpaceInBytes?: number;
  physicalMemoryInBytes?: number;
}

export interface IIntuneSyncResult {
  created: number;
  updated: number;
  skipped: number;
}

export class IntuneSyncService {
  private readonly rest: SharePointRestService;

  public constructor(spHttpClient: SPHttpClient, webUrl: string) {
    this.rest = new SharePointRestService(spHttpClient, webUrl);
  }

  public async syncManagedDevices(devices: IIntuneManagedDevice[]): Promise<IIntuneSyncResult> {
    const assets = await this.loadExistingAssets();
    const byDeviceId = new Map(
      assets
        .filter((asset) => asset.AM_IntuneDeviceId)
        .map((asset) => [String(asset.AM_IntuneDeviceId), asset])
    );
    const bySerial = new Map(
      assets
        .filter((asset) => asset.AM_SerialNumber)
        .map((asset) => [String(asset.AM_SerialNumber).toLowerCase(), asset])
    );

    const result: IIntuneSyncResult = { created: 0, updated: 0, skipped: 0 };
    for (const device of devices) {
      if (!device.id || !device.deviceName) {
        result.skipped += 1;
        continue;
      }

      const existing =
        byDeviceId.get(device.id) ||
        (device.serialNumber ? bySerial.get(device.serialNumber.toLowerCase()) : undefined);
      const payload = this.toAssetPayload(device);
      if (existing) {
        await this.rest.updateItem(ASSETS_LIST_TITLE, existing.Id, payload);
        result.updated += 1;
      } else {
        await this.rest.addListItem(ASSETS_LIST_TITLE, payload);
        result.created += 1;
      }
    }
    return result;
  }

  private async loadExistingAssets(): Promise<IAsset[]> {
    return this.rest.getAllItems<IAsset>(
      ASSETS_LIST_TITLE,
      'Id,Title,AM_IntuneDeviceId,AM_SerialNumber',
      undefined,
      'AM_IsDeleted eq false',
      'Title asc'
    );
  }

  private toAssetPayload(device: IIntuneManagedDevice): Record<string, SharePointFieldValue> {
    return {
      Title: device.deviceName || device.serialNumber || device.id,
      AM_IntuneDeviceId: device.id,
      AM_SerialNumber: device.serialNumber || '',
      AM_Manufacturer: device.manufacturer || '',
      AM_OS: device.operatingSystem || '',
      AM_OSVersion: device.osVersion || '',
      AM_IMEI: device.imei || '',
      AM_MACAddress: device.wiFiMacAddress || device.ethernetMacAddress || '',
      AM_Storage: this.formatBytes(device.totalStorageSpaceInBytes),
      AM_TotalMemory: this.formatBytes(device.physicalMemoryInBytes)
    };
  }

  private formatBytes(value?: number): string {
    if (!value || value <= 0) {
      return '';
    }
    const gib = value / 1024 / 1024 / 1024;
    return `${Math.round(gib)} GB`;
  }
}
