import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ASSET_MANAGEMENT_LISTS,
  APP_MANAGED_LIST_TITLES,
  REQUIRED_LIST_TITLES,
  ASSETS_LIST_TITLE,
  SETTINGS_LIST_TITLE,
  AUDIT_LOG_LIST_TITLE
} from '../lib/models/IListDefinitions.js';
import {
  ASSET_SCALAR_LOAD_FIELDS,
  ASSET_LOOKUP_LOAD_FIELDS,
  ASSET_USER_LOAD_FIELDS
} from '../lib/constants/assetLoadFields.js';
import { ASSET_SEED_DATA } from '../lib/constants/assetSeedData.js';
import { ASSET_SUB_CATEGORY_SEED_DATA } from '../lib/constants/assetSubCategorySeedData.js';
import { SOFTWARE_LICENSE_SEED_DATA } from '../lib/constants/softwareLicenseSeedData.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SEED_HELPER_FIELD_KEYS = new Set([
  'ImageSeedKey',
  'ParentCategoryTitle',
  'BusinessTitle',
  'CategoryTitle',
  'SubCategoryTitle',
  'AssetTypeTitle',
  'StatusTitle',
  'VendorTitle',
  'LocationTitle',
  'ProjectTitle',
  'RiskCategoryTitle',
  'RiskProfileTypeTitle',
  'RiskResponseTitle',
  'RiskStrategyTitle',
  'AssignToCurrentUser'
]);

const FULL_SCHEMA_LIST_TITLES = new Set([
  ASSETS_LIST_TITLE,
  'AM_Assignments',
  'AM_SoftwareLicenses',
  'AM_Maintenance',
  'AM_Inventory'
]);

function readSource(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function listFieldMap() {
  const map = new Map();
  for (const def of ASSET_MANAGEMENT_LISTS) {
    map.set(
      def.title,
      new Set(def.fields.map((field) => field.internalName))
    );
  }
  return map;
}

function parseAppSettingsSelectFields() {
  const source = readSource('src/services/AssetService.ts');
  const match = source.match(/getItems<IAppSettings>\(\s*SETTINGS_LIST_TITLE,\s*'([^']+)'/);
  assert.ok(match, 'AppSettings getItems $select not found in AssetService');
  return match[1]
    .split(',')
    .map((field) => field.trim())
    .filter((field) => field && field !== 'Id' && field !== 'Title');
}

function assertFieldsDefined(listTitle, fieldNames, fieldsByList, label) {
  const defined = fieldsByList.get(listTitle) || new Set();
  const missing = fieldNames.filter((name) => !defined.has(name));
  assert.deepEqual(
    missing,
    [],
    `${label}: ${listTitle} is missing field definitions for ${missing.join(', ')}`
  );
}

describe('list schema coverage', () => {
  const fieldsByList = listFieldMap();
  const managedTitles = new Set(APP_MANAGED_LIST_TITLES);

  it('keeps REQUIRED_LIST_TITLES aligned with provisioned lists', () => {
    const required = new Set(REQUIRED_LIST_TITLES);
    const managed = new Set(APP_MANAGED_LIST_TITLES);

    assert.deepEqual(
      [...required].filter((title) => !managed.has(title)).sort(),
      [],
      'REQUIRED_LIST_TITLES contains titles not in ASSET_MANAGEMENT_LISTS'
    );
    assert.deepEqual(
      [...managed].filter((title) => !required.has(title)).sort(),
      [],
      'ASSET_MANAGEMENT_LISTS contains titles not in REQUIRED_LIST_TITLES'
    );
  });

  it('defines valid lookup targets and SharePoint-safe internal names', () => {
    const issues = [];

    for (const def of ASSET_MANAGEMENT_LISTS) {
      const names = def.fields.map((field) => field.internalName);
      const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
      if (duplicates.length > 0) {
        issues.push(`${def.title}: duplicate internal names ${[...new Set(duplicates)].join(', ')}`);
      }

      for (const field of def.fields) {
        if (field.internalName.length > 32) {
          issues.push(`${def.title}: ${field.internalName} exceeds 32 characters`);
        }

        if (field.type === 'Lookup' || field.type === 'LookupMulti') {
          if (!field.lookupListTitle) {
            issues.push(`${def.title}: ${field.internalName} missing lookupListTitle`);
          } else if (!managedTitles.has(field.lookupListTitle)) {
            issues.push(
              `${def.title}: ${field.internalName} lookup target "${field.lookupListTitle}" is not managed`
            );
          }
        }
      }
    }

    assert.deepEqual(issues, []);
  });

  it('covers AppSettings and audit columns referenced by services', () => {
    assertFieldsDefined(
      SETTINGS_LIST_TITLE,
      parseAppSettingsSelectFields(),
      fieldsByList,
      'AppSettings service select'
    );

    assertFieldsDefined(
      AUDIT_LOG_LIST_TITLE,
      ['Entity', 'EntityId', 'Action', 'UserDisplayName', 'UserEmail', 'Details'],
      fieldsByList,
      'AuditService write/read'
    );
  });

  it('covers AM_Assets load fields used by AssetService queries', () => {
    const assetFields = fieldsByList.get(ASSETS_LIST_TITLE) || new Set();
    const missing = [];

    for (const field of ASSET_SCALAR_LOAD_FIELDS) {
      if (!assetFields.has(field)) {
        missing.push(`${field} (scalar load)`);
      }
    }
    for (const field of ASSET_LOOKUP_LOAD_FIELDS) {
      if (!assetFields.has(field)) {
        missing.push(`${field} (lookup load)`);
      }
    }
    for (const field of ASSET_USER_LOAD_FIELDS) {
      if (!assetFields.has(field)) {
        missing.push(`${field} (user load)`);
      }
    }

    assert.deepEqual(missing, []);
  });

  it('keeps seed catalogs aligned with list field definitions', () => {
    const seedCatalogs = [
      { listTitle: ASSETS_LIST_TITLE, rows: ASSET_SEED_DATA },
      { listTitle: 'AM_SubCategories', rows: ASSET_SUB_CATEGORY_SEED_DATA },
      { listTitle: 'AM_SoftwareLicenses', rows: SOFTWARE_LICENSE_SEED_DATA }
    ];

    const issues = [];

    for (const catalog of seedCatalogs) {
      const defined = fieldsByList.get(catalog.listTitle) || new Set();
      for (const row of catalog.rows) {
        for (const key of Object.keys(row)) {
          if (key === 'Title' || SEED_HELPER_FIELD_KEYS.has(key)) {
            continue;
          }
          if (!defined.has(key)) {
            issues.push(`${catalog.listTitle} seed row references undefined field "${key}"`);
          }
        }
      }
    }

    assert.deepEqual(issues, []);
  });

  it('marks asset and operations lists for full schema verification', () => {
    const expected = [
      'AM_Assets',
      'AM_Assignments',
      'AM_SoftwareLicenses',
      'AM_Maintenance',
      'AM_Inventory'
    ];

    assert.deepEqual([...FULL_SCHEMA_LIST_TITLES].sort(), expected.sort());

    const source = readSource('src/services/ListProvisioningService.ts');
    assert.match(source, /FULL_SCHEMA_LIST_TITLES/);
    assert.match(source, /ensureListSchemaVerified/);
    assert.match(source, /getSchemaCheckFieldNames/);
  });
});
