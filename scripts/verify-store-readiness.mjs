#!/usr/bin/env node
/**
 * Pre-submission checks for Microsoft Commercial Marketplace / AppSource.
 * Exit code 1 when blocking issues remain.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const errors = [];
const warnings = [];

const PRODUCT_SLUG = 'asset-management';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function isPlaceholderUrl(value) {
  if (!value || typeof value !== 'string') {
    return true;
  }
  const lower = value.toLowerCase();
  return (
    lower.includes('your-product') ||
    lower.includes('privacy.microsoft.com') ||
    lower.includes('servicesagreement') ||
    lower.includes('microsoft.com/microsoft-365')
  );
}

function isPlaceholderMpn(value) {
  if (!value || typeof value !== 'string') {
    return true;
  }
  return value.startsWith('Undefined-') || value.includes('YOUR-PARTNER') || value.includes('YOUR-REAL');
}

console.log('Asset Management — store submission readiness\n');

if (!exists('config/publisher.json')) {
  errors.push('Missing config/publisher.json (copy from config/publisher.example.json).');
} else {
  const publisher = readJson('config/publisher.json');
  for (const field of ['name', 'websiteUrl', 'privacyUrl', 'termsOfUseUrl', 'supportUrl']) {
    if (!publisher[field]) {
      errors.push(`config/publisher.json → ${field} is empty.`);
    } else if (field !== 'name' && isPlaceholderUrl(publisher[field])) {
      errors.push(`config/publisher.json → ${field} still uses a placeholder URL.`);
    }
  }
  if (isPlaceholderMpn(publisher.mpnId)) {
    warnings.push('config/publisher.json → mpnId is not set (required before Partner Center upload).');
  }
}

const packageSolution = readJson('config/package-solution.json');
if (!packageSolution.solution?.name?.includes(PRODUCT_SLUG)) {
  errors.push(`package-solution.json solution.name should include product slug "${PRODUCT_SLUG}" (got "${packageSolution.solution?.name ?? '(missing)'}").`);
}
const dev = packageSolution.solution.developer ?? {};
for (const field of ['websiteUrl', 'privacyUrl', 'termsOfUseUrl']) {
  if (!dev[field]) {
    errors.push(`package-solution.json developer.${field} is empty — run npm run sync:publisher.`);
  } else if (isPlaceholderUrl(dev[field])) {
    errors.push(`package-solution.json developer.${field} still uses a placeholder URL — run npm run sync:publisher.`);
  }
}
if (isPlaceholderMpn(dev.mpnId)) {
  warnings.push('package-solution.json developer.mpnId is still a placeholder — run npm run sync:publisher.');
}
if (!packageSolution.solution.metadata?.categories?.length) {
  errors.push('package-solution.json metadata.categories is empty.');
}

const screenshotPaths = packageSolution.solution.metadata?.screenshotPaths ?? [];
if (screenshotPaths.length > 0) {
  errors.push(
    'package-solution.json metadata.screenshotPaths must be empty — listing screenshots belong in assets/store/listing/ only (see People Hub / spEmployeeDirectory).'
  );
}

if (!exists('sharepoint/assets/asset-management-icon-96.png')) {
  errors.push('Missing sharepoint/assets/asset-management-icon-96.png — run npm run assets:sppkg.');
}

if (exists('assets/store/listing/screenshots')) {
  const listingShots = fs
    .readdirSync(path.join(root, 'assets/store/listing/screenshots'), { recursive: true })
    .filter((f) => typeof f === 'string' && f.endsWith('.png'));
  if (listingShots.length < 3) {
    warnings.push('assets/store/listing/screenshots has fewer than 3 PNG screenshots for Partner Center.');
  }
} else {
  warnings.push('Missing assets/store/listing/screenshots — add Partner Center listing images before submit.');
}

if (!exists('sharepoint/solution/asset-management.sppkg')) {
  warnings.push('sharepoint/solution/asset-management.sppkg not found — run npm run ship.');
}

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
  console.error('\nFix the issues above, then run: npm run sync:publisher && npm run verify:store');
  process.exit(1);
}

console.log('Store readiness check passed (no blocking errors).');
