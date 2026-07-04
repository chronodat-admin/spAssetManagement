#!/usr/bin/env node
/** Remove stale SPFx output folders before production ship (Windows-safe). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function rmDir(relativePath) {
  const target = path.join(root, relativePath);
  if (!fs.existsSync(target)) {
    return;
  }
  fs.rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  console.log(`Removed ${relativePath}`);
}

for (const dir of ['release', 'dist', 'temp/build', 'sharepoint/solution/debug']) {
  rmDir(dir);
}
