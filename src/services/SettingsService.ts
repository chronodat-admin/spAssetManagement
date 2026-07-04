import { SPHttpClient } from '@microsoft/sp-http';
import { SharePointRestService } from './SharePointRestService';
import type { IAppSettings } from '../models/IAsset';

/** AM_Settings read/write — JSON blob persistence. */
export class SettingsService extends SharePointRestService {
  constructor(spHttpClient: SPHttpClient, webUrl: string) {
    super(spHttpClient, webUrl);
  }

  public async getSettings(): Promise<IAppSettings | undefined> {
    return undefined;
  }
}
