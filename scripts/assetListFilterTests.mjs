import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAssetListFilters,
  EMPTY_ASSET_LIST_FILTERS,
  getAssetStatusFilterOptions,
  hasActiveAssetListFilters
} from '../lib/utils/assetListFilters.js';

const sampleAssets = [
  {
    Id: 1,
    Title: 'Laptop',
    AM_AssetId: 'AM-001',
    AM_Status: 'Available',
    AM_Category: { Id: 10, Title: 'IT' },
    AM_Location: { Id: 20, Title: 'HQ' }
  },
  {
    Id: 2,
    Title: 'Monitor',
    AM_AssetId: 'AM-002',
    AM_Status: 'Assigned',
    AM_Category: { Id: 11, Title: 'Furniture' },
    AM_Location: { Id: 21, Title: 'Remote' }
  }
];

describe('assetListFilters', () => {
  it('filters by search text', () => {
    const filtered = applyAssetListFilters(sampleAssets, {
      ...EMPTY_ASSET_LIST_FILTERS,
      search: 'laptop'
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].Id, 1);
  });

  it('filters by status and category', () => {
    const filtered = applyAssetListFilters(sampleAssets, {
      ...EMPTY_ASSET_LIST_FILTERS,
      status: 'Assigned',
      categoryId: '11'
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].Title, 'Monitor');
  });

  it('derives unique status options from assets', () => {
    const options = getAssetStatusFilterOptions(sampleAssets);
    assert.deepEqual(options.sort(), ['Assigned', 'Available']);
  });

  it('detects active filters', () => {
    assert.equal(hasActiveAssetListFilters(EMPTY_ASSET_LIST_FILTERS), false);
    assert.equal(hasActiveAssetListFilters({ ...EMPTY_ASSET_LIST_FILTERS, search: 'x' }), true);
    assert.equal(hasActiveAssetListFilters({ ...EMPTY_ASSET_LIST_FILTERS, categoryId: '5' }), true);
  });
});
