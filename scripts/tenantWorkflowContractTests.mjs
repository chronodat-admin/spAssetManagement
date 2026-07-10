import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readSource(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('tenant workflow contracts', () => {
  it('keeps provisioning smoke coverage paths for permissions, required lists, fields, and form customizer', () => {
    const source = readSource('src/services/ListProvisioningService.ts');

    assert.match(source, /checkProvisioningNeeded/);
    assert.match(source, /getProvisioningStatus/);
    assert.match(source, /this\.rest\.isCurrentUserSiteOwner/);
    assert.match(source, /ensureList\(def\)/);
    assert.match(source, /ensureListFieldsOnList/);
    assert.match(source, /this\.rest\.ensureAssetFormCustomizerRegistered/);
    assert.match(source, /ensureListAttachmentsEnabled/);
    assert.match(source, /this\.updateStep\(steps, 'ready', 'done'/);
  });

  it('keeps SharePoint REST error, permission, attachment, and version-history paths covered by contracts', () => {
    const source = readSource('src/services/SharePointRestService.ts');

    for (const method of [
      'getWebEffectiveBasePermissions',
      'getEffectiveBasePermissions',
      'getListItemVersions',
      'getItemAttachments',
      'addItemAttachment',
      'deleteItemAttachment',
      'ensureListAttachmentsEnabled'
    ]) {
      assert.match(source, new RegExp(`public async ${method}\\(`));
    }

    assert.match(source, /throw new Error\(`Unable to read site permissions/);
    assert.match(source, /throw new Error\(`Failed to load version history/);
    assert.match(source, /throw new Error\(`Failed to load attachments/);
    assert.match(source, /throw new Error\(`Failed to upload "\$\{fileName\}"/);
    assert.match(source, /throw new Error\(`Failed to delete "\$\{fileName\}"/);
  });

  it('keeps asset lifecycle mutation paths wired for tenant-backed E2E tests', () => {
    const assetService = readSource('src/services/AssetService.ts');
    const assignmentService = readSource('src/services/AssignmentService.ts');

    for (const method of ['createRisk', 'updateRisk', 'deleteRisk', 'deleteRisks']) {
      assert.match(assetService, new RegExp(`public async ${method}\\(`));
    }

    for (const method of ['assignAsset', 'bookAsset', 'returnAsset', 'cancelBook']) {
      assert.match(assignmentService, new RegExp(`public async ${method}\\(`));
    }

    assert.match(assetService, /private async logAudit/);
    assert.match(assetService, /this\.audit\.write/);
    assert.match(assetService, /this\.rest\.deleteItem\('AM_Assets', id\)/);
    assert.match(assignmentService, /AM_Status/);
    assert.match(assignmentService, /updateItem\(ASSETS_LIST_TITLE/);
  });

  it('keeps report builder service data-source contracts intact', () => {
    const source = readSource('src/services/ReportBuilderService.ts');

    assert.match(source, /getAvailableColumns/);
    assert.match(source, /fetchReportData/);
    assert.match(source, /case 'risks':/);
    assert.match(source, /case 'business':/);
    assert.match(source, /case 'projects':/);
    assert.match(source, /mapRiskToRow/);
    assert.match(source, /parseTemplateDataJson/);
  });
});
