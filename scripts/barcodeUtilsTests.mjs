import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAssetBarcodeValue,
  buildAssetQrValue,
  encodeCode128,
  findAssetByScanValue,
  generateBarcodeSvg,
  generateQrDataUrl,
  parseScannedBarcode
} from '../lib/utils/barcodeUtils.js';

// Code 128 Start B pattern (symbol 104) and Stop pattern (symbol 106).
const CODE128_START_B = '11010010000';
const CODE128_STOP = '1100011101011';

describe('Code 128 encoding', () => {
  it('encodes a known value to the canonical module string', () => {
    // Value "A": Start B (104) + data 33 + checksum 34 + Stop (106).
    const expected = '1101001000010100011000100010110001100011101011';
    assert.equal(encodeCode128('A'), expected);
  });

  it('always frames the symbol with Start B and Stop patterns', () => {
    const modules = encodeCode128('AM-1024');
    assert.ok(modules.startsWith(CODE128_START_B), 'should start with Start B');
    assert.ok(modules.endsWith(CODE128_STOP), 'should end with Stop');
    // Each 11-module symbol plus the 13-module stop keeps the total consistent.
    assert.equal((modules.length - CODE128_STOP.length) % 11, 0);
  });

  it('falls back to a scannable symbol for empty or non-encodable input', () => {
    const emptyModules = encodeCode128('');
    assert.ok(emptyModules.startsWith(CODE128_START_B));
    assert.ok(emptyModules.endsWith(CODE128_STOP));
    // Non-ASCII characters are dropped rather than corrupting the symbol.
    assert.equal(encodeCode128('日本'), encodeCode128('0'));
  });
});

describe('barcode SVG rendering', () => {
  it('renders a real Code 128 SVG with bars and the human-readable value', () => {
    const svg = generateBarcodeSvg('AM-1024');
    assert.ok(svg.includes('<svg'), 'is an svg');
    assert.ok(svg.includes('<rect'), 'contains bar rects');
    assert.ok(svg.includes('AM-1024'), 'includes the printed value');
  });

  it('escapes unsafe characters in the printed value', () => {
    const svg = generateBarcodeSvg('A&B');
    assert.ok(svg.includes('A&amp;B'));
    assert.ok(!svg.includes('A&B<'));
  });
});

describe('QR generation', () => {
  it('produces a real PNG data URL', async () => {
    const url = await generateQrDataUrl('AM-1024');
    assert.ok(url.startsWith('data:image/png;base64,'), 'is a png data url');
    assert.ok(url.length > 100, 'has encoded content');
  });
});

describe('asset value builders', () => {
  it('prefers barcode, then asset id, then a generated id', () => {
    assert.equal(buildAssetBarcodeValue({ AM_Barcode: 'BC-1', AM_AssetId: 'AM-1', Id: 5 }), 'BC-1');
    assert.equal(buildAssetBarcodeValue({ AM_AssetId: 'AM-2', Id: 5 }), 'AM-2');
    assert.equal(buildAssetBarcodeValue({ Id: 5 }), 'AM-5');
    assert.equal(buildAssetBarcodeValue({}), '');
  });

  it('serializes the asset payload for QR encoding', () => {
    const payload = buildAssetQrValue({
      Id: 7,
      Title: 'Dell Laptop',
      AM_AssetId: 'AM-7',
      AM_Barcode: 'BC-7',
      AM_SerialNumber: 'SN-7'
    });
    assert.deepEqual(JSON.parse(payload), {
      id: 7,
      assetId: 'AM-7',
      barcode: 'BC-7',
      serial: 'SN-7',
      title: 'Dell Laptop'
    });
  });
});

describe('scan value parsing', () => {
  it('returns plain codes untouched', () => {
    assert.equal(parseScannedBarcode('  BC-7 '), 'BC-7');
    assert.equal(parseScannedBarcode(''), '');
  });

  it('extracts the best identifier from a QR JSON payload', () => {
    assert.equal(parseScannedBarcode(JSON.stringify({ barcode: 'BC-7', assetId: 'AM-7' })), 'BC-7');
    assert.equal(parseScannedBarcode(JSON.stringify({ assetId: 'AM-7' })), 'AM-7');
    assert.equal(parseScannedBarcode(JSON.stringify({ id: 7 })), 'AM-7');
  });
});

describe('asset lookup by scanned value', () => {
  const assets = [
    { Id: 1, AM_Barcode: 'BC-100', AM_AssetId: 'AM-1', AM_SerialNumber: 'SN-1' },
    { Id: 2, AM_AssetId: 'AM-2', AM_SerialNumber: 'SN-2' },
    { Id: 3 }
  ];

  it('matches on barcode, asset id, serial, and id (case-insensitive)', () => {
    assert.equal(findAssetByScanValue(assets, 'bc-100')?.Id, 1);
    assert.equal(findAssetByScanValue(assets, 'AM-2')?.Id, 2);
    assert.equal(findAssetByScanValue(assets, 'sn-1')?.Id, 1);
    assert.equal(findAssetByScanValue(assets, '3')?.Id, 3);
    assert.equal(findAssetByScanValue(assets, 'am-3')?.Id, 3);
  });

  it('returns undefined when nothing matches or input is blank', () => {
    assert.equal(findAssetByScanValue(assets, 'unknown'), undefined);
    assert.equal(findAssetByScanValue(assets, '   '), undefined);
  });

  it('resolves a QR payload end-to-end', () => {
    const raw = buildAssetQrValue({ Id: 1, AM_Barcode: 'BC-100', AM_AssetId: 'AM-1', AM_SerialNumber: 'SN-1' });
    const parsed = parseScannedBarcode(raw);
    assert.equal(findAssetByScanValue(assets, parsed)?.Id, 1);
  });
});
