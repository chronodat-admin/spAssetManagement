#!/usr/bin/env node
/**
 * Sync config/publisher.json into config/package-solution.json developer fields.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(relativePath, data) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

const publisherPath = path.join(root, 'config', 'publisher.json');
if (!fs.existsSync(publisherPath)) {
  console.error('Missing config/publisher.json — copy config/publisher.example.json and set your MPN ID.');
  process.exit(1);
}

const publisher = readJson('config/publisher.json');
const developerFields = {
  name: publisher.name,
  websiteUrl: publisher.websiteUrl,
  privacyUrl: publisher.privacyUrl,
  termsOfUseUrl: publisher.termsOfUseUrl,
  mpnId: publisher.mpnId || 'Undefined-1.21.1'
};

const packageSolution = readJson('config/package-solution.json');
packageSolution.solution.developer = { ...packageSolution.solution.developer, ...developerFields };
writeJson('config/package-solution.json', packageSolution);
console.log('Updated config/package-solution.json developer fields from config/publisher.json');

if (!publisher.mpnId) {
  console.warn('\nWarning: config/publisher.json mpnId is empty. Set your Partner Center MPN ID before submitting.');
}
