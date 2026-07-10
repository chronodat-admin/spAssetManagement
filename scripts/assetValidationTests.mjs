import { describe, it } from 'node:test';

import assert from 'node:assert/strict';

import {

  stripHtml,

  validateAppSettings,

  validateAssetForm,

  validateControlsEffectiveness,

  validateLookupItem

} from '../lib/utils/assetValidation.js';



const validAssetForm = {

  title: 'Laptop refresh',

  status: 'Available'

};



const legacyAssetForm = {

  title: 'Laptop refresh',

  categoryId: '1',

  businessId: '2',

  profileId: '3',

  likelihood: '(2) Unlikely',

  consequence: '(3) Moderate',

  status: 'Available'

};



describe('assetValidation', () => {

  it('validates required asset form fields and allowed statuses', () => {

    assert.equal(validateAssetForm({ ...validAssetForm, title: '   ' }), 'Asset name is required.');

    assert.equal(validateAssetForm({ ...validAssetForm, status: 'Retired' }), undefined);

    assert.equal(validateAssetForm({ ...validAssetForm, status: 'Invalid' }), 'Asset status is invalid.');

    assert.equal(validateAssetForm({ ...validAssetForm, status: 'Retired' }, ['Retired']), undefined);

  });



  it('validates legacy extended asset form fields when provided', () => {

    assert.equal(validateAssetForm({ ...legacyAssetForm, categoryId: '' }), 'Asset category is required.');

    assert.equal(validateAssetForm(legacyAssetForm), undefined);

  });



  it('validates lookup titles and duplicate detection', () => {

    const existing = [

      { id: 1, title: 'Hardware' },

      { id: 2, title: 'Software' }

    ];



    assert.equal(validateLookupItem({ title: '' }, existing), 'Title is required.');

    assert.equal(validateLookupItem({ title: 'hardware' }, existing), 'An item named "hardware" already exists.');

    assert.equal(validateLookupItem({ title: 'Hardware' }, existing, 1), undefined);

    assert.equal(validateLookupItem({ title: 'Likelihood' }, [], undefined, true), 'Rating is required for this list.');

  });



  it('validates app settings and text helpers', () => {

    assert.equal(validateAppSettings({ title: '', prefix: 'AM', colorScheme: 'Blue' }), 'App display name is required.');

    assert.equal(

      validateAppSettings({ title: 'Assets', prefix: 'THIS-PREFIX-IS-MUCH-TOO-LONG', colorScheme: 'Blue' }),

      'Asset ID prefix must be 20 characters or fewer.'

    );

    assert.equal(validateAppSettings({ title: 'Assets', prefix: 'AM', colorScheme: 'Blue' }), undefined);

    assert.equal(validateControlsEffectiveness('Good'), true);

    assert.equal(validateControlsEffectiveness('Great'), false);

    assert.equal(stripHtml('<p>Hello&nbsp;<strong>World</strong></p>'), 'Hello World');

  });

});

