#!/usr/bin/env node
/**
 * Sync solution.version from config/package-solution.json into package.json,
 * src/utils/appVersion.ts fallback, feature version, and store docs.
 *
 * Usage: node scripts/sync-version.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { readAppVersion, readPackageSolution, REPO_ROOT } from './lib/readAppVersion.mjs';

const version = readAppVersion();

function writeJson(relativePath, mutator) {
  const filePath = path.join(REPO_ROOT, relativePath);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  mutator(data);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`Updated ${relativePath}`);
}

// package.json
writeJson('package.json', (pkg) => {
  pkg.version = version;
});

// package-solution feature version
writeJson('config/package-solution.json', (pkg) => {
  pkg.solution.version = version;
  for (const feature of pkg.solution.features || []) {
    feature.version = version;
  }
});

// appVersion.ts fallback
const appVersionPath = path.join(REPO_ROOT, 'src', 'utils', 'appVersion.ts');
let appVersionSource = fs.readFileSync(appVersionPath, 'utf8');
appVersionSource = appVersionSource.replace(
  /const FALLBACK_VERSION = '[^']+';/,
  `const FALLBACK_VERSION = '${version}';`
);
appVersionSource = appVersionSource.replace(
  /\/\*\* Display label for the shell footer, e\.g\. v[^*]+ \*\//,
  `/** Display label for the shell footer, e.g. v${version}-abc1234 */`
);
fs.writeFileSync(appVersionPath, appVersionSource, 'utf8');
console.log('Updated src/utils/appVersion.ts');

// Store submission doc — current version lines
const storeDocPath = path.join(REPO_ROOT, 'docs', 'microsoft-store-submission.md');
let storeDoc = fs.readFileSync(storeDocPath, 'utf8');
storeDoc = storeDoc.replace(
  /- \[ \] Bump `version` in `config\/package-solution\.json`[^(\n]*\(currently \*\*[^*]+\*\*\)/,
  `- [ ] Bump \`version\` in \`config/package-solution.json\` before each store upload (currently **${version}**)`
);
storeDoc = storeDoc.replace(
  /Current package version: \*\*[^*]+\*\*/,
  `Current package version: **${version}**`
);
fs.writeFileSync(storeDocPath, storeDoc, 'utf8');
console.log('Updated docs/microsoft-store-submission.md');

// Teams / Microsoft 365 app manifests require a 3-part "#.#.#" version whose first
// segment is not 0 (Teams rejects the 4-part SPFx solution version with a 400 on
// "Sync to Teams"). Solution versions bump the build segment (major.minor.patch.build),
// so map to major.minor.build to keep the Teams version valid and monotonic.
const versionParts = version.split('.');
const teamsVersion =
  versionParts.length >= 4
    ? `${versionParts[0]}.${versionParts[1]}.${versionParts[3]}`
    : version;

for (const manifestRelPath of ['teams/manifest.json', 'm365/manifest.json']) {
  writeJson(manifestRelPath, (manifest) => {
    manifest.version = teamsVersion;
  });
}
console.log(`Teams/M365 manifest version: ${teamsVersion}`);

console.log(`Version sync complete: ${version}`);
