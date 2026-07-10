import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SAMPLE_TAG_SEED_DATA,
  SAMPLE_TAG_SEED_IDS,
  SAMPLE_TAG_SEED_NAMES
} from '../lib/constants/sampleTagSeedData.js';
import { PROVISIONING_PROGRESS } from '../lib/utils/provisioningProgressLabels.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readSource(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('sample tag seed data', () => {
  it('defines unique demo tags with stable ids and colors', () => {
    assert.equal(SAMPLE_TAG_SEED_DATA.length >= 6, true);
    assert.equal(SAMPLE_TAG_SEED_IDS.size, SAMPLE_TAG_SEED_DATA.length);
    assert.equal(SAMPLE_TAG_SEED_NAMES.size, SAMPLE_TAG_SEED_DATA.length);

    for (const tag of SAMPLE_TAG_SEED_DATA) {
      assert.equal(Boolean(tag.id), true);
      assert.equal(Boolean(tag.name.trim()), true);
      assert.match(tag.color, /^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('wires onboarding seeding and clear-sample-data paths', () => {
    const provisioning = readSource('src/services/ListProvisioningService.ts');
    const assetService = readSource('src/services/AssetService.ts');

    assert.match(provisioning, /seedSampleTags/);
    assert.match(provisioning, /clearSampleTags/);
    assert.match(provisioning, /PROVISIONING_PROGRESS\.seedingTags/);
    assert.match(assetService, /public async seedSampleTags\(/);
    assert.match(assetService, /public async clearSampleTags\(/);
    assert.match(assetService, /SAMPLE_TAG_SEED_DATA/);
    assert.equal(PROVISIONING_PROGRESS.seedingTags, 'Adding sample tags…');
  });
});
