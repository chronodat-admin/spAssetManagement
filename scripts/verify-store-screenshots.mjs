#!/usr/bin/env node
/**
 * Validate Partner Center screenshot dimensions (exactly 1366×768 PNG, ≤ 1024 KB).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const PRODUCT_SLUG = 'asset-management'; // canonical marketplace product slug

const TARGET_W = 1366;
const TARGET_H = 768;
const MAX_KB = 1024;

const MARKETING_DIR = path.join(root, 'assets/store/listing/screenshots/marketing');

const REQUIRED = [
  'dashboard-1366x768.png',
  'feature-grid-1366x768.png',
  'compliance-1366x768.png',
  'analysis-1366x768.png',
  'all-features-1366x768.png',
];

function readPngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  const sig = buf.subarray(0, 8).toString('hex');
  if (sig !== '89504e470d0a1a0a') {
    return { error: 'not a PNG file' };
  }
  // IHDR starts at byte 8: length(4) + type(4) + data(13)
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  return { width: w, height: h };
}

function checkFile(name) {
  const filePath = path.join(MARKETING_DIR, name);
  if (!fs.existsSync(filePath)) {
    return { name, ok: false, message: 'missing file' };
  }
  const kb = fs.statSync(filePath).size / 1024;
  const size = readPngSize(filePath);
  if (size.error) {
    return { name, ok: false, message: size.error };
  }
  if (size.width !== TARGET_W || size.height !== TARGET_H) {
    return {
      name,
      ok: false,
      message: `invalid size ${size.width}×${size.height} (need exactly ${TARGET_W}×${TARGET_H})`,
    };
  }
  if (kb > MAX_KB) {
    return { name, ok: false, message: `${kb.toFixed(0)} KB exceeds ${MAX_KB} KB cap` };
  }
  return { name, ok: true, message: `${TARGET_W}×${TARGET_H}, ${kb.toFixed(0)} KB` };
}

console.log('Partner Center screenshot validation\n');
console.log(`Upload ONLY files from:\n  ${MARKETING_DIR}\n`);
console.log('Do NOT upload assets/website/marketing/*-ai.png (1536×1024 masters).\n');

let failed = 0;
for (const name of REQUIRED) {
  const result = checkFile(name);
  const icon = result.ok ? '✓' : '✗';
  console.log(`  ${icon} ${name} — ${result.message}`);
  if (!result.ok) {
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} screenshot(s) failed validation. Run: npm run assets:marketing:crops`);
  process.exit(1);
}

console.log('\nAll required screenshots are Partner Center ready.');
