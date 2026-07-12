import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CUSTOM_FIELD_LOOKUP_LIST_OPTIONS,
  normalizeLookupListTitle,
  resolveLookupListOptionLabel
} from '../lib/constants/customFieldTypes.js';
import { FORM_ENTITY_OPTIONS } from '../lib/lib/form-config/entityFormSettingsUtils.js';
import {
  ASSET_STATUSES_LIST_TITLE,
  CATEGORIES_LIST_TITLE,
  PROJECTS_LIST_TITLE,
  SUB_CATEGORIES_LIST_TITLE,
  VENDORS_LIST_TITLE
} from '../lib/models/IListDefinitions.js';

describe('form settings entity options', () => {
  it('lists user-facing display labels for configure-forms dropdown', () => {
    const labels = FORM_ENTITY_OPTIONS.map((entry) => entry.label);
    assert.deepEqual(labels, [
      'Assets',
      'Categories',
      'Sub-categories',
      'Vendors',
      'Locations',
      'Projects'
    ]);
    assert.equal(new Set(FORM_ENTITY_OPTIONS.map((entry) => entry.id)).size, FORM_ENTITY_OPTIONS.length);
  });

  it('maps multiple lookup lists to shared lookups entity settings', () => {
    const lookupEntities = FORM_ENTITY_OPTIONS.filter((entry) =>
      ['categories', 'vendors', 'locations'].includes(entry.id)
    );
    assert.equal(lookupEntities.every((entry) => entry.entity === 'lookups'), true);
  });
});

describe('custom field lookup list options', () => {
  it('uses provisioned AM_* list titles', () => {
    const values = CUSTOM_FIELD_LOOKUP_LIST_OPTIONS.map((entry) => entry.value);
    assert.equal(values.includes(CATEGORIES_LIST_TITLE), true);
    assert.equal(values.includes(SUB_CATEGORIES_LIST_TITLE), true);
    assert.equal(values.includes(VENDORS_LIST_TITLE), true);
    assert.equal(values.includes(PROJECTS_LIST_TITLE), true);
    assert.equal(values.includes(ASSET_STATUSES_LIST_TITLE), true);
    assert.equal(values.every((value) => value.startsWith('AM_')), true);
  });

  it('normalizes legacy risk-management lookup aliases', () => {
    assert.equal(normalizeLookupListTitle('RiskResponse'), VENDORS_LIST_TITLE);
    assert.equal(normalizeLookupListTitle('lstBusiness'), CATEGORIES_LIST_TITLE);
    assert.equal(resolveLookupListOptionLabel('RiskProfile'), 'AM_AssetTypes');
    assert.equal(resolveLookupListOptionLabel('Projects'), 'AM_Projects');
  });
});
