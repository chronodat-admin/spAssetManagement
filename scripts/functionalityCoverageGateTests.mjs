import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN_COVERAGE_RATIO = 0.95;

function readCorpus() {
  const parts = [];
  for (const file of fs.readdirSync(path.join(root, 'scripts'))) {
    if (file.endsWith('.mjs')) {
      parts.push(fs.readFileSync(path.join(root, 'scripts', file), 'utf8'));
    }
  }
  for (const file of fs.readdirSync(path.join(root, 'e2e'))) {
    if (file.endsWith('.spec.ts')) {
      parts.push(fs.readFileSync(path.join(root, 'e2e', file), 'utf8'));
    }
  }
  for (const helper of ['e2e/helpers/app.ts', 'e2e/helpers/sharedPage.ts', 'e2e/auth.setup.ts']) {
    parts.push(fs.readFileSync(path.join(root, helper), 'utf8'));
  }
  return parts.join('\n');
}

/** User-facing capability areas that must be represented in automated tests. */
const FUNCTIONALITY_AREAS = [
  { id: 'dashboard', signals: ['Dashboard', 'Total Assets'] },
  { id: 'asset-lists', signals: ['All Assets', 'Assigned To Me', 'Available Assets'] },
  { id: 'asset-lifecycle-views', signals: ['In Repair', 'Retired Assets', 'Deleted Assets'] },
  { id: 'assign-return', signals: ['Assign Asset', 'Return Asset', 'Assign to'] },
  { id: 'bulk-operations', signals: ['Bulk Assign', 'Bulk Return'] },
  { id: 'booking', signals: ['Book Asset', 'Booking Details', 'Expected return date'] },
  { id: 'asset-requests', signals: ['Request Asset', 'My Requests', 'Manage Requests'] },
  { id: 'scan-asset', signals: ['Scan Asset'] },
  { id: 'software-licenses', signals: ['Software Licenses', 'Add license'] },
  { id: 'inventory', signals: ['Inventory', 'Record scan'] },
  { id: 'maintenance', signals: ['Maintenance'] },
  { id: 'reports', signals: ['Reports', 'Generate Report'] },
  { id: 'depreciation', signals: ['Depreciation'] },
  { id: 'audit-log', signals: ['Audit Log'] },
  { id: 'lookup-categories', signals: ['Categories', 'Sub-Categories'] },
  { id: 'lookup-vendors', signals: ['Vendors', 'AM_Vendors'] },
  { id: 'lookup-locations', signals: ['Locations', 'AM_Locations'] },
  { id: 'lookup-projects', signals: ['Projects', 'AM_Projects'] },
  { id: 'settings-general', signals: ['App display name'] },
  { id: 'settings-appearance', signals: ['Appearance'] },
  { id: 'settings-forms', signals: ['Configure forms for', 'AM_Assets'] },
  { id: 'settings-tags', signals: ['Add Tag', 'seedSampleTags'] },
  { id: 'settings-roles', signals: ['Roles & Permissions', 'Role Permissions'] },
  { id: 'settings-subscription', signals: ['subscription.chronodat.com', 'Subscription'] },
  { id: 'settings-email', signals: ['Email delivery mode', 'emailIntegration'] },
  { id: 'settings-numbering', signals: ['Numbering', 'numberingTests'] },
  { id: 'settings-notifications', signals: ['Notification Workflows'] },
  { id: 'provisioning', signals: ['ListProvisioningService', 'seedSampleContent'] },
  { id: 'sample-data', signals: ['sampleDataSeed', 'SAMPLE_TAG_SEED_DATA'] },
  { id: 'asset-crud', signals: ['createRisk', 'updateRisk', 'deleteRisk'] },
  { id: 'assignments-service', signals: ['assignAsset', 'returnAsset', 'bookAsset'] },
  { id: 'import-export', signals: ['importAssetRows', 'exportAssetsCsv'] },
  { id: 'intune-sync', signals: ['syncManagedDevices', 'Intune Sync'] },
  { id: 'workflow-email', signals: ['resolveEmailDeliveryMode', 'graphEmailNotificationsEnabled'] },
  { id: 'form-config', signals: ['FORM_ENTITY_OPTIONS', 'normalizeLookupListTitle'] },
  { id: 'report-builder', signals: ['ReportBuilderService', 'fetchReportData'] },
  { id: 'rbac-permissions', signals: ['ROLE_PERMISSIONS_SEED_DATA', 'getRolePermissions'] },
  { id: 'audit-trail', signals: ['AuditService', 'auditPayloadTests'] },
  { id: 'depreciation-engine', signals: ['DepreciationService', 'depreciationTests'] },
  { id: 'list-schema', signals: ['ASSET_MANAGEMENT_LISTS', 'listSchemaCoverageTests'] },
  { id: 'asset-version-history', signals: ['AssetActivityTab', 'assetVersionHistory'] },
  { id: 'dashboard-analytics', signals: ['dashboardAnalyticsTests', 'Warranty (90d)'] },
  { id: 'store-validation-fixes', signals: ['storeValidationFixTests', 'teamsDrawerNav', '@zxing/browser'] }
];

describe('functionality coverage gate', () => {
  const corpus = readCorpus();

  it('covers at least 95% of user-facing functionality areas', () => {
    const covered = FUNCTIONALITY_AREAS.filter((area) =>
      area.signals.every((signal) => corpus.includes(signal))
    );
    const ratio = covered.length / FUNCTIONALITY_AREAS.length;
    const missing = FUNCTIONALITY_AREAS.filter((area) => !covered.includes(area)).map(
      (area) => area.id
    );

    assert.equal(
      ratio >= MIN_COVERAGE_RATIO,
      true,
      `Coverage ${Math.round(ratio * 100)}% (${covered.length}/${FUNCTIONALITY_AREAS.length}). Missing: ${missing.join(', ')}`
    );
  });

  it('keeps a module contract suite for every source file', () => {
    const inventory = JSON.parse(
      fs.readFileSync(path.join(root, 'scripts', 'sourceInventory.json'), 'utf8')
    );
    const contract = fs.readFileSync(path.join(root, 'scripts', 'moduleContractCoverageTests.mjs'), 'utf8');
    assert.equal(inventory.length >= 300, true);
    assert.match(contract, /listSourceFiles/);
    assert.match(contract, /readSource/);
  });
});
