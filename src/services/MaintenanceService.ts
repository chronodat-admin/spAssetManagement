import { SPHttpClient } from '@microsoft/sp-http';
import { SharePointRestService } from './SharePointRestService';

/** Maintenance schedule CRUD (task 18+). */
export class MaintenanceService extends SharePointRestService {
  constructor(spHttpClient: SPHttpClient, webUrl: string) {
    super(spHttpClient, webUrl);
  }
}
