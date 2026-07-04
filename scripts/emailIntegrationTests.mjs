import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isGraphEmailDeliveryEnabled,
  resolveEmailDeliveryMode,
  shouldAppDeliverEmail
} from '../lib/lib/workflow-settings/emailIntegration.js';

describe('email integration settings', () => {
  it('defaults to Microsoft Graph (tenant-resident) delivery when mode is unset', () => {
    assert.equal(resolveEmailDeliveryMode({}), 'graph');
    assert.equal(resolveEmailDeliveryMode(undefined), 'graph');
    assert.equal(isGraphEmailDeliveryEnabled({}), true);
    assert.equal(shouldAppDeliverEmail({}), true);
  });

  it('migrates legacy graphEmailNotificationsEnabled false to Power Automate', () => {
    assert.equal(resolveEmailDeliveryMode({ graphEmailNotificationsEnabled: false }), 'powerAutomate');
    assert.equal(isGraphEmailDeliveryEnabled({ graphEmailNotificationsEnabled: false }), false);
    assert.equal(shouldAppDeliverEmail({ graphEmailNotificationsEnabled: false }), false);
  });

  it('respects explicit emailDeliveryMode over legacy flag', () => {
    assert.equal(
      resolveEmailDeliveryMode({
        emailDeliveryMode: 'chronodatApi',
        graphEmailNotificationsEnabled: false
      }),
      'chronodatApi'
    );
    assert.equal(shouldAppDeliverEmail({ emailDeliveryMode: 'chronodatApi' }), true);
  });

  it('shouldAppDeliverEmail is true for Graph and Chronodat API only', () => {
    assert.equal(shouldAppDeliverEmail({ emailDeliveryMode: 'graph' }), true);
    assert.equal(shouldAppDeliverEmail({ emailDeliveryMode: 'chronodatApi' }), true);
    assert.equal(shouldAppDeliverEmail({ emailDeliveryMode: 'powerAutomate' }), false);
  });
});
