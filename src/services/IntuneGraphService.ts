import { AadHttpClient, type AadHttpClientFactory } from '@microsoft/sp-http';
import { formatHttpErrorMessage } from '../utils/httpErrorMessage';
import type { IIntuneManagedDevice } from './IntuneSyncService';

const GRAPH_RESOURCE = 'https://graph.microsoft.com';
const MANAGED_DEVICES_URL = `${GRAPH_RESOURCE}/v1.0/deviceManagement/managedDevices`;

export class IntuneGraphService {
  private readonly aadHttpClientFactory: AadHttpClientFactory;

  public constructor(aadHttpClientFactory: AadHttpClientFactory) {
    this.aadHttpClientFactory = aadHttpClientFactory;
  }

  public async fetchManagedDevices(): Promise<IIntuneManagedDevice[]> {
    const client = await this.aadHttpClientFactory.getClient(GRAPH_RESOURCE);
    const devices: IIntuneManagedDevice[] = [];
    let nextUrl: string | undefined = MANAGED_DEVICES_URL;

    while (nextUrl) {
      const response = await client.get(
        nextUrl,
        AadHttpClient.configurations.v1,
        { headers: { Accept: 'application/json' } }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(formatHttpErrorMessage(response.status, text, 'Intune sync failed'));
      }

      const body = (await response.json()) as {
        value?: IIntuneManagedDevice[];
        '@odata.nextLink'?: string;
      };

      if (body.value?.length) {
        devices.push(...body.value);
      }
      nextUrl = body['@odata.nextLink'];
    }

    return devices;
  }
}
