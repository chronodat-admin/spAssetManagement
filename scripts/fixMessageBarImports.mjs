import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'src');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') walk(full, files);
    } else if (entry.name.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

function relativeImport(file, target) {
  let rel = path.relative(path.dirname(file), target).replace(/\\/g, '/').replace(/\.tsx?$/, '');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

function ensureNamedImport(source, file, targetFile, named) {
  if (!source.includes(`<${named}`) && !source.includes(`${named} `)) {
    return source;
  }
  if (source.includes(`import { ${named} }`) || source.includes(`, ${named}`) && source.includes(`from '${relativeImport(file, targetFile)}'`)) {
    return source;
  }
  if (new RegExp(`import\\s*\\{[^}]*\\b${named}\\b`).test(source)) {
    return source;
  }

  const importPath = relativeImport(file, targetFile);
  const importLine = `import { ${named} } from '${importPath}';\n`;
  const lastImport = [...source.matchAll(/^import .+;$/gm)].pop();
  if (lastImport) {
    const idx = lastImport.index + lastImport[0].length;
    return source.slice(0, idx + 1) + importLine + source.slice(idx + 1);
  }
  return importLine + source;
}

const appMessageBar = path.join(root, 'components/Layout/AppMessageBar.tsx');
const pageNotifications = path.join(root, 'components/Layout/PageNotifications.tsx');

let fixed = 0;
for (const file of walk(root)) {
  if (file.includes('AppMessageBar.tsx') || file.includes('PageNotifications.tsx')) continue;
  const original = fs.readFileSync(file, 'utf8');
  let source = original;
  source = ensureNamedImport(source, file, appMessageBar, 'AppMessageBar');
  source = ensureNamedImport(source, file, pageNotifications, 'PageNotifications');
  if (source !== original) {
    fs.writeFileSync(file, source);
    fixed++;
    console.log('fixed imports:', path.relative(root, file));
  }
}

console.log(`Fixed ${fixed} file(s).`);
