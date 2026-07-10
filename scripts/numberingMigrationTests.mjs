import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { migrateLegacyNumbering } from '../lib/lib/workflow-settings/numberingMigration.js';

describe('numberingMigration', () => {
  it('migrates legacy risk numbering to asset AST prefix', () => {
    const migrated = migrateLegacyNumbering([
      {
        entityType: 'risk',
        prefix: 'RISK',
        separator: '-',
        dateFormat: 'YYYY',
        padLength: 4,
        enabled: true,
        nextValue: 12,
        resetFrequency: 'yearly',
        sequenceCounters: {}
      }
    ]);

    const asset = migrated.find((item) => item.entityType === 'asset');
    assert.ok(asset);
    assert.equal(asset.prefix, 'AST');
    assert.equal(asset.nextValue, 12);
  });

  it('migrates business numbering to vendor VND prefix', () => {
    const migrated = migrateLegacyNumbering([
      {
        entityType: 'business',
        prefix: 'BIZ',
        separator: '-',
        dateFormat: 'YYYY',
        padLength: 4,
        enabled: true,
        nextValue: 3,
        resetFrequency: 'yearly',
        sequenceCounters: {}
      }
    ]);

    const vendor = migrated.find((item) => item.entityType === 'vendor');
    assert.ok(vendor);
    assert.equal(vendor.prefix, 'VND');
    assert.equal(vendor.nextValue, 3);
  });
});
