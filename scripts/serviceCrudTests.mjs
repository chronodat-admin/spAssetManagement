import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readSource(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('service contracts', () => {
  it('keeps software, inventory, and maintenance CRUD methods wired to managed lists', () => {
    const software = readSource('src/services/SoftwareLicenseService.ts');
    const inventory = readSource('src/services/InventoryService.ts');
    const maintenance = readSource('src/services/MaintenanceService.ts');

    for (const method of ['getLicenses', 'createLicense', 'updateLicense', 'deleteLicense']) {
      assert.match(software, new RegExp(`public async ${method}\\(`));
    }
    assert.match(software, /SOFTWARE_LICENSES_LIST_TITLE/);

    for (const method of ['getScans', 'createScan', 'updateScan', 'deleteScan']) {
      assert.match(inventory, new RegExp(`public async ${method}\\(`));
    }
    assert.match(inventory, /INVENTORY_LIST_TITLE/);

    for (const method of ['getRecords', 'createRecord', 'updateRecord', 'deleteRecord']) {
      assert.match(maintenance, new RegExp(`public async ${method}\\(`));
    }
    assert.match(maintenance, /MAINTENANCE_LIST_TITLE/);
  });

  it('keeps import/export and Intune sync protections in place', () => {
    const importExport = readSource('src/services/ImportExportService.ts');
    const intune = readSource('src/services/IntuneSyncService.ts');

    assert.match(importExport, /exportAssetsCsv/);
    assert.match(importExport, /importAssetRows/);
    assert.match(importExport, /rows\.filter\(\(row\) => row\.Title\?\.trim\(\)\)/);
    assert.match(importExport, /AM_IsDeleted eq false/);
    assert.match(importExport, /text\.replace\(\/"\/g, '""'\)/);

    assert.match(intune, /syncManagedDevices/);
    assert.match(intune, /byDeviceId/);
    assert.match(intune, /bySerial/);
    assert.match(intune, /result\.skipped \+= 1/);
    assert.match(intune, /AM_IntuneDeviceId/);
  });
});
