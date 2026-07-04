#!/usr/bin/env node
/** Fail if app version strings drift from config/package-solution.json. */

import fs from 'node:fs';
import path from 'node:path';
import { readAppVersion, readPackageSolution, REPO_ROOT } from './lib/readAppVersion.mjs';

const version = readAppVersion();
const PRODUCT_SLUG = 'asset-management';
const errors = [];

function readText(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

const packageJson = JSON.parse(readText('package.json'));
if (packageJson.version !== version) {
  errors.push(`package.json version is ${packageJson.version}, expected ${version}`);
}

const pkgSolution = readPackageSolution();
for (const feature of pkgSolution.solution.features || []) {
  if (feature.version !== version) {
    errors.push(`package-solution feature "${feature.title}" version is ${feature.version}, expected ${version}`);
  }
}

const appVersionTs = readText('src/utils/appVersion.ts');
const fallbackMatch = appVersionTs.match(/const FALLBACK_VERSION = '([^']+)';/);
if (!fallbackMatch || fallbackMatch[1] !== version) {
  errors.push(
    `src/utils/appVersion.ts FALLBACK_VERSION is ${fallbackMatch?.[1] || '(missing)'}, expected ${version}`
  );
}

const gulpfile = readText('gulpfile.js');
if (!gulpfile.includes("|| '1.0.0.0'") && gulpfile.includes("|| '1.0.1.0'")) {
  errors.push('gulpfile.js still uses 1.0.1.0 fallback — run sync:version or update getBuildVersion fallbacks');
}

const storeDoc = readText('docs/microsoft-store-submission.md');
if (!storeDoc.includes(`currently **${version}**`)) {
  errors.push(`docs/microsoft-store-submission.md checklist does not reference current version ${version}`);
}
if (!storeDoc.includes(`Current package version: **${version}**`)) {
  errors.push(`docs/microsoft-store-submission.md footer does not reference current version ${version}`);
}

if (errors.length > 0) {
  console.error('Version sync check failed:\n');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  console.error(`\nCanonical version: ${version} (config/package-solution.json)`);
  console.error('Run: npm run sync:version');
  process.exit(1);
}

console.log(`Version sync OK: ${version}`);
