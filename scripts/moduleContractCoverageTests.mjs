import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventory = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts', 'sourceInventory.json'), 'utf8')
);

function listSourceFiles() {
  return inventory;
}

function readSource(relativePath) {
  return fs.readFileSync(path.join(root, 'src', relativePath), 'utf8');
}

describe('source module contracts', () => {
  const files = listSourceFiles();

  for (const file of files) {
    it(`loads ${file}`, () => {
      const source = readSource(file);
      assert.equal(source.trim().length > 0, true, `${file} is empty`);
      assert.match(source, /export /);
    });
  }
});
