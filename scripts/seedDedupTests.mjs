import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSeedExistenceFilters,
  collectSeedKeyVariants,
  dedupeSeedRows,
  getSeedRowKey,
  isSeedRowIndexed,
  markSeedRowIndexed
} from '../lib/utils/seedDedup.js';

const PROJECTS_LIST_TITLE = 'AM_Projects';

describe('seed deduplication', () => {
  it('uses project code as the primary seed key', () => {
    const row = {
      Title: 'Office Refresh 2026',
      AM_Code: 'PRJ-001'
    };

    assert.equal(getSeedRowKey(PROJECTS_LIST_TITLE, row), 'code:prj-001');
  });

  it('uses legacy Projects list title with Code field', () => {
    const row = {
      Title: 'ISO 27001 Compliance Program',
      BusinessTitle: 'Marketing',
      Code: 'PRJ-001'
    };

    assert.equal(getSeedRowKey('Projects', row), 'code:prj-001');
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

  it('uses AM_Code filters for AM_Projects (not legacy Code column)', () => {
    const row = {
      Title: 'Office Refresh 2026',
      AM_Code: 'PRJ-001'
    };

    const filters = buildSeedExistenceFilters(PROJECTS_LIST_TITLE, row);
    assert.ok(filters.some((filter) => filter.startsWith('AM_Code eq')));
    assert.ok(!filters.some((filter) => filter.startsWith('Code eq')));
  });

  it('uses legacy Code filters for the old Projects list', () => {
    const row = {
      Title: 'ISO 27001 Compliance Program',
      Code: 'PRJ-001'
    };

    const filters = buildSeedExistenceFilters('Projects', row, { businessId: 3 });
    assert.ok(filters.some((filter) => filter.startsWith('Code eq')));
    assert.ok(!filters.some((filter) => filter.startsWith('AM_Code eq')));
    assert.ok(filters.some((filter) => filter.includes('BusinessId eq 3')));
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
