import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDepreciationFilters,
  EMPTY_DEPRECIATION_FILTERS,
  formatDepreciationMethod,
  getDepreciationMethodOptions,
  hasActiveDepreciationFilters,
  isFullyDepreciated
} from '../lib/utils/depreciationFilters.js';

const sampleRows = [
  {
    asset: {
      Id: 1,
      Title: 'Laptop Pro',
      AM_AssetId: 'AM-001',
      AM_Cost: 1200,
      AM_DepreciationMethod: 'StraightLine',
      AM_SalvageValue: 200,
      AM_UsefulLifeMonths: 36
    },
    bookValue: 900,
    monthsElapsed: 6,
    schedule: []
  },
  {
    asset: {
      Id: 2,
      Title: 'Server Rack',
      AM_AssetId: 'AM-002',
      AM_Cost: 5000,
      AM_DepreciationMethod: 'DecliningBalance',
      AM_SalvageValue: 500,
      AM_UsefulLifeMonths: 60
    },
    bookValue: 500,
    monthsElapsed: 72,
    schedule: []
  }
];

describe('depreciationFilters', () => {
  it('filters by search text', () => {
    const filtered = applyDepreciationFilters(sampleRows, {
      ...EMPTY_DEPRECIATION_FILTERS,
      search: 'server'
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].asset.Id, 2);
  });

  it('filters by depreciation method', () => {
    const filtered = applyDepreciationFilters(sampleRows, {
      ...EMPTY_DEPRECIATION_FILTERS,
      method: 'DecliningBalance'
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].asset.Title, 'Server Rack');
  });

  it('filters by depreciation status', () => {
    const filtered = applyDepreciationFilters(sampleRows, {
      ...EMPTY_DEPRECIATION_FILTERS,
      status: 'fullyDepreciated'
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].asset.Id, 2);
  });

  it('derives unique method options from rows', () => {
    const options = getDepreciationMethodOptions(sampleRows);
    assert.deepEqual(options, ['DecliningBalance', 'StraightLine']);
  });

  it('formats method labels for display', () => {
    assert.equal(formatDepreciationMethod('StraightLine'), 'Straight line');
    assert.equal(formatDepreciationMethod('DecliningBalance'), 'Declining balance');
  });

  it('detects fully depreciated assets', () => {
    assert.equal(isFullyDepreciated(sampleRows[0]), false);
    assert.equal(isFullyDepreciated(sampleRows[1]), true);
  });

  it('detects active filters', () => {
    assert.equal(hasActiveDepreciationFilters(EMPTY_DEPRECIATION_FILTERS), false);
    assert.equal(hasActiveDepreciationFilters({ ...EMPTY_DEPRECIATION_FILTERS, search: 'x' }), true);
    assert.equal(hasActiveDepreciationFilters({ ...EMPTY_DEPRECIATION_FILTERS, method: 'StraightLine' }), true);
  });
});
