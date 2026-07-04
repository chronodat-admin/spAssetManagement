import { SPHttpClient } from '@microsoft/sp-http';
import { SharePointRestService } from './SharePointRestService';

/** CSV/Excel bulk import and export (task 18+). */
export class ImportExportService extends SharePointRestService {
  constructor(spHttpClient: SPHttpClient, webUrl: string) {
    super(spHttpClient, webUrl);
  }
}
