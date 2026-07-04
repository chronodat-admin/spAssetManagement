import { AadHttpClient, type AadHttpClientFactory } from '@microsoft/sp-http';
import {
  interpretMailSendProbeResponse,
  type MailSendApprovalStatus
} from '../lib/graph-mail-send/status';

const GRAPH_RESOURCE = 'https://graph.microsoft.com';
const GRAPH_SEND_MAIL_URL = `${GRAPH_RESOURCE}/v1.0/me/sendMail`;

export type { MailSendApprovalStatus };

/**
 * Probes Mail.Send tenant approval without delivering mail (empty recipient list → 400 when approved).
 */
export async function checkMailSendApproval(
  aadHttpClientFactory: AadHttpClientFactory
): Promise<MailSendApprovalStatus> {
  const client = await aadHttpClientFactory.getClient(GRAPH_RESOURCE);
  const response = await client.post(
    GRAPH_SEND_MAIL_URL,
    AadHttpClient.configurations.v1,
    {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          subject: '',
          body: { contentType: 'Text', content: '' },
          toRecipients: []
        },
        saveToSentItems: false
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return interpretMailSendProbeResponse(response.status, errorText);
  }

  return interpretMailSendProbeResponse(response.status);
}

function looksLikeHtml(body: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(body);
}

export async function sendMailViaMicrosoftGraph(
  aadHttpClientFactory: AadHttpClientFactory,
  to: string[],
  subject: string,
  body: string,
  options?: { isHtml?: boolean }
): Promise<void> {
  if (to.length === 0) {
    return;
  }

  const client = await aadHttpClientFactory.getClient(GRAPH_RESOURCE);
  const contentType = options?.isHtml || looksLikeHtml(body) ? 'HTML' : 'Text';

  const response = await client.post(
    GRAPH_SEND_MAIL_URL,
    AadHttpClient.configurations.v1,
    {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          subject,
          body: {
            contentType,
            content: body
          },
          toRecipients: to.map((address) => ({
            emailAddress: { address }
          }))
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Microsoft Graph sendMail failed (${response.status}): ${errorText || response.statusText}`
    );
  }
}
