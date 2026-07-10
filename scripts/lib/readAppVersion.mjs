import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PACKAGE_SOLUTION_PATH = path.join(ROOT, 'config', 'package-solution.json');

/** Canonical app version from config/package-solution.json (e.g. 1.0.0.0). */
export function readAppVersion() {
  const raw = fs.readFileSync(PACKAGE_SOLUTION_PATH, 'utf8');
  const pkg = JSON.parse(raw);
  const version = String(pkg?.solution?.version || '').trim();
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`Invalid solution.version in ${PACKAGE_SOLUTION_PATH}: ${version || '(empty)'}`);
  }
  return version;
}

export function readPackageSolution() {
  const raw = fs.readFileSync(PACKAGE_SOLUTION_PATH, 'utf8');
  return JSON.parse(raw);
}

export const REPO_ROOT = ROOT;
