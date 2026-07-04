#!/usr/bin/env node
/** Verify the canonical app display name is used in key manifests and constants. */

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './lib/readAppVersion.mjs';

const DISPLAY_NAME = 'Asset Management';
const PRODUCT_SLUG = 'asset-management';
const errors = [];

function readText(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function expectContains(relativePath, needle, label) {
  const text = readText(relativePath);
  if (!text.includes(needle)) {
    errors.push(`${label || relativePath} missing "${needle}"`);
  }
}

function expectMatch(relativePath, pattern, label) {
  const text = readText(relativePath);
  if (!pattern.test(text)) {
    errors.push(`${label || relativePath} does not match ${pattern}`);
  }
}

expectContains('config/package-solution.json', `"title": "${DISPLAY_NAME}"`, 'package-solution title');
expectContains(
  'src/webparts/assetManagement/AssetManagementWebPart.manifest.json',
  `"default": "${DISPLAY_NAME}"`,
  'web part manifest title'
);
expectMatch(
  'src/constants/spfxComponents.ts',
  /export const DEFAULT_APP_TITLE = 'Asset Management';/,
  'DEFAULT_APP_TITLE constant'
);

expectContains('config/package-solution.json', `${PRODUCT_SLUG}-client-side-solution`, 'package-solution product slug');

const pkgSolution = JSON.parse(readText('config/package-solution.json'));
if (pkgSolution.solution?.title !== DISPLAY_NAME) {
  errors.push(`package-solution solution.title is "${pkgSolution.solution?.title}"`);
}

if (errors.length > 0) {
  console.error('App display name check failed:\n');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`App display name OK: "${DISPLAY_NAME}"`);