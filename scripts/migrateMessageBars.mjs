/**
 * One-off codemod: replace common MessageBar patterns with PageNotifications / AppMessageBar.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'src');

const errorOnly = /\{\s*error\s*\?\s*\(\s*<MessageBar intent="error">\s*<MessageBarBody>\{error\}<\/MessageBarBody>\s*<\/MessageBar>\s*\)\s*:\s*null\s*\}/g;

const errorResult = /\{\s*error\s*\?\s*\(\s*<MessageBar intent="error">\s*<MessageBarBody>\{error\}<\/MessageBarBody>\s*<\/MessageBar>\s*\)\s*:\s*null\s*\}\s*\{\s*result\s*\?\s*\(\s*<MessageBar intent="success">\s*<MessageBarBody>\{result\}<\/MessageBarBody>\s*<\/MessageBar>\s*\)\s*:\s*null\s*\}/g;

const errorSuccess = /\{\s*error\s*\?\s*\(\s*<MessageBar intent="error">\s*<MessageBarBody>\{error\}<\/MessageBarBody>\s*<\/MessageBar>\s*\)\s*:\s*null\s*\}\s*\{\s*success\s*\?\s*\(\s*<MessageBar intent="success">\s*<MessageBarBody>\{success\}<\/MessageBarBody>\s*<\/MessageBar>\s*\)\s*:\s*null\s*\}/g;

const simpleBody = /<MessageBar intent="(error|success|warning|info)">\s*<MessageBarBody>\{([^}]+)\}<\/MessageBarBody>\s*<\/MessageBar>/g;

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
  const rel = path.relative(path.dirname(file), target).replace(/\\/g, '/').replace(/\.tsx?$/, '');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

function ensureImport(source, file, importPath, named) {
  if (source.includes(named)) return source;
  const importLine = `import { ${named} } from '${importPath}';\n`;
  const lastImport = [...source.matchAll(/^import .+;$/gm)].pop();
  if (lastImport) {
    const idx = lastImport.index + lastImport[0].length;
    return source.slice(0, idx + 1) + importLine + source.slice(idx + 1);
  }
  return importLine + source;
}

function stripMessageBarImports(source) {
  if (/<MessageBar[\s>]/.test(source)) return source;
  return source
    .replace(/,\s*MessageBarBody/g, '')
    .replace(/MessageBarBody,\s*/g, '')
    .replace(/,\s*MessageBar/g, '')
    .replace(/MessageBar,\s*/g, '')
    .replace(/\{\s*,\s*/g, '{ ')
    .replace(/,\s*\}/g, ' }');
}

const files = walk(root);
let changed = 0;

for (const file of files) {
  if (file.includes('AppMessageBar.tsx') || file.includes('PageNotifications.tsx')) continue;

  let source = fs.readFileSync(file, 'utf8');
  const original = source;

  if (errorResult.test(source)) {
    source = source.replace(errorResult, '<PageNotifications error={error || undefined} success={result || undefined} />');
    source = ensureImport(source, file, relativeImport(file, path.join(root, 'components/Layout/PageNotifications.tsx')), 'PageNotifications');
  }

  if (errorSuccess.test(source)) {
    source = source.replace(errorSuccess, '<PageNotifications error={error || undefined} success={success || undefined} />');
    source = ensureImport(source, file, relativeImport(file, path.join(root, 'components/Layout/PageNotifications.tsx')), 'PageNotifications');
  }

  if (errorOnly.test(source)) {
    source = source.replace(errorOnly, '<PageNotifications error={error || undefined} />');
    source = ensureImport(source, file, relativeImport(file, path.join(root, 'components/Layout/PageNotifications.tsx')), 'PageNotifications');
  }

  // Generic single-line MessageBar with variable body -> AppMessageBar
  source = source.replace(simpleBody, (_, intent, expr) => `<AppMessageBar intent="${intent}">{${expr.trim()}}</AppMessageBar>`);
  if (source.includes('<AppMessageBar') && !original.includes('<AppMessageBar')) {
    source = ensureImport(source, file, relativeImport(file, path.join(root, 'components/Layout/AppMessageBar.tsx')), 'AppMessageBar');
  }

  source = stripMessageBarImports(source);

  if (source !== original) {
    fs.writeFileSync(file, source);
    changed++;
    console.log('updated', path.relative(root, file));
  }
}

console.log(`Done. ${changed} file(s) updated.`);
