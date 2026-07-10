import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAuditTitle,
  computeAuditChanges,
  resolveAuditEntity,
  serializeAuditDetails
} from '../lib/utils/auditLogUtils.js';
import {
  buildRiskItemPayload,
  toDateOnlyFieldValue,
  toUserMultiFieldValue
} from '../lib/utils/sharePointFieldPayload.js';

describe('auditLogUtils', () => {
  it('resolves known list titles and builds readable audit titles', () => {
    assert.equal(resolveAuditEntity('AM_Categories'), 'Business');
    assert.equal(resolveAuditEntity('AM_Projects'), 'Projects');
    assert.equal(resolveAuditEntity('CustomList'), 'CustomList');
    assert.equal(buildAuditTitle('AM_Assets', 'Update', 42), 'Update - AM_Assets #42');
  });

  it('serializes sanitized details and detects normalized changes', () => {
    const serialized = serializeAuditDetails({
      message: 'x'.repeat(2100),
      nested: { value: true }
    });
    assert.match(serialized, /\.\.\.\[truncated\]/);

    const changes = computeAuditChanges(
      { Title: 'Laptop', Cost: ' 100 ', Removed: 'yes' },
      { Title: 'Laptop', Cost: 100, Added: 'new' }
    );

    assert.deepEqual(changes, {
      Removed: { old: 'yes', new: null },
      Added: { old: null, new: 'new' }
    });
  });
});

describe('sharePointFieldPayload', () => {
  it('preserves supported field values and removes undefined values', () => {
    assert.equal(toDateOnlyFieldValue(''), null);
    assert.equal(toDateOnlyFieldValue('2026-07-04'), '2026-07-04');
    assert.deepEqual(toUserMultiFieldValue([1, 2]), [1, 2]);
    assert.deepEqual(
      buildRiskItemPayload({
        Title: 'Laptop',
        Empty: '',
        KeepFalse: false,
        SkipUndefined: undefined,
        UserIds: [1, 2]
      }),
      {
        Title: 'Laptop',
        Empty: '',
        KeepFalse: false,
        UserIds: [1, 2]
      }
    );
  });
});
