import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyTitleFromFormValues,
  buildListFormPayload
} from '../lib/lib/list-form/buildFormPayload.js';

const titleField = {
  InternalName: 'Title',
  Title: 'Title',
  TypeAsString: 'Text',
  Required: true,
  ReadOnlyField: false,
  Hidden: false
};

const codeField = {
  InternalName: 'Code',
  Title: 'Project Code',
  TypeAsString: 'Text',
  Required: false,
  ReadOnlyField: false,
  Hidden: false
};

const businessField = {
  InternalName: 'Business',
  Title: 'Business',
  TypeAsString: 'Lookup',
  Required: false,
  ReadOnlyField: false,
  Hidden: false
};

describe('buildListFormPayload', () => {
  it('includes visible fields and lookup ids', () => {
    const payload = buildListFormPayload(
      [titleField, businessField],
      { Title: 'Alpha Project', Business: '12' },
      {
        entity: 'projects',
        mode: 'create',
        fields: {
          Title: { label: 'Title', visible: true, required: true },
          Business: { label: 'Business', visible: true, required: false }
        },
        orderedKeys: ['Title', 'Business']
      }
    );

    assert.equal(payload.Title, 'Alpha Project');
    assert.equal(payload.BusinessId, 12);
  });

  it('skips hidden fields such as auto-generated codes on edit', () => {
    const payload = buildListFormPayload(
      [titleField, codeField],
      { Title: 'Old title', Code: 'PROJ-2026-0001' },
      {
        entity: 'projects',
        mode: 'edit',
        fields: {
          Title: { label: 'Title', visible: true, required: true },
          Code: { label: 'Project Code', visible: false, required: false }
        },
        orderedKeys: ['Title', 'Code']
      }
    );

    assert.equal(payload.Title, 'Old title');
    assert.equal(payload.Code, undefined);
  });
});

describe('applyTitleFromFormValues', () => {
  it('forces Title from form values on update when config hides the field', () => {
    const payload = buildListFormPayload(
      [titleField, codeField],
      { Title: 'Legacy title', Code: '' },
      {
        entity: 'business',
        mode: 'edit',
        fields: {
          Title: { label: 'Title', visible: false, required: true },
          Code: { label: 'Code', visible: false, required: false }
        },
        orderedKeys: ['Title', 'Code']
      }
    );

    assert.equal(payload.Title, undefined);

    const merged = applyTitleFromFormValues(payload, { Title: 'Renamed Business' });
    assert.equal(merged.Title, 'Renamed Business');
  });

  it('mirrors createListItemFromForm title merge for project payloads', () => {
    const values = { Title: 'E2E Project 42', Business: '3' };
    const payload = applyTitleFromFormValues(
      buildListFormPayload([titleField, businessField], values, {
        entity: 'projects',
        mode: 'create',
        fields: {
          Title: { label: 'Title', visible: true, required: true },
          Business: { label: 'Business', visible: true, required: false }
        },
        orderedKeys: ['Title', 'Business']
      }),
      values
    );

    assert.equal(payload.Title, 'E2E Project 42');
    assert.equal(payload.BusinessId, 3);
  });
});
