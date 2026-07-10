import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAuditDetailsPresentation,
  formatAuditActionLabel,
  formatAuditEntityLabel,
  humanizeAuditFieldName,
  stringifyAuditValue
} from '../lib/utils/auditLogDisplayUtils.js';
import {
  getAssessmentProgressRate,
  getAssessmentStatusAppearance,
  getComplianceRate,
  getComplianceRateColor,
  getItemStatusAppearance,
  groupControlsByCategory,
  summarizeAssessmentItems,
  summarizeAssessments
} from '../lib/utils/complianceAnalytics.js';
import {
  customFieldTypeUsesDateOnly,
  customFieldTypeUsesLookupList,
  customFieldTypeUsesOptions,
  mapCustomFieldTypeToSharePoint,
  normalizeCustomFieldType
} from '../lib/constants/customFieldTypes.js';
import { getSharePointApiAccessAdminUrl } from '../lib/constants/graphMailSend.js';
import {
  buildChoiceFieldFilter,
  buildLookupDeleteMessage,
  buildLookupIdFilter,
  escapeODataStringValue,
  getLookupReferenceDefinitions
} from '../lib/utils/lookupDeleteReferences.js';
import {
  FULL_LIST_PERMISSIONS,
  SP_PERMISSION,
  hasSpPermission,
  permissionsFromEffectivePermissions,
  permissionsFromLowMask
} from '../lib/utils/listPermissions.js';
import {
  buildRatingMap,
  buildConsequenceRatingMap,
  buildLikelihoodRatingMap
} from '../lib/utils/ratingLookup.js';
import {
  buildHeatmapMatrix,
  countByMatrixPriority,
  getAverageRiskAgeDays,
  getNumericRiskRating,
  isActiveRisk
} from '../lib/utils/riskMatrix.js';
import {
  buildFieldLookupTerms,
  isCustomDeletableField,
  isSharePointSystemFieldName,
  isVerifiedFieldMatch,
  toSharePointEncodedFieldName
} from '../lib/utils/sharePointFieldNames.js';
import { hasFullControlPermissions } from '../lib/utils/sitePermissions.js';
import {
  accountNameFromLoginName,
  getUserPhotoUrl,
  setUserPhotoBaseUrl
} from '../lib/utils/userPhoto.js';

describe('permission helpers and SharePoint field metadata', () => {
  it('decodes SharePoint permission masks', () => {
    const viewMask = SP_PERMISSION.ViewListItems | SP_PERMISSION.OpenItems;
    assert.equal(hasSpPermission(viewMask, SP_PERMISSION.ViewListItems), true);
    assert.deepEqual(permissionsFromLowMask(viewMask), {
      canView: true,
      canAdd: false,
      canEdit: false,
      canDelete: false
    });
    assert.deepEqual(permissionsFromEffectivePermissions(432, 0), FULL_LIST_PERMISSIONS);
    assert.equal(hasFullControlPermissions(431, 0), false);
    assert.equal(hasFullControlPermissions(432, 0), true);
  });

  it('matches and protects SharePoint fields during provisioning repairs', () => {
    assert.equal(toSharePointEncodedFieldName('Potential Cost'), 'Potential_x0020_Cost');
    assert.equal(isSharePointSystemFieldName('Title'), true);
    assert.equal(isCustomDeletableField({ InternalName: 'Title', Title: 'Title' }), false);
    assert.equal(isCustomDeletableField({ InternalName: 'CustomField', Title: 'Custom Field' }), true);
    assert.equal(
      isVerifiedFieldMatch(
        { InternalName: 'Potential_x0020_Cost', Title: 'Potential Cost' },
        'PotentialCost',
        'PotentialCost',
        'Potential Cost'
      ),
      true
    );
    assert.deepEqual(buildFieldLookupTerms('PotentialCost', 'Potential Cost'), [
      'Potential Cost',
      'Potential_x0020_Cost',
      'PotentialCost'
    ]);
  });
});

describe('custom field and lookup delete helpers', () => {
  it('normalizes custom field types and maps SharePoint field types', () => {
    assert.equal(normalizeCustomFieldType('textarea'), 'note');
    assert.equal(normalizeCustomFieldType('select'), 'dropdown');
    assert.equal(normalizeCustomFieldType('missing'), 'text');
    assert.equal(customFieldTypeUsesOptions('multichoice'), true);
    assert.equal(customFieldTypeUsesLookupList('lookup_multi'), true);
    assert.equal(customFieldTypeUsesDateOnly('date'), true);
    assert.equal(mapCustomFieldTypeToSharePoint('user_multi'), 'UserMulti');
  });

  it('builds safe lookup reference filters and delete messages', () => {
    assert.equal(getLookupReferenceDefinitions('AM_Categories').length > 0, true);
    assert.equal(escapeODataStringValue("Bob's"), "Bob''s");
    assert.equal(buildLookupIdFilter('AM_CategoryId', [3, 3, 0, -1, 4]), 'AM_CategoryId eq 3 or AM_CategoryId eq 4');
    assert.equal(
      buildChoiceFieldFilter(["Bob's", 'Alice'], ['Owner']),
      "Owner eq 'Bob''s' or Owner eq 'Alice'"
    );
    assert.equal(
      buildLookupDeleteMessage('Hardware', [{ listTitle: 'AM_Assets', displayLabel: 'Assets', count: 2 }]),
      'Delete Hardware? 2 records across other lists still reference this value. Update those records first, or confirm to attempt deletion.'
    );
  });
});

describe('audit display helpers', () => {
  it('formats action/entity labels and structured audit details', () => {
    assert.equal(formatAuditActionLabel('SETTINGS_UPDATE'), 'Settings updated');
    assert.equal(formatAuditActionLabel('BULK_UPDATE'), 'bulk update');
    assert.equal(formatAuditEntityLabel('FormTemplates'), 'Form templates');
    assert.equal(humanizeAuditFieldName('WorkflowSettings.emailDeliveryMode'), 'email Delivery Mode');
    assert.equal(stringifyAuditValue({ enabled: true, count: 2 }), 'enabled: Yes; count: 2');

    const presentation = buildAuditDetailsPresentation(
      JSON.stringify({
        Title: { old: 'Old', new: 'New' },
        WorkflowSettings: {
          old: JSON.stringify({ emailDeliveryMode: 'graph' }),
          new: JSON.stringify({ emailDeliveryMode: 'chronodatApi' })
        }
      }),
      'UPDATE',
      'AppSettings'
    );

    assert.equal(presentation.summary, 'Updated · Title, Workflow settings › email Delivery Mode');
    assert.equal(presentation.changes.length, 2);
    assert.equal(presentation.hasExpandableContent, true);
  });
});

describe('risk matrix, ratings, and compliance analytics', () => {
  it('calculates ratings, heatmaps, and active risk summaries', () => {
    const risks = [
      {
        Id: 1,
        Title: 'A',
        Riskstatus: 'Open',
        Likelihood: '(5) Almost Certain',
        Consequence: '(5) Critical',
        DateRiskIdentified: '2026-07-01T00:00:00Z'
      },
      {
        Id: 2,
        Title: 'B',
        Riskstatus: 'Closed',
        Likelihood: '(1) Rare',
        Consequence: '(1) Insignificant',
        DateRiskIdentified: '2026-07-02T00:00:00Z'
      },
      { Id: 3, Title: 'C', Riskstatus: 'Open' }
    ];
    const previousNow = Date.now;
    Date.now = () => new Date('2026-07-04T00:00:00Z').getTime();
    try {
      assert.equal(isActiveRisk(risks[0]), true);
      assert.equal(isActiveRisk(risks[1]), false);
      assert.equal(getNumericRiskRating('(5) Almost Certain', '(5) Critical'), 25);
      assert.equal(buildHeatmapMatrix(risks)[0][4].count, 1);
      assert.equal(countByMatrixPriority(risks).Critical, 1);
      assert.equal(countByMatrixPriority(risks)['Not Assessed'], 1);
      assert.equal(getAverageRiskAgeDays(risks), 2);
    } finally {
      Date.now = previousNow;
    }
  });

  it('builds rating lookup maps from seeded lookup rows', () => {
    const likelihoods = [
      { Id: 1, Title: 'Rare', Rating: '0.1' },
      { Id: 2, Title: '(5) Almost Certain', Rating: '0.9' }
    ];
    const consequences = [{ Id: 1, Title: 'Critical', Rating: '100' }];

    assert.equal(buildRatingMap(likelihoods, ['(1) Rare', '(5) Almost Certain'])['(1) Rare'], 0.1);
    assert.equal(buildLikelihoodRatingMap(likelihoods)['(5) Almost Certain'], 0.9);
    assert.equal(buildConsequenceRatingMap(consequences)['(5) Critical'], 100);
  });

  it('summarizes hidden compliance data consistently', () => {
    assert.equal(getComplianceRate({ compliantItems: 7, totalItems: 10 }), 70);
    assert.equal(getAssessmentProgressRate({ assessedItems: 3, totalItems: 4 }), 75);
    assert.deepEqual(
      summarizeAssessments([
        { status: 'In Progress', assessedItems: 3, totalItems: 4, compliantItems: 2 },
        { status: 'Complete', assessedItems: 2, totalItems: 2, compliantItems: 2 }
      ]),
      {
        inProgressCount: 1,
        totalAssessed: 5,
        totalItems: 6,
        totalCompliant: 4,
        overallComplianceRate: 67,
        statusCounts: { Draft: 0, 'In Progress': 1, Complete: 1 }
      }
    );
    assert.equal(
      summarizeAssessmentItems([
        { status: 'Compliant' },
        { status: 'Non-Compliant' },
        { status: 'Not Applicable' }
      ]).assessmentProgress,
      100
    );
    assert.deepEqual(groupControlsByCategory([{ category: 'Access' }, { category: 'Backup' }]).map((group) => group.category), ['Access', 'Backup']);
    assert.equal(getAssessmentStatusAppearance('Complete').color, 'success');
    assert.equal(getItemStatusAppearance('Non-Compliant').color, 'danger');
    assert.equal(getComplianceRateColor(39), '#dc2626');
  });
});

describe('admin links and user photos', () => {
  it('derives tenant admin URLs and SharePoint photo endpoints', () => {
    assert.equal(
      getSharePointApiAccessAdminUrl('https://contoso.sharepoint.com/sites/assets'),
      'https://contoso-admin.sharepoint.com/_layouts/15/online/AdminHome.aspx#/webApiPermissionManagement'
    );
    assert.equal(getSharePointApiAccessAdminUrl('not-a-url'), 'https://admin.microsoft.com/sharepoint');

    setUserPhotoBaseUrl('https://contoso.sharepoint.com/sites/assets');
    assert.equal(accountNameFromLoginName('i:0#.f|membership|alex@contoso.com'), 'alex@contoso.com');
    assert.equal(
      getUserPhotoUrl('alex@contoso.com', 'M'),
      'https://contoso.sharepoint.com/_layouts/15/userphoto.aspx?size=M&accountname=alex%40contoso.com'
    );
    assert.equal(getUserPhotoUrl('not-an-email'), undefined);
    setUserPhotoBaseUrl(undefined);
  });
});
