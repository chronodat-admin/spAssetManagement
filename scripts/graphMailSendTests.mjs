import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  interpretMailSendProbeResponse,
  isMailSendConsentRequired
} from '../lib/lib/graph-mail-send/status.js';
import { getSharePointApiAccessAdminUrl } from '../lib/constants/graphMailSend.js';

describe('Mail.Send approval probe', () => {
  it('treats 400 validation errors as approved permission', () => {
    assert.equal(interpretMailSendProbeResponse(400), 'approved');
  });

  it('detects tenant admin consent messages as pending', () => {
    const error =
      'Access denied. Before opening this list, a tenant administrator must approve the request in SharePoint admin center API access.';
    assert.equal(isMailSendConsentRequired(error), true);
    assert.equal(interpretMailSendProbeResponse(403, error), 'pending');
  });

  it('returns unknown for unrelated 403 responses', () => {
    assert.equal(interpretMailSendProbeResponse(403, 'Insufficient privileges'), 'unknown');
  });
});

describe('SharePoint API access admin URL', () => {
  it('builds tenant-specific admin center deep link', () => {
    assert.equal(
      getSharePointApiAccessAdminUrl('https://contoso.sharepoint.com/sites/rm'),
      'https://contoso-admin.sharepoint.com/_layouts/15/online/AdminHome.aspx#/webApiPermissionManagement'
    );
  });

  it('falls back to admin.microsoft.com for non-standard hosts', () => {
    assert.equal(
      getSharePointApiAccessAdminUrl('https://example.com/sites/rm'),
      'https://admin.microsoft.com/sharepoint'
    );
  });
});
