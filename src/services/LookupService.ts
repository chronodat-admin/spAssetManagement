import { SPHttpClient } from '@microsoft/sp-http';

import type { ILookupItem } from '../models/IAsset';
import { SharePointRestService } from './SharePointRestService';

/** Lookup list CRUD — categories, vendors, locations, etc. */
export class LookupService extends SharePointRestService {
  public constructor(spHttpClient: SPHttpClient, webUrl: string) {
    super(spHttpClient, webUrl);
  }

  public async getLookupItems(listTitle: string): Promise<ILookupItem[]> {
    return this.getAllItems<ILookupItem>(listTitle, 'Id,Title', undefined, undefined, 'Title asc');
  }

  public async createLookupItem(listTitle: string, title: string): Promise<number> {
    return this.addListItem(listTitle, { Title: title });
  }

  public async updateLookupItem(listTitle: string, id: number, title: string): Promise<void> {
    await this.updateItem(listTitle, id, { Title: title });
  }

  public async deleteLookupItem(listTitle: string, id: number): Promise<void> {
    await this.deleteItem(listTitle, id);
  }
}
