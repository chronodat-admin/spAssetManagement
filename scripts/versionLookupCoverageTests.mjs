import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRiskVersionFieldOrder,
  diffRiskVersionAllFields,
  diffRiskVersionFieldValues,
  formatVersionTimestamp,
  normalizeVersionFieldValue
} from '../lib/utils/assetVersionHistory.js';
import { isWarrantyExpiringSoon } from '../lib/utils/assetDateFilters.js';
import {
  filterSubCategoriesByCategory,
  isSubCategoryValidForCategory
} from '../lib/utils/categoryUtils.js';
import {
  EMPTY_LOOKUP_LIST_FILTERS,
  applyLookupListFilters,
  hasActiveLookupListFilters
} from '../lib/utils/lookupListFilters.js';
import { getPageSubtitle, PAGE_TITLES } from '../lib/utils/pageTitles.js';
import {
  isHiddenSettingsPage,
  isScheduleDependentEmailTemplateSlug,
  isScheduleDependentNotificationKey,
  isScheduleDependentSettingsPageHidden
} from '../lib/constants/scheduleDependentFeatures.js';
import {
  filterProjectsByBusiness,
  isProjectValidForBusiness
} from '../lib/utils/projectUtils.js';

describe('asset version history helpers', () => {
  it('normalizes SharePoint field values and diffs tracked fields', () => {
    assert.equal(normalizeVersionFieldValue('12;#Hardware;#13;#Software'), 'Hardware, Software');
    assert.equal(normalizeVersionFieldValue('<p>Hello&nbsp;world</p>'), 'Hello&nbsp;world');
    assert.equal(normalizeVersionFieldValue([{ Title: 'Alex' }, { LookupValue: 'Priya' }]), 'Alex, Priya');

    const changes = diffRiskVersionFieldValues(
      { Title: 'New asset', AM_Status: 'Assigned', AM_Notes: 'Updated' },
      { Title: 'Old asset', AM_Status: 'Available', AM_Notes: '' }
    );
    assert.deepEqual(
      changes.map((change) => [change.fieldLabel, change.previousValue, change.newValue]),
      [
        ['Title', 'Old asset', 'New asset'],
        ['Status', 'Available', 'Assigned'],
        ['Description', undefined, 'Updated']
      ]
    );
  });

  it('orders custom version fields and formats all-field diffs', () => {
    const fieldOrder = buildRiskVersionFieldOrder({
      Custom_x0020_Field: 'Custom Field',
      AnotherField: 'Another Field'
    });
    assert.equal(fieldOrder[0].key, 'Title');
    assert.equal(fieldOrder.some((field) => field.label === 'Another Field'), true);

    assert.deepEqual(
      diffRiskVersionAllFields(
        { Custom_x0020_Field: 'after', AnotherField: '' },
        { Custom_x0020_Field: 'before', AnotherField: 'removed' },
        [
          { key: 'Custom_x0020_Field', label: 'Custom Field' },
          { key: 'AnotherField', label: 'Another Field' }
        ]
      ),
      [
        { fieldLabel: 'Custom Field', previousValue: 'before', newValue: 'after' },
        { fieldLabel: 'Another Field', previousValue: 'removed', newValue: undefined }
      ]
    );
    assert.equal(formatVersionTimestamp('not-a-date'), 'not-a-date');
  });
});

describe('lookup filters and dependent lookup helpers', () => {
  const items = [
    {
      Id: 1,
      Title: 'Laptop Refresh',
      Code: 'LR',
      BusinessId: 10,
      AM_ParentCategoryId: 100,
      ProjectStatus: 'Active',
      BusinessCriticality: 'High'
    },
    {
      Id: 2,
      Title: 'Office Move',
      Business: { Id: 11 },
      AM_ParentCategory: { Id: 101 },
      ProjectStatus: 'Paused',
      BusinessCriticality: 'Low'
    }
  ];

  it('filters lookup lists by search, business, category, and status fields', () => {
    assert.deepEqual(
      applyLookupListFilters(items, { ...EMPTY_LOOKUP_LIST_FILTERS, search: 'refresh' }).map((item) => item.Id),
      [1]
    );
    assert.deepEqual(
      applyLookupListFilters(items, { ...EMPTY_LOOKUP_LIST_FILTERS, businessId: '11' }, { businessField: true }).map((item) => item.Id),
      [2]
    );
    assert.deepEqual(
      applyLookupListFilters(items, { ...EMPTY_LOOKUP_LIST_FILTERS, categoryId: '100' }, { categoryField: true }).map((item) => item.Id),
      [1]
    );
    assert.equal(hasActiveLookupListFilters({ ...EMPTY_LOOKUP_LIST_FILTERS, status: 'High' }, { criticalityField: true }), true);
  });

  it('validates project and sub-category relationships', () => {
    assert.deepEqual(filterSubCategoriesByCategory(items, '101').map((item) => item.Id), [2]);
    assert.equal(isSubCategoryValidForCategory(items, '1', '100'), true);
    assert.equal(isSubCategoryValidForCategory(items, '2', '100'), false);
    assert.deepEqual(filterProjectsByBusiness(items, '10').map((item) => item.Id), [1]);
    assert.equal(isProjectValidForBusiness(items, '2', '11'), false);
  });
});

describe('page metadata and deferred feature gates', () => {
  it('keeps all navigable pages titled and subtitled', () => {
    for (const [page, title] of Object.entries(PAGE_TITLES)) {
      assert.equal(Boolean(title), true, `missing title for ${page}`);
      assert.equal(Boolean(getPageSubtitle(page)), true, `missing subtitle for ${page}`);
    }
    assert.equal(getPageSubtitle('dashboard', 'Custom subtitle'), 'Custom subtitle');
  });

  it('keeps schedule-dependent and deferred compliance settings hidden', () => {
    assert.equal(isHiddenSettingsPage('compliance'), true);
    assert.equal(isScheduleDependentSettingsPageHidden('scheduledReports'), false);
    assert.equal(isScheduleDependentNotificationKey('riskOverdue'), false);
    assert.equal(isScheduleDependentEmailTemplateSlug('asset_overdue'), false);
  });
});

describe('asset date filters', () => {
  it('classifies warranty expiry windows relative to a supplied date', () => {
    const today = new Date('2026-07-04T00:00:00Z');
    assert.equal(isWarrantyExpiringSoon({ Id: 1, Title: 'A', AM_WarrantyExpiry: '2026-07-10T00:00:00Z' }, 30, today), true);
    assert.equal(isWarrantyExpiringSoon({ Id: 2, Title: 'B', AM_WarrantyExpiry: '2026-09-10T00:00:00Z' }, 30, today), false);
    assert.equal(isWarrantyExpiringSoon({ Id: 3, Title: 'C', AM_WarrantyExpiry: 'invalid' }, 30, today), false);
  });
});
