import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ASSET_SEED_DATA } from '../lib/constants/assetSeedData.js';
import { ASSET_SUB_CATEGORY_SEED_DATA } from '../lib/constants/assetSubCategorySeedData.js';
import { SOFTWARE_LICENSE_SEED_DATA } from '../lib/constants/softwareLicenseSeedData.js';

describe('asset onboarding seed catalogs', () => {
  it('defines asset rows with category and status helpers', () => {
    assert.ok(ASSET_SEED_DATA.length >= 8);
    for (const row of ASSET_SEED_DATA) {
      assert.ok(String(row.Title || '').trim(), 'asset Title required');
      assert.ok(String(row.CategoryTitle || '').trim(), 'CategoryTitle required');
      assert.ok(String(row.StatusTitle || '').trim(), 'StatusTitle required');
      assert.ok(String(row.ImageSeedKey || '').trim(), 'ImageSeedKey required');
    }
  });

  it('defines sub-categories linked to parent categories', () => {
    assert.ok(ASSET_SUB_CATEGORY_SEED_DATA.length >= 5);
    for (const row of ASSET_SUB_CATEGORY_SEED_DATA) {
      assert.ok(String(row.ParentCategoryTitle || '').trim());
    }
  });

  it('defines software license rows with seat counts', () => {
    assert.ok(SOFTWARE_LICENSE_SEED_DATA.length >= 2);
    for (const row of SOFTWARE_LICENSE_SEED_DATA) {
      assert.ok(String(row.AM_ProductName || row.Title || '').trim());
      assert.ok(Number(row.AM_TotalSeats) > 0);
    }
  });
});
