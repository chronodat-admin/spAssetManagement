#!/usr/bin/env node
/**
 * Verify the built .sppkg matches the package shape that successfully syncs
 * through the SharePoint App Catalog "Sync to Teams" button.
 * Exit code 1 when blocking issues remain.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readPackageSolution } from './lib/readAppVersion.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const errors = [];
const warnings = [];

const SPPKG = path.join(root, 'sharepoint/solution/asset-management.sppkg');
const WEBPART_ID = '4fa4ca04-c98a-4723-8671-f69956f65f26';

function readZipEntries(zipPath) {
  const python = `import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); print('\\n'.join(z.namelist()))`;
  const out = execFileSync('python', ['-c', python, zipPath], { encoding: 'utf8' });
  return out.split(/\r?\n/).filter(Boolean);
}

function readZipText(zipPath, entry) {
  const python = `import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); print(z.read(sys.argv[2]).decode('utf-8','replace'))`;
  return execFileSync('python', ['-c', python, zipPath, entry], { encoding: 'utf8' });
}

function readZipJson(zipPath, outerEntry, innerEntry) {
  const python = `import zipfile,sys,json; z=zipfile.ZipFile(sys.argv[1]); inner=zipfile.ZipFile(z.open(sys.argv[2])); print(inner.read(sys.argv[3]).decode())`;
  return JSON.parse(execFileSync('python', ['-c', python, zipPath, outerEntry, innerEntry], { encoding: 'utf8' }));
}

console.log('Asset Management Hub — Sync to Teams package check\n');

const pkg = readPackageSolution();
if (pkg.solution?.isDomainIsolated) {
  errors.push('package-solution.json → isDomainIsolated must be false for Teams sync.');
}
if (!pkg.solution?.skipFeatureDeployment) {
  errors.push('package-solution.json → skipFeatureDeployment must be true for tenant-wide Teams sync.');
}

const manifestPath = path.join(root, 'src/webparts/assetManagement/AssetManagementWebPart.manifest.json');
const webPartManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const hosts = webPartManifest.supportedHosts ?? [];
for (const required of ['TeamsTab', 'TeamsPersonalApp']) {
  if (!hosts.includes(required)) {
    errors.push(`Web part manifest missing supportedHosts entry: ${required}`);
  }
}

if (!fs.existsSync(path.join(root, 'teams/TeamsSPFxApp.zip'))) {
  errors.push('teams/TeamsSPFxApp.zip missing — run npm run teams:package:m365');
}

if (!fs.existsSync(SPPKG)) {
  errors.push('sharepoint/solution/asset-management.sppkg missing — run npm run ship');
} else {
  const entries = readZipEntries(SPPKG);
  const teamsPackageEntry = 'ClientSideAssets/TeamsSPFxApp.zip';
  if (!entries.includes(teamsPackageEntry)) {
    errors.push(
      'Built .sppkg is missing ClientSideAssets/TeamsSPFxApp.zip. ' +
        'Run npm run teams:package:m365, then npm run ship.'
    );
  }
  if (entries.includes('teams/TeamsSPFxApp.zip')) {
    errors.push(
      'Built .sppkg contains teams/TeamsSPFxApp.zip at the package root. ' +
        'Do not run fix:sppkg-teams; the Risk-style ClientSideAssets package shape is the one that synced successfully.'
    );
  }

  const webPartXml = entries.find((n) => n.includes(WEBPART_ID) && n.endsWith('.xml'));
  if (webPartXml) {
    const xml = readZipText(SPPKG, webPartXml);
    if (!xml.includes('TeamsTab') || !xml.includes('TeamsPersonalApp')) {
      errors.push(`Packaged web part XML (${webPartXml}) does not declare Teams hosts.`);
    }
  } else {
    warnings.push(`Could not find packaged web part XML for ${WEBPART_ID}.`);
  }

  const appManifest = readZipText(SPPKG, 'AppManifest.xml');
  if (appManifest.includes('IsDomainIsolated="true"')) {
    errors.push('Packaged AppManifest.xml has IsDomainIsolated="true".');
  }
  if (!appManifest.includes('SkipFeatureDeployment="true"')) {
    errors.push('Packaged AppManifest.xml is missing SkipFeatureDeployment="true".');
  }

  if (entries.includes(teamsPackageEntry)) {
    try {
      const teamsManifest = readZipJson(SPPKG, teamsPackageEntry, 'manifest.json');
      const version = teamsManifest.version ?? '';
      if (!/^\d+\.\d+\.\d+$/.test(version)) {
        errors.push(
          `${teamsPackageEntry} manifest version must be 3-part (e.g. 1.0.23), got "${version}". ` +
            'Run npm run sync:version.'
        );
      }
      if (teamsManifest.id !== pkg.solution.id) {
        errors.push(`${teamsPackageEntry} manifest id must match solution id.`);
      }
      const contentUrl = teamsManifest.staticTabs?.[0]?.contentUrl ?? '';
      if (!contentUrl.includes(WEBPART_ID)) {
        errors.push(`${teamsPackageEntry} staticTabs contentUrl does not reference the web part id.`);
      }
    } catch (err) {
      errors.push(`Could not read ${teamsPackageEntry} manifest: ${err.message}`);
    }
  }
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
  console.error('\nRebuild with: npm run ship');
  console.error('Then in the tenant App Catalog: Deploy (tenant-wide) → Sync to Teams.');
  process.exit(1);
}

console.log('Sync to Teams package check passed.');
console.log('Catalog steps: upload .sppkg → Deploy (all sites) → Sync to Teams.');
console.log('Important: do not run fix:sppkg-teams before uploading; the unmodified SPFx package shape is required.');
