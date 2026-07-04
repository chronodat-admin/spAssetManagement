import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canRunAutomaticSampleSeed,
  isSampleDataSeeded,
  SAMPLE_DATA_SEEDED_VALUE
} from '../lib/utils/sampleDataSeed.js';

describe('sample data seed lock', () => {
  it('treats Yes as seeded', () => {
    assert.equal(isSampleDataSeeded({ SampleDataSeeded: SAMPLE_DATA_SEEDED_VALUE }), true);
    assert.equal(isSampleDataSeeded({ SampleDataSeeded: 'yes' }), true);
    assert.equal(canRunAutomaticSampleSeed({ SampleDataSeeded: 'Yes' }), false);
  });

  it('allows automatic seed when flag is missing or No', () => {
    assert.equal(isSampleDataSeeded(undefined), false);
    assert.equal(isSampleDataSeeded({ SampleDataSeeded: 'No' }), false);
    assert.equal(canRunAutomaticSampleSeed(undefined), true);
    assert.equal(canRunAutomaticSampleSeed({ SampleDataSeeded: 'No' }), true);
  });
});
