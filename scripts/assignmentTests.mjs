import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAssignedToUser,
  isReturnableAsset,
  resolveStatusAfterReturn,
  validateAssignInput,
  validateBookInput,
  validateReturnInput,
  isBookableAsset
} from '../lib/utils/assignmentUtils.js';

describe('assignmentUtils', () => {
  it('validates assign input', () => {
    assert.equal(validateAssignInput(0, 5), 'Select an asset.');
    assert.equal(validateAssignInput(10, 0), 'Select an assignee.');
    assert.equal(validateAssignInput(10, 5), undefined);
  });

  it('validates return input', () => {
    assert.equal(validateReturnInput(0), 'Select an asset to return.');
    assert.equal(validateReturnInput(12), undefined);
  });

  it('detects returnable assigned assets', () => {
    assert.equal(isReturnableAsset({ Id: 1, Title: 'Laptop', AM_Status: 'Assigned' }), true);
    assert.equal(isReturnableAsset({ Id: 2, Title: 'Chair', AM_Status: 'Available' }), false);
    assert.equal(isReturnableAsset({ Id: 3, Title: 'Deleted', AM_IsDeleted: true, AM_Status: 'Assigned' }), false);
  });

  it('resolves status after return', () => {
    assert.equal(resolveStatusAfterReturn(), 'Available');
  });

  it('validates book input', () => {
    assert.equal(validateBookInput(0, 5), 'Select an asset.');
    assert.equal(validateBookInput(10, 0), 'Select a requester.');
    assert.equal(validateBookInput(10, 5), undefined);
  });

  it('detects bookable non-deleted assets', () => {
    assert.equal(isBookableAsset({ Id: 1, Title: 'Laptop' }), true);
    assert.equal(isBookableAsset({ Id: 2, Title: 'Removed', AM_IsDeleted: true }), false);
  });

  it('matches assigned assets to the current user', () => {
    const asset = {
      Id: 1,
      Title: 'Laptop',
      AM_AssignedTo: { Id: 7, Title: 'Alex Owner', Email: 'Alex@Example.com' }
    };

    assert.equal(isAssignedToUser(asset, { id: 7 }), true);
    assert.equal(isAssignedToUser(asset, { email: 'alex@example.com' }), true);
    assert.equal(isAssignedToUser(asset, { displayName: 'Alex Owner' }), true);
    assert.equal(isAssignedToUser(asset, { id: 99 }), false);
  });
});
