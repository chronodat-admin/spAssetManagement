import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildAssetStatusIdCache,
  resolveAssetStatusIdFromCache
} from '../lib/utils/assignmentStatusLookup.js';
import { parseScannedBarcode, resolveScannedAsset } from '../lib/utils/barcodeUtils.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readSource(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('store validation fix — assignment status lookup payloads', () => {
  it('maps AM_AssetStatuses titles to lookup ids', () => {
    const cache = buildAssetStatusIdCache([
      { Id: 3, Title: 'Available' },
      { Id: 7, Title: 'Assigned' }
    ]);

    assert.equal(resolveAssetStatusIdFromCache(cache, 'Assigned'), 7);
    assert.equal(resolveAssetStatusIdFromCache(cache, 'Available'), 3);
  });

  it('throws when a seeded status title is missing', () => {
    const cache = buildAssetStatusIdCache([{ Id: 3, Title: 'Available' }]);

    assert.throws(
      () => resolveAssetStatusIdFromCache(cache, 'Assigned'),
      /Asset status "Assigned" was not found/
    );
  });

  it('writes AM_StatusId (not AM_Status strings) in AssignmentService', () => {
    const source = readSource('src/services/AssignmentService.ts');

    assert.match(source, /AM_StatusId:\s*assignedStatusId/);
    assert.match(source, /AM_StatusId:\s*availableStatusId/);
    assert.match(source, /resolveAssetStatusId\('Assigned'\)/);
    assert.match(source, /resolveAssetStatusId\(resolveStatusAfterReturn\(\)\)/);
    assert.doesNotMatch(source, /AM_Status:\s*'Assigned'/);
    assert.doesNotMatch(source, /AM_Status:\s*resolveStatusAfterReturn\(\)/);
    assert.match(source, /buildAssetStatusIdCache/);
    assert.match(source, /resolveAssetStatusIdFromCache/);
  });

  it('keeps assignment list lookups on *Id fields for SharePoint REST', () => {
    const source = readSource('src/services/AssignmentService.ts');

    assert.match(source, /AM_AssetId:\s*input\.assetId/);
    assert.match(source, /AM_AssignedToId:\s*input\.assigneeUserId/);
    assert.doesNotMatch(source, /AM_Asset:\s*input\.assetId/);
    assert.doesNotMatch(source, /AM_AssignedTo:\s*input\.assigneeUserId/);
  });
});

describe('store validation fix — Teams navigation drawer', () => {
  it('uses a Teams drawer instead of a persistent icon rail in AssetManagementShell', () => {
    const source = readSource('src/components/Layout/AssetManagementShell.tsx');

    assert.match(source, /const teamsDrawerNav = isTeamsHost/);
    assert.match(source, /const navAsDrawer = isMobile \|\| teamsDrawerNav/);
    assert.match(source, /collapsed=\{!navAsDrawer && sidebarCollapsed\}/);
    assert.match(source, /mobile=\{navAsDrawer\}/);
    assert.match(source, /teamsHost=\{teamsDrawerNav\}/);
    assert.match(source, /\{navAsDrawer && \(/);
    assert.doesNotMatch(source, /collapsed=\{!isMobile && sidebarCollapsed\}/);
  });

  it('disables icon-only collapse controls in Sidebar when hosted in Teams', () => {
    const source = readSource('src/components/Layout/Sidebar.tsx');

    assert.match(source, /teamsHost\?: boolean/);
    assert.match(source, /const showLabels = mobile \|\| teamsHost \|\| !collapsed/);
    assert.match(source, /const allowCollapse = !mobile && !teamsHost/);
    assert.match(source, /!mobile && !teamsHost && onToggleCollapse/);
    assert.match(source, /!mobile && collapsed && allowCollapse/);
  });
});

describe('store validation fix — barcode camera fallback', () => {
  const sampleAssets = [
    { Id: 12, Title: 'Laptop', AM_AssetId: 'AST-2026-0012', AM_Barcode: 'BC-0012' },
    { Id: 15, Title: 'Monitor', AM_SerialNumber: 'SN-7788' }
  ];

  it('resolves assets from plain barcodes and QR JSON payloads', () => {
    assert.equal(resolveScannedAsset(sampleAssets, 'BC-0012')?.Id, 12);
    assert.equal(resolveScannedAsset(sampleAssets, 'SN-7788')?.Id, 15);
    assert.equal(
      resolveScannedAsset(sampleAssets, JSON.stringify({ assetId: 'AST-2026-0012' }))?.Id,
      12
    );
    assert.equal(resolveScannedAsset(sampleAssets, 'missing-code'), undefined);
  });

  it('parses QR JSON before matching assets', () => {
    assert.equal(parseScannedBarcode(JSON.stringify({ barcode: 'BC-0012' })), 'BC-0012');
    assert.equal(parseScannedBarcode(JSON.stringify({ id: 12 })), 'AM-12');
  });

  it('starts the camera before choosing BarcodeDetector or ZXing fallback', () => {
    const source = readSource('src/components/Operations/BarcodeScannerPage.tsx');

    assert.match(source, /@zxing\/browser/);
    assert.match(source, /BrowserMultiFormatReader/);
    assert.match(source, /decodeFromVideoElement/);
    assert.match(source, /navigator\.mediaDevices\?\.getUserMedia/);
    assert.match(source, /if \('BarcodeDetector' in window\)/);
    assert.match(source, /await startBarcodeDetector\(\)/);
    assert.match(source, /await startZxingScanner\(\)/);
    assert.match(source, /BrowserMultiFormatReader\.releaseAllStreams/);
    assert.doesNotMatch(source, /if \(!\('BarcodeDetector' in window\) \|\| !navigator\.mediaDevices/);
  });

  it('declares @zxing/browser in package dependencies', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    assert.ok(pkg.dependencies['@zxing/browser']);
  });
});

describe('store validation fix — validator test instructions', () => {
  it('documents how to test the form customizer and operations flows', () => {
    const docPath = path.join(root, 'docs/store-submission/04-validation-test-instructions.md');
    const doc = fs.readFileSync(docPath, 'utf8');

    assert.match(doc, /Form customizer extension/);
    assert.match(doc, /AM_Assets/);
    assert.match(doc, /Assign Asset/);
    assert.match(doc, /Return Asset/);
    assert.match(doc, /Book Asset/);
    assert.match(doc, /Scan Asset/);
    assert.match(doc, /hamburger/);
    assert.match(doc, /Open Asset Management/);
  });

  it('links the validation guide from the store submission index', () => {
    const readme = readSource('docs/store-submission/README.md');
    assert.match(readme, /04-validation-test-instructions\.md/);
  });
});
