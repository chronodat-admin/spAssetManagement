import assert from 'node:assert/strict';
import {
  formatHttpErrorMessage,
  parseHttpErrorBody
} from '../lib/utils/httpErrorMessage.js';

const intuneBody = JSON.stringify({
  error: {
    code: 'BadRequest',
    message: 'Request not applicable to target tenant.'
  }
});

const parsed = parseHttpErrorBody(intuneBody);
assert.equal(parsed.code, 'BadRequest');
assert.equal(parsed.message, 'Request not applicable to target tenant.');

const friendly = formatHttpErrorMessage(400, intuneBody, 'Intune sync failed');
assert.ok(friendly.includes('Intune device management is not available'));
assert.ok(!friendly.includes('innerError'));

const plain = formatHttpErrorMessage(500, '', 'Save failed');
assert.equal(plain, 'Save failed: Request failed (HTTP 500).');

console.log('httpErrorMessage tests passed');
