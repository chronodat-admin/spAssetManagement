#!/usr/bin/env node
/**
 * Validate icon assets for Microsoft Store / Partner Center / SPFx / Teams consistency.
 *
 * References:
 * - Marketplace large logo: square PNG 216–350 px (Partner Center)
 * - SharePoint add-in package icon: 96×96 PNG
 * - Teams color icon: 192×192 PNG; outline: 32×32 white-on-transparent
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const errors = [];
const warnings = [];

const ICON_SPECS = [
  {
    rel: 'assets/brand/app-icon.png',
    width: 512,
    height: 512,
    label: 'Brand master',
  },
  {
    rel: 'assets/store/listing/logo-300x300.png',
    width: 300,
    height: 300,
    minSide: 216,
    maxSide: 350,
    label: 'Partner Center large logo',
  },
  {
    rel: 'sharepoint/app-icon.png',
    width: 96,
    height: 96,
    label: 'SPFx package / App Catalog',
    match: 'sharepoint/app-icon.png',
  },
  {
    rel: 'teams/app-icon.png',
    width: 96,
    height: 96,
    label: 'Teams ClientSideAssets catalog copy',
    match: 'sharepoint/app-icon.png',
  },
  {
    rel: 'teams/color.png',
    width: 192,
    height: 192,
    label: 'Teams manifest color icon',
  },
  {
    rel: 'teams/outline.png',
    width: 32,
    height: 32,
    label: 'Teams manifest outline icon',
  },
];

function readPngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    return { error: 'not a PNG file' };
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function md5(filePathOrBuffer) {
  const input = Buffer.isBuffer(filePathOrBuffer)
    ? filePathOrBuffer
    : fs.readFileSync(filePathOrBuffer);
  return crypto.createHash('md5').update(input).digest('hex');
}

function checkIcon(spec) {
  const filePath = path.join(root, spec.rel);
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing ${spec.label}: ${spec.rel} — run: npm run assets:icons`);
    return;
  }

  const size = readPngSize(filePath);
  if (size.error) {
    errors.push(`${spec.label} (${spec.rel}): ${size.error}`);
    return;
  }

  const expectedW = spec.width;
  const expectedH = spec.height;
  if (size.width !== expectedW || size.height !== expectedH) {
    errors.push(
      `${spec.label} (${spec.rel}): ${size.width}×${size.height} (need ${expectedW}×${expectedH})`
    );
  }

  if (spec.minSide && (size.width < spec.minSide || size.height < spec.minSide)) {
    errors.push(
      `${spec.label} (${spec.rel}): side ${Math.min(size.width, size.height)} px is below Partner Center minimum ${spec.minSide} px`
    );
  }
  if (spec.maxSide && (size.width > spec.maxSide || size.height > spec.maxSide)) {
    errors.push(
      `${spec.label} (${spec.rel}): side ${Math.max(size.width, size.height)} px exceeds Partner Center maximum ${spec.maxSide} px`
    );
  }

  if (spec.match) {
    const matchPath = path.join(root, spec.match);
    if (fs.existsSync(matchPath) && md5(filePath) !== md5(matchPath)) {
      errors.push(
        `${spec.label} (${spec.rel}) does not match ${spec.match} — run: npm run assets:icons`
      );
    }
  }
}

function checkTeamsAccent() {
  for (const rel of ['teams/manifest.json', 'm365/manifest.json']) {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
    const accent = String(manifest.accentColor || '').toLowerCase();
    if (accent !== '#f1dd00') {
      warnings.push(`${rel} accentColor is ${manifest.accentColor} (expected Chronodat gold #f1dd00).`);
    }
  }
}

function checkWebPartIcon() {
  const manifestPath = path.join(
    root,
    'src/webparts/assetManagement/AssetManagementWebPart.manifest.json'
  );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const iconUrl = manifest.preconfiguredEntries?.[0]?.iconImageUrl || '';
  if (!iconUrl.startsWith('data:image/png;base64,')) {
    errors.push('Web part manifest iconImageUrl is missing — run: npm run assets:icons');
    return;
  }

  const catalogPath = path.join(root, 'sharepoint/app-icon.png');
  if (!fs.existsSync(catalogPath)) {
    return;
  }

  const embedded = Buffer.from(iconUrl.replace('data:image/png;base64,', ''), 'base64');
  const catalog = fs.readFileSync(catalogPath);
  if (md5(embedded) !== md5(catalog)) {
    errors.push(
      'Web part toolbox icon does not match sharepoint/app-icon.png — run: npm run assets:icons'
    );
  }
}

console.log('Icon consistency (Microsoft Store / SPFx / Teams)\n');

for (const spec of ICON_SPECS) {
  checkIcon(spec);
}

checkTeamsAccent();
checkWebPartIcon();

if (warnings.length > 0) {
  console.warn('Warnings:');
  for (const warning of warnings) {
    console.warn(`  ⚠ ${warning}`);
  }
  console.warn('');
}

if (errors.length > 0) {
  console.error('Blocking issues:');
  for (const error of errors) {
    console.error(`  ✗ ${error}`);
  }
  console.error('\nFix: npm run assets:icons');
  process.exit(1);
}

console.log('All required icons exist, sized correctly, and catalog/toolbox copies match.');
console.log('Partner Center upload: assets/store/listing/logo-300x300.png');
