import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CUSTOM_FIELDS_TAB_KEY,
  mergeCustomFieldsIntoFormConfig
} from '../lib/lib/form-config/mergeCustomFields.js';

describe('mergeCustomFieldsIntoFormConfig', () => {
  it('adds custom fields to a dedicated tab for business forms', () => {
    const merged = mergeCustomFieldsIntoFormConfig({
      entity: 'business',
      mode: 'create',
      fields: {
        Title: { label: 'Title', visible: true, required: true }
      },
      orderedKeys: ['Title'],
      tabs: [
        { key: 'general', label: 'General', fields: ['Title'] },
        { key: 'governance', label: 'Governance', fields: [] }
      ],
      customFields: [
        {
          key: 'business_cf_1',
          label: 'Extra detail',
          type: 'text',
          tab: CUSTOM_FIELDS_TAB_KEY,
          required: false
        }
      ]
    });

    const customTab = merged.tabs?.find((tab) => tab.key === CUSTOM_FIELDS_TAB_KEY);
    assert.ok(customTab);
    assert.deepEqual(customTab?.fields, ['business_cf_1']);
    assert.equal(merged.fields.business_cf_1?.label, 'Extra detail');
    assert.equal(merged.tabs?.find((tab) => tab.key === 'general')?.fields.includes('business_cf_1'), false);
  });

  it('respects a custom field tab assignment on project forms', () => {
    const merged = mergeCustomFieldsIntoFormConfig({
      entity: 'projects',
      mode: 'edit',
      fields: {
        Title: { label: 'Title', visible: true, required: true }
      },
      orderedKeys: ['Title'],
      tabs: [
        { key: 'general', label: 'General', fields: ['Title'] },
        { key: 'details', label: 'Details', fields: [] }
      ],
      customFields: [
        {
          key: 'projects_cf_1',
          label: 'Regulatory note',
          type: 'note',
          tab: 'details',
          required: false
        }
      ]
    });

    assert.deepEqual(merged.tabs?.find((tab) => tab.key === 'details')?.fields, ['projects_cf_1']);
  });
});
