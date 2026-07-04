import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectSeedKeyVariants,
  dedupeSeedRows,
  getSeedRowKey,
  isSeedRowIndexed,
  markSeedRowIndexed
} from '../lib/utils/seedDedup.js';

const PROJECTS_LIST_TITLE = 'Projects';

describe('seed deduplication', () => {
  it('uses project code as the primary seed key', () => {
    const row = {
      Title: 'ISO 27001 Compliance Program',
      BusinessTitle: 'Marketing',
      Code: 'PRJ-001'
    };

    assert.equal(getSeedRowKey(PROJECTS_LIST_TITLE, row), 'code:prj-001');
    assert.deepEqual(collectSeedKeyVariants(PROJECTS_LIST_TITLE, row), [
      'code:prj-001',
      'title:iso 27001 compliance program',
      'marketing::iso 27001 compliance program'
    ]);
  });

  it('dedupes duplicate seed rows in one pass', () => {
    const rows = dedupeSeedRows(PROJECTS_LIST_TITLE, [
      {
        Title: 'Digital Transformation',
        BusinessTitle: 'Marketing',
        Code: 'PRJ-004'
      },
      {
        Title: 'Digital Transformation Copy',
        BusinessTitle: 'Marketing',
        Code: 'PRJ-004'
      }
    ]);

    assert.equal(rows.length, 1);
  });

  it('tracks rows added during the same seed pass', () => {
    const index = new Set();
    const row = {
      Title: 'Budget Planning 2026',
      BusinessTitle: 'Finance',
      Code: 'PRJ-005'
    };

    assert.equal(isSeedRowIndexed(index, PROJECTS_LIST_TITLE, row), false);
    markSeedRowIndexed(index, PROJECTS_LIST_TITLE, row);
    assert.equal(isSeedRowIndexed(index, PROJECTS_LIST_TITLE, row), true);
    assert.equal(
      isSeedRowIndexed(index, PROJECTS_LIST_TITLE, {
        Title: 'Budget Planning 2026 duplicate',
        BusinessTitle: 'Finance',
        Code: 'PRJ-005'
      }),
      true
    );
  });
});
