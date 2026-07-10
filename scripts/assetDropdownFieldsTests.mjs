import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILTIN_ASSET_DROPDOWN_FIELDS,
  formatAssetDropdownOptionLabel,
  getAssetDropdownOptions,
  listAssetDropdownFields
} from '../lib/utils/assetDropdownFields.js';

const baseFormSettings = {
  risks: {
    fields: {
      AM_DepreciationMethod: {
        label: 'Depreciation Method',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true,
        options: ['StraightLine', 'DecliningBalance']
      }
    },
    customFields: []
  },
  business: { fields: {} },
  lookups: { fields: {} },
  projects: { fields: {} },
  subCategories: { fields: {} }
};

describe('assetDropdownFields', () => {
  it('lists built-in asset dropdown fields without legacy risk options', () => {
    const keys = BUILTIN_ASSET_DROPDOWN_FIELDS.map((field) => field.key);
    assert.deepEqual(keys, ['AM_DepreciationMethod']);
    assert.equal(BUILTIN_ASSET_DROPDOWN_FIELDS.some((field) => field.key === 'controlEffectiveness'), false);
    assert.equal(BUILTIN_ASSET_DROPDOWN_FIELDS.some((field) => field.key === 'type'), false);
  });

  it('includes custom dropdown fields from form settings', () => {
    const fields = listAssetDropdownFields({
      ...baseFormSettings,
      risks: {
        ...baseFormSettings.risks,
        customFields: [
          {
            key: 'AM_CustomPriority',
            label: 'Custom priority',
            type: 'dropdown',
            options: ['Low', 'High']
          }
        ]
      }
    });

    assert.equal(fields.some((field) => field.key === 'AM_DepreciationMethod'), true);
    assert.equal(fields.some((field) => field.key === 'AM_CustomPriority'), true);
  });

  it('reads configured depreciation method options', () => {
    const options = getAssetDropdownOptions(
      {
        ...baseFormSettings,
        risks: {
          ...baseFormSettings.risks,
          fields: {
            ...baseFormSettings.risks.fields,
            AM_DepreciationMethod: {
              ...baseFormSettings.risks.fields.AM_DepreciationMethod,
              options: ['StraightLine']
            }
          }
        }
      },
      BUILTIN_ASSET_DROPDOWN_FIELDS[0]
    );

    assert.deepEqual(options, ['StraightLine']);
  });

  it('formats depreciation method labels for display', () => {
    assert.equal(formatAssetDropdownOptionLabel('AM_DepreciationMethod', 'StraightLine'), 'Straight line');
    assert.equal(
      formatAssetDropdownOptionLabel('AM_DepreciationMethod', 'DecliningBalance'),
      'Declining balance'
    );
  });
});
