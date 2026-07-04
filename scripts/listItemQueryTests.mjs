import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildListItemQuery,
  findMissingListItemQueryFields,
  parseSelectFieldBases
} from '../lib/utils/listItemQuery.js';
import {
  BUSINESS_LIST_FIELDS,
  PROJECT_LIST_FIELDS
} from '../lib/constants/businessProjectFieldDefs.js';
import {
  RISK_LOOKUP_LOAD_FIELDS,
  RISK_SCALAR_LOAD_FIELDS,
  RISK_USER_LOAD_FIELDS
} from '../lib/constants/riskLoadFields.js';
import { RISK_DEFINITION_LOAD_FIELDS } from '../lib/constants/riskDefinitionLoadFields.js';

describe('buildListItemQuery', () => {
  it('builds business select and expand for all provisioned fields', () => {
    const query = buildListItemQuery(BUSINESS_LIST_FIELDS);
    const missing = findMissingListItemQueryFields(query.select, query.expand, BUSINESS_LIST_FIELDS);

    assert.deepEqual(missing, []);
    assert.equal(query.expand, 'Owner');
    assert.equal(buildListItemQuery(BUSINESS_LIST_FIELDS).select, query.select);
  });

  it('builds project select and expand including person/group fields', () => {
    const query = buildListItemQuery(PROJECT_LIST_FIELDS);
    const missing = findMissingListItemQueryFields(query.select, query.expand, PROJECT_LIST_FIELDS);

    assert.deepEqual(missing, []);
    assert.equal(query.expand, 'Business,Owner,ProjectManager,Sponsor');
    assert.equal(buildListItemQuery(PROJECT_LIST_FIELDS).select, query.select);
    assert.equal(parseSelectFieldBases(query.select).has('Sponsor'), true);
    assert.match(query.select, /Sponsor\/Id/);
    assert.match(query.select, /Sponsor\/Title/);
  });

  it('covers user fields as person/group lookups in project metadata', () => {
    const userFields = PROJECT_LIST_FIELDS.filter((field) => field.type === 'User');
    assert.deepEqual(
      userFields.map((field) => field.internalName).sort(),
      ['Owner', 'ProjectManager', 'Sponsor']
    );
    userFields.forEach((field) => {
      assert.equal(field.userSelectionMode, 'PeopleAndGroups');
    });
  });

  it('covers business owner as person/group lookup', () => {
    const owner = BUSINESS_LIST_FIELDS.find((field) => field.internalName === 'Owner');
    assert.equal(owner?.type, 'User');
    assert.equal(owner?.userSelectionMode, 'PeopleAndGroups');
  });
});

describe('risk load field coverage', () => {
  it('loads all non-hidden Risks list columns used by the app', () => {
    const scalarSet = new Set(RISK_SCALAR_LOAD_FIELDS);
    const lookupSet = new Set(RISK_LOOKUP_LOAD_FIELDS);
    const userSet = new Set(RISK_USER_LOAD_FIELDS);
    const missing = [];

    for (const field of RISK_DEFINITION_LOAD_FIELDS) {
      if (field.hidden) {
        continue;
      }

      if (field.type === 'User' || field.type === 'UserMulti') {
        if (!userSet.has(field.internalName) && field.internalName !== 'AssignedTo') {
          missing.push(`${field.internalName} (user expand)`);
        }
        continue;
      }

      if (field.type === 'Lookup' || field.type === 'LookupMulti') {
        if (!lookupSet.has(field.internalName)) {
          missing.push(`${field.internalName} (lookup)`);
        }
        continue;
      }

      if (!scalarSet.has(field.internalName)) {
        missing.push(`${field.internalName} (scalar)`);
      }
    }

    assert.deepEqual(missing, []);
    assert.equal(scalarSet.has('AssignedTo'), false);
    assert.equal(userSet.has('AssignedTo'), true);
  });
});
