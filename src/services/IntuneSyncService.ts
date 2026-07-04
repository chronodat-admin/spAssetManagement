import { SPHttpClient } from '@microsoft/sp-http';
import { SharePointRestService } from './SharePointRestService';

/** Graph managedDevices sync (task 22+). */
export class IntuneSyncService extends SharePointRestService {
  constructor(spHttpClient: SPHttpClient, webUrl: string) {
    super(spHttpClient, webUrl);
  }
}
